import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

type SessionPayload = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

async function requireAdmin(): Promise<SessionPayload> {
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "dev-secret"
  );
  const sessionCookie = (await cookies()).get("session")?.value;
  if (!sessionCookie) redirect("/login");
  try {
    const { payload } = await jwtVerify(sessionCookie!, secret);
    const session = payload as unknown as SessionPayload;
    if (!session?.isAdmin) redirect("/");
    return session;
  } catch {
    redirect("/login");
  }
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between text-foreground">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-lg font-semibold text-foreground hover:text-primary"
            >
              Admin
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground"
            >
              Users
            </Link>
            <Link
              href="/admin/leads"
              className="text-muted-foreground hover:text-foreground"
            >
              Leads
            </Link>
            <Link
              href="/admin/clubs"
              className="text-muted-foreground hover:text-foreground"
            >
              Clubs
            </Link>
            <Link
              href="/admin/ads"
              className="text-muted-foreground hover:text-foreground"
            >
              Ads
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
