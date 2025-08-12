import { NextResponse } from "next/server";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type SessionPayload = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

export async function GET() {
  try {
    const session = (await verifySessionFromCookiesOnly()) as SessionPayload | null;
    if (!session) {
      return NextResponse.json({ ok: true, session: null });
    }

    let avatarUrl: string | null = null;
    try {
      const [user] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      avatarUrl = user?.avatarUrl ?? null;
    } catch (e) {
      console.log("LOG =====> Failed to load avatarUrl for session endpoint");
    }

    return NextResponse.json({ ok: true, session: { ...session, avatarUrl } });
  } catch (e) {
    console.log("LOG =====> Error in /api/session");
    return NextResponse.json({ ok: false, session: null }, { status: 500 });
  }
}


