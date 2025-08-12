import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

const CreateAdSchema = z.object({
  adId: z.string().min(1),
  adName: z.string().optional().nullable(),
  adsetId: z.string().optional().nullable(),
  adsetName: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  campaignName: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),
  formName: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    console.log("LOG =====> Unauthorized GET /api/ads");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: ads.id,
      adId: ads.adId,
      adName: ads.adName,
      adsetId: ads.adsetId,
      adsetName: ads.adsetName,
      campaignId: ads.campaignId,
      campaignName: ads.campaignName,
      formId: ads.formId,
      formName: ads.formName,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .orderBy(desc(ads.createdAt))
    .limit(500);
  return NextResponse.json({ ads: rows });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized POST /api/ads");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const payload = CreateAdSchema.parse(body);
    const [created] = await db
      .insert(ads)
      .values({
        adId: payload.adId,
        adName: payload.adName || null,
        adsetId: payload.adsetId || null,
        adsetName: payload.adsetName || null,
        campaignId: payload.campaignId || null,
        campaignName: payload.campaignName || null,
        formId: payload.formId || null,
        formName: payload.formName || null,
      })
      .returning({ id: ads.id, adId: ads.adId });
    console.log(`LOG =====> User created ad ${created.adId}`);
    return NextResponse.json({ id: created.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Create ad error: ${message}`);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 400 });
  }
}


