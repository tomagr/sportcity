"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type NavbarClientProps = {
  initials: string;
  isAdmin: boolean;
  avatarUrl?: string | null;
};

export default function NavbarClient({
  initials,
  isAdmin,
  avatarUrl,
}: NavbarClientProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          // avatar image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={initials || "User avatar"}
            className="block h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">{initials}</span>
        )}
      </button>
      {open && (
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
          {isAdmin && (
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
  );
}
