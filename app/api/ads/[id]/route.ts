import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

const UpdateAdSchema = z.object({
  adId: z.string().min(1).optional(),
  adName: z.string().optional().nullable(),
  adsetId: z.string().optional().nullable(),
  adsetName: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  campaignName: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),
  formName: z.string().optional().nullable(),
});

function extractIdFromUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("ads");
  const id = idx >= 0 ? parts[idx + 1] : "";
  return id;
}

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    console.log("LOG =====> Unauthorized GET /api/ads/:id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = extractIdFromUrl(req);
  const [row] = await db
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
    .where(eq(ads.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ad: row });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized PUT /api/ads/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const body = await req.json();
    const parsed = UpdateAdSchema.parse(body);
    const data: Record<string, unknown> = {};
    if (typeof parsed.adId !== "undefined") data.adId = parsed.adId;
    if (typeof parsed.adName !== "undefined") data.adName = parsed.adName;
    if (typeof parsed.adsetId !== "undefined") data.adsetId = parsed.adsetId;
    if (typeof parsed.adsetName !== "undefined") data.adsetName = parsed.adsetName;
    if (typeof parsed.campaignId !== "undefined") data.campaignId = parsed.campaignId;
    if (typeof parsed.campaignName !== "undefined") data.campaignName = parsed.campaignName;
    if (typeof parsed.formId !== "undefined") data.formId = parsed.formId;
    if (typeof parsed.formName !== "undefined") data.formName = parsed.formName;
    const [updated] = await db
      .update(ads)
      .set(data)
      .where(eq(ads.id, id))
      .returning({ id: ads.id, adId: ads.adId });
    console.log(`LOG =====> User updated ad ${updated.adId}`);
    return NextResponse.json({ id: updated.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Update ad error: ${message}`);
    return NextResponse.json({ error: "Failed to update ad" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized DELETE /api/ads/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const [deleted] = await db
      .delete(ads)
      .where(eq(ads.id, id))
      .returning({ adId: ads.adId });
    console.log(`LOG =====> User deleted ad ${deleted?.adId}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Delete ad error: ${message}`);
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 400 });
  }
}


