import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

const Schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = Schema.parse(body);

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    // Always respond 200 to avoid email enumeration
    if (!user) {
      console.log(`LOG =====> Password reset requested for non-existent user ${email}`);
      return NextResponse.json({ ok: true });
    }

    const token = generateToken(24);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetTokens).values({ token, userId: user.id, expiresAt });

    await sendPasswordResetEmail(email, token);
    console.log(`LOG =====> Password reset token generated for ${email}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Password reset request error: ${message}`);
    return NextResponse.json({ ok: true });
  }
}


