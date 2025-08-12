import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionFromRequest, verifySessionFromCookies, createSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const UpdateSelfSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const session = (await verifySessionFromCookies()) || (await verifySessionFromRequest(req));
  if (!session) {
    const hasHeader = !!req.headers.get("cookie");
    const hasNextCookie = !!req.cookies.get("session")?.value;
    console.log(
      `LOG =====> Unauthorized GET /api/users (hasHeader=${hasHeader} hasNextCookie=${hasNextCookie})`
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: users.avatarUrl,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      console.log("LOG =====> Unauthorized PUT /api/users");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = UpdateSelfSchema.parse(body);
    const updateData: Record<string, unknown> = {};
    if (typeof parsed.email !== "undefined") updateData.email = parsed.email;
    if (typeof parsed.firstName !== "undefined") updateData.firstName = parsed.firstName;
    if (typeof parsed.lastName !== "undefined") updateData.lastName = parsed.lastName;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.userId))
      .returning({ id: users.id });

    const [fresh] = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    if (fresh) {
      const cookie = await createSessionCookie({
        userId: fresh.id,
        email: fresh.email,
        firstName: fresh.firstName,
        lastName: fresh.lastName,
        isAdmin: fresh.isAdmin,
      });
      const res = NextResponse.json({ ok: true });
      res.headers.append("Set-Cookie", cookie);
      console.log(`LOG =====> User updated profile ${updated.id}`);
      return res;
    }
    console.log(`LOG =====> User updated profile ${updated.id}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Update profile error: ${message}`);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
  }
}


