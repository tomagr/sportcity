import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

const Schema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = Schema.parse(body);

    const [row] = await db
      .select({
        id: passwordResetTokens.id,
        token: passwordResetTokens.token,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        userEmail: users.email,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    if (!row || row.expiresAt < new Date()) {
      console.log("LOG =====> Invalid or expired password reset token");
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id));
      await tx
        .delete(passwordResetTokens)
        .where(and(eq(passwordResetTokens.userId, row.userId), lt(passwordResetTokens.expiresAt, new Date())));
    });

    console.log(`LOG =====> Password reset successful for ${row.userEmail}`);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`LOG =====> Password reset error: ${message}`);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}


