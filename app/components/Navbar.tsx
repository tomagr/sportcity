"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SessionState = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  avatarUrl?: string | null;
} | null;

export default function Navbar() {
  const [session, setSession] = useState<SessionState>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        if (data?.session) setSession(data.session);
        else setSession(null);
      } catch (e) {
        console.log("LOG =====> Failed to load session in Navbar");
        setSession(null);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "App";
  const initials = session
    ? `${(session.firstName || session.email || "").charAt(0)}${(
        session.lastName || ""
      ).charAt(0)}`.toUpperCase()
    : "";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b bg-card/80 backdrop-blur">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {APP_NAME}
          </Link>
        </div>
        {session ? (
          <div className="flex items-center gap-2">
            <>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Leads
              </Link>
              <Link
                href="/ads"
                className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Ads
              </Link>
              <Link
                href="/clubs"
                className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Clubs
              </Link>
            </>

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {session.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.avatarUrl}
                    alt={initials || "User avatar"}
                    className="block h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">{initials || "U"}</span>
                )}
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 min-w-[160px] rounded-lg border border-border bg-background shadow-lg"
                >
                  <Link
                    href="/profile"
                    className="block w-full rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Profile
                  </Link>
                  {session.isAdmin && (
                    <Link
                      href="/admin"
                      className="block w-full rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
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
      </div>
    </nav>
  );
}
