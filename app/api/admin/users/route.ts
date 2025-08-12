import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { verifySessionFromRequest } from "@/lib/auth";
import { sendUserCredentialsEmail } from "@/lib/email";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  isAdmin: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session || !session.isAdmin) {
    console.log("LOG =====> Unauthorized GET /api/admin/users");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);
  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session || !session.isAdmin) {
      console.log("LOG =====> Unauthorized POST /api/admin/users");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { email, password, firstName, lastName, isAdmin } = CreateUserSchema.parse(body);
    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash, firstName: firstName || null, lastName: lastName || null, isAdmin: !!isAdmin })
      .returning({ id: users.id, email: users.email });
    console.log(`LOG =====> Admin created user ${created.email}`);
    // Fire-and-forget email send; don't block response if SES is slow
    sendUserCredentialsEmail({ toEmail: email, password, firstName: firstName || undefined }).catch((e) => {
      console.log("LOG =====> Failed sending credentials email", e);
    });
    return NextResponse.json({ id: created.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Create user error: ${message}`);
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
}



