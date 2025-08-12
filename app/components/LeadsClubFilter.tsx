"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LeadsClubFilter({
  allClubs,
  selectedClubs,
}: {
  allClubs: string[];
  selectedClubs: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = useMemo(() => new Set(selectedClubs), [selectedClubs]);

  function toggleClub(club: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    const raw = next.getAll("club");
    const current: string[] = raw
      .flatMap((v) => String(v).split(","))
      .map((v) => v.trim())
      .filter(Boolean);
    const set = new Set(current);
    if (set.has(club)) set.delete(club);
    else set.add(club);
    next.delete("club");
    if (set.size > 0) {
      // store as comma-separated single param for readability
      next.set("club", Array.from(set).join(","));
    }
    router.replace(`${pathname}?${next.toString()}`);
  }

  if (allClubs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allClubs.map((club) => {
        const isActive = selected.has(club);
        return (
          <button
            key={club}
            type="button"
            onClick={() => toggleClub(club)}
            className={
              isActive
                ? "inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
                : "inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            }
          >
            {club}
          </button>
        );
      })}
    </div>
  );
}
