"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type LeadRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  age: string | null;
  clubOfInterest: string | null;
  platform: string | null;
  createdTime: string | null; // ISO string or null
  adName: string | null;
  campaignName: string | null;
  formName: string | null;
};

export default function LeadsTableClient({ rows }: { rows: LeadRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return;
    try {
      setBusy(true);
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete leads");
      console.log(`LOG =====> Deleted leads: ${ids.join(",")}`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Delete leads error", e);
      // simple toast
      const el = document.createElement("div");
      el.className =
        "fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow bg-red-100 text-red-800";
      el.textContent = "Failed to delete leads";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy || selectedIds.size === 0}
            onClick={() => deleteIds(Array.from(selectedIds))}
            className="btn btn-secondary"
          >
            Delete selected
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left w-10">
                <input
                  aria-label="Select all"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-left">Platform</th>
              <th className="px-3 py-2 text-left">Created Time</th>
              <th className="px-3 py-2 text-left">Ad</th>
              <th className="px-3 py-2 text-left">Campaign</th>
              <th className="px-3 py-2 text-left">Form</th>
              <th className="px-3 py-2 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <input
                    aria-label="Select row"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ")}
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2 capitalize">{r.clubOfInterest}</td>
                <td className="px-3 py-2 uppercase">{r.platform}</td>
                <td className="px-3 py-2">
                  {r.createdTime
                    ? new Date(r.createdTime).toLocaleString()
                    : ""}
                </td>
                <td className="px-3 py-2">{r.adName}</td>
                <td className="px-3 py-2">{r.campaignName}</td>
                <td className="px-3 py-2">{r.formName}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteIds([r.id])}
                    className="inline-flex items-center justify-center rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={12}
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
