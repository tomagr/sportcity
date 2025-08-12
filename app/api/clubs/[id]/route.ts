import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

const UpdateClubSchema = z.object({
  name: z.string().min(1).optional(),
  nutritionEmail: z.string().email().nullable().optional(),
  kidsEmail: z.string().email().nullable().optional(),
});

function extractIdFromUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const clubsIdx = parts.indexOf("clubs");
  const id = clubsIdx >= 0 ? parts[clubsIdx + 1] : "";
  return id;
}

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    console.log("LOG =====> Unauthorized GET /api/clubs/:id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = extractIdFromUrl(req);
  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ club });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized PUT /api/clubs/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const body = await req.json();
    const parsed = UpdateClubSchema.parse(body);
    const data: Record<string, unknown> = {};
    if (typeof parsed.name !== "undefined") data.name = parsed.name;
    if (typeof parsed.nutritionEmail !== "undefined") data.nutritionEmail = parsed.nutritionEmail;
    if (typeof parsed.kidsEmail !== "undefined") data.kidsEmail = parsed.kidsEmail;
    const [updated] = await db
      .update(clubs)
      .set(data)
      .where(eq(clubs.id, id))
      .returning({ id: clubs.id, name: clubs.name });
    console.log(`LOG =====> User updated club ${updated.name}`);
    return NextResponse.json({ id: updated.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Update club error: ${message}`);
    return NextResponse.json({ error: "Failed to update club" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized DELETE /api/clubs/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = extractIdFromUrl(req);
    const [deleted] = await db
      .delete(clubs)
      .where(eq(clubs.id, id))
      .returning({ name: clubs.name });
    console.log(`LOG =====> User deleted club ${deleted?.name}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Delete club error: ${message}`);
    return NextResponse.json({ error: "Failed to delete club" }, { status: 400 });
  }
}


