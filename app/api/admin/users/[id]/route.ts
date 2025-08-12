import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { verifySessionFromRequest } from "@/lib/auth";

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  isAdmin: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session || !session.isAdmin) {
    console.log("LOG =====> Unauthorized GET /api/admin/users/:id");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const usersIdx = parts.indexOf("users");
  const id = usersIdx >= 0 ? parts[usersIdx + 1] : "";
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session || !session.isAdmin) {
      console.log("LOG =====> Unauthorized PUT /api/admin/users/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const usersIdx = parts.indexOf("users");
    const id = usersIdx >= 0 ? parts[usersIdx + 1] : "";
    const body = await req.json();
    const parsed = UpdateUserSchema.parse(body);
    const data: Record<string, unknown> = {};
    if (typeof parsed.email !== "undefined") data.email = parsed.email;
    if (typeof parsed.firstName !== "undefined") data.firstName = parsed.firstName;
    if (typeof parsed.lastName !== "undefined") data.lastName = parsed.lastName;
    if (typeof parsed.isAdmin !== "undefined") data.isAdmin = parsed.isAdmin;
    if (typeof parsed.password !== "undefined") data.passwordHash = await hashPassword(parsed.password);
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email });
    console.log(`LOG =====> Admin updated user ${updated.email}`);
    return NextResponse.json({ id: updated.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Update user error: ${message}`);
    return NextResponse.json({ error: "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session || !session.isAdmin) {
      console.log("LOG =====> Unauthorized DELETE /api/admin/users/:id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const usersIdx = parts.indexOf("users");
    const id = usersIdx >= 0 ? parts[usersIdx + 1] : "";
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ email: users.email });
    console.log(`LOG =====> Admin deleted user ${deleted?.email}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Delete user error: ${message}`);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 400 });
  }
}


