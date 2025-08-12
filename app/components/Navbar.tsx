import Link from "next/link";
import NavbarClient from "./NavbarClient";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-secret"
);

type SessionPayload = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

async function getSession(): Promise<SessionPayload | null> {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export default async function Navbar() {
  const session = await getSession();
  const APP_NAME = process.env.APP_NAME || "App";
  const initials = session
    ? `${(session.firstName || session.email || "").charAt(0)}${(
        session.lastName || ""
      ).charAt(0)}`.toUpperCase()
    : "";
  let avatarUrl: string | null | undefined = null;
  if (session?.userId) {
    try {
      const [user] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      avatarUrl = user?.avatarUrl ?? null;
    } catch (e) {
      console.log("LOG =====> Failed to load avatarUrl for navbar");
    }
  }

  return (
    <nav className="container py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-semibold text-foreground hover:text-primary transition-colors"
        >
          {APP_NAME}
        </Link>
      </div>
      {session ? (
        <NavbarClient
          initials={initials || "U"}
          isAdmin={session?.isAdmin ?? false}
          avatarUrl={avatarUrl || undefined}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Log In
          </Link>
        </div>
      )}
    </nav>
  );
}
