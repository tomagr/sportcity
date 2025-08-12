import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

const UpdateLeadSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  age: z.string().optional().nullable(),
  clubId: z.string().uuid().optional().nullable(),
});

function extractIdFromUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("leads");
  const id = idx >= 0 ? parts[idx + 1] : "";
  return id;
}

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    console.log("LOG =====> Unauthorized GET /api/leads/:id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = extractIdFromUrl(req);
  const [row] = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      clubId: leads.clubId,
      createdTime: leads.createdTime,
    })
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead: row });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized PUT /api/leads/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const body = await req.json();
    const parsed = UpdateLeadSchema.parse(body);
    const data: Record<string, unknown> = {};
    if (typeof parsed.firstName !== "undefined") data.firstName = parsed.firstName;
    if (typeof parsed.lastName !== "undefined") data.lastName = parsed.lastName;
    if (typeof parsed.email !== "undefined") data.email = parsed.email;
    if (typeof parsed.phoneNumber !== "undefined") data.phoneNumber = parsed.phoneNumber;
    if (typeof parsed.age !== "undefined") data.age = parsed.age;
    if (typeof parsed.clubId !== "undefined") data.clubId = parsed.clubId;
    const [updated] = await db
      .update(leads)
      .set(data)
      .where(eq(leads.id, id))
      .returning({ id: leads.id });
    console.log(`LOG =====> User updated lead ${updated.id}`);
    return NextResponse.json({ id: updated.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Update lead error: ${message}`);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized DELETE /api/leads/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const [deleted] = await db
      .delete(leads)
      .where(eq(leads.id, id))
      .returning({ id: leads.id });
    console.log(`LOG =====> User deleted lead ${deleted?.id}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Delete lead error: ${message}`);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 400 });
  }
}


