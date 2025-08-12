"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchLeadsInput({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Debounce URL updates
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      const q = value.trim();
      if (q.length > 0) next.set("q", q);
      else next.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [value, router, pathname, searchParams, startTransition]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-64 rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-busy={isPending}
      />
      {isPending ? (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        </span>
      ) : null}
    </div>
  );
}
