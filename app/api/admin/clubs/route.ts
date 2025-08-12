import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

const CreateClubSchema = z.object({
  name: z.string().min(1),
  nutritionEmail: z.string().email().optional().nullable(),
  kidsEmail: z.string().email().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session || !session.isAdmin) {
    console.log("LOG =====> Unauthorized GET /api/admin/clubs");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .orderBy(desc(clubs.createdAt))
    .limit(500);
  return NextResponse.json({ clubs: rows });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session || !session.isAdmin) {
      console.log("LOG =====> Unauthorized POST /api/admin/clubs");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, nutritionEmail, kidsEmail } = CreateClubSchema.parse(body);
    const [created] = await db
      .insert(clubs)
      .values({ name, nutritionEmail: nutritionEmail || null, kidsEmail: kidsEmail || null })
      .returning({ id: clubs.id, name: clubs.name });
    console.log(`LOG =====> Admin created club ${created.name}`);
    return NextResponse.json({ id: created.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Create club error: ${message}`);
    return NextResponse.json({ error: "Failed to create club" }, { status: 400 });
  }
}


