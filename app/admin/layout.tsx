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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-lg font-semibold text-gray-900 hover:text-black"
            >
              Admin
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="text-gray-600 hover:text-gray-900"
            >
              Users
            </Link>
            <Link
              href="/admin/leads"
              className="text-gray-600 hover:text-gray-900"
            >
              Leads
            </Link>
            <Link
              href="/admin/ads"
              className="text-gray-600 hover:text-gray-900"
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
