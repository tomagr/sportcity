"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export type LeadsStatus = "unsent" | "sent";

export default function LeadsStatusTabs({
  value,
}: {
  value: LeadsStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current: LeadsStatus = useMemo(() => {
    const raw = searchParams?.get("status");
    return raw === "sent" ? "sent" : value;
  }, [searchParams, value]);

  function setStatus(next: LeadsStatus) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("status", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-border p-1">
      <button
        type="button"
        className={
          current === "unsent"
            ? "btn btn-primary px-3 py-1 text-sm"
            : "btn btn-secondary px-3 py-1 text-sm"
        }
        aria-pressed={current === "unsent"}
        onClick={() => setStatus("unsent")}
      >
        Not sent
      </button>
      <button
        type="button"
        className={
          current === "sent"
            ? "btn btn-primary px-3 py-1 text-sm"
            : "btn btn-secondary px-3 py-1 text-sm"
        }
        aria-pressed={current === "sent"}
        onClick={() => setStatus("sent")}
      >
        Sent
      </button>
    </div>
  );
}


