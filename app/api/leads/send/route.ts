import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { clubs, leads } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";
import { sendClubLeadsEmail } from "@/lib/email";

const BodySchema = z.union([
  z.object({
    ids: z.array(z.string().uuid()).min(1),
    target: z.enum(["kids", "nutrition"]).default("kids"),
  }),
  z.object({
    all: z.literal(true),
    target: z.enum(["kids", "nutrition"]).default("kids"),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized POST /api/leads/send");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = BodySchema.parse(await req.json());

    // Load leads joined with clubs
    const baseQuery = db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        phoneNumber: leads.phoneNumber,
        age: leads.age,
        createdTime: leads.createdTime,
        clubId: leads.clubId,
        clubName: clubs.name,
        kidsEmail: clubs.kidsEmail,
        nutritionEmail: clubs.nutritionEmail,
      })
      .from(leads)
      .leftJoin(clubs, eq(leads.clubId, clubs.id));

    const rows = "all" in parsed && parsed.all
      ? await baseQuery
      : await baseQuery.where(inArray(leads.id, parsed.ids));

    // Group by clubId (including null) since destination email depends on club
    const clubIdToLeads = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = row.clubId ?? "__no_club__";
      const list = clubIdToLeads.get(key) ?? [];
      list.push(row);
      clubIdToLeads.set(key, list);
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const [clubKey, clubLeads] of clubIdToLeads.entries()) {
      const clubName = clubLeads[0]?.clubName ?? "Unknown Club";
      const toEmail = parsed.target === "kids" ? clubLeads[0]?.kidsEmail : clubLeads[0]?.nutritionEmail;
      if (!toEmail) {
        skipped += clubLeads.length;
        console.log(
          `LOG =====> Skipping ${clubLeads.length} lead(s) for club ${clubName} due to missing ${parsed.target}_email`
        );
        continue;
      }
      try {
        await sendClubLeadsEmail({
          toEmail,
          clubName,
          leads: clubLeads.map((l) => ({
            firstName: l.firstName ?? null,
            lastName: l.lastName ?? null,
            email: l.email ?? null,
            phoneNumber: l.phoneNumber ?? null,
            age: l.age ?? null,
            createdTime: l.createdTime ?? null,
          })),
          target: parsed.target,
        });
        // On successful send, mark these leads as sent
        const sentIds = clubLeads.map((l) => l.id);
        if (sentIds.length > 0) {
          await db.update(leads).set({ sent: true }).where(inArray(leads.id, sentIds));
          console.log(`LOG =====> Marked sent for ${sentIds.length} lead(s) in club ${clubName}`);
        }
        sent += clubLeads.length;
      } catch (e) {
        errors += clubLeads.length;
        console.log("LOG =====> Error sending club leads email", e);
      }
    }

    console.log(`LOG =====> Club lead emails result: sent=${sent}, skipped=${skipped}, errors=${errors}`);
    return NextResponse.json({ ok: true, sent, skipped, errors });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Send leads error: ${message}`);
    return NextResponse.json({ error: "Failed to send leads" }, { status: 400 });
  }
}


