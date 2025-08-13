"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { formatDateUtcMinus6 } from "@/lib/date";

const LeadEditDialog = dynamic(
  () => import("@/app/components/LeadEditDialog"),
  { ssr: false }
);

export type LeadRow = {
  id: string;
  adId: string;
  clubId?: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  age: string | null;
  clubOfInterest: string | null;
  createdTime: string | null; // ISO string or null
  campaignName: string | null;
};

type LeadsTableClientProps = {
  rows: LeadRow[];
  scope?: "global" | "local"; // global: full DB send supported; local: auto-select all rows in table
  sendAllLabel?: string; // optional label override for the send-all button
};

export default function LeadsTableClient({
  rows,
  scope = "global",
  sendAllLabel,
}: LeadsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<"kids" | "nutrition">("kids");
  const [sending, setSending] = useState(false);
  const [sendAllMode, setSendAllMode] = useState(false);
  const [clubsIndex, setClubsIndex] = useState<
    Record<
      string,
      {
        id: string;
        name: string;
        kidsEmail: string | null;
        nutritionEmail: string | null;
      }
    >
  >({});
  const [clubsLoading, setClubsLoading] = useState(false);

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
      toast.success("Leads deleted");
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Delete leads error", e);
      toast.error("Failed to delete leads");
    } finally {
      setBusy(false);
    }
  }

  async function sendSelectedToClub() {
    const ids = Array.from(selectedIds);
    if (!sendAllMode && ids.length === 0) return;
    try {
      setSending(true);
      const res = await fetch("/api/leads/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          sendAllMode
            ? { all: true as const, target: sendTarget }
            : { ids, target: sendTarget }
        ),
      });
      if (!res.ok) throw new Error("Failed to send emails");
      const data = (await res.json()) as {
        sent?: number;
        skipped?: number;
        errors?: number;
      };
      console.log(
        `LOG =====> Sent leads to clubs: sent=${data?.sent ?? 0}, skipped=${
          data?.skipped ?? 0
        }, errors=${data?.errors ?? 0}`
      );
      toast.success("Emails sent to clubs");
      setSelectedIds(new Set());
      setSendOpen(false);
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Send leads to club error", e);
      toast.error("Failed to send emails");
    } finally {
      setSending(false);
    }
  }

  // Load clubs when opening send modal so we can show email addresses and compute preview
  useEffect(() => {
    if (!sendOpen) return;
    let cancelled = false;
    (async () => {
      try {
        setClubsLoading(true);
        const res = await fetch("/api/clubs", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load clubs");
        const data = (await res.json()) as {
          clubs?: Array<{
            id: string;
            name: string;
            kidsEmail: string | null;
            nutritionEmail: string | null;
          }>;
        };
        const map: Record<
          string,
          {
            id: string;
            name: string;
            kidsEmail: string | null;
            nutritionEmail: string | null;
          }
        > = {};
        for (const c of data.clubs ?? []) {
          if (!c?.id) continue;
          map[c.id] = {
            id: c.id,
            name: c.name,
            kidsEmail: c.kidsEmail ?? null,
            nutritionEmail: c.nutritionEmail ?? null,
          };
        }
        if (!cancelled) setClubsIndex(map);
      } catch (err) {
        console.log("LOG =====> Load clubs for send modal error", err);
      } finally {
        if (!cancelled) setClubsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sendOpen]);

  const selectedLeads = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  const selectedClubIds = useMemo(() => {
    return Array.from(
      new Set(selectedLeads.map((l) => l.clubId || "__no_club__"))
    );
  }, [selectedLeads]);

  function uniqueNonEmptyEmails(
    values: Array<string | null | undefined>
  ): string[] {
    const set = new Set<string>();
    for (const v of values) {
      const s = (v ?? "").trim();
      if (s.length > 0) set.add(s);
    }
    return Array.from(set);
  }

  const kidsEmailsUnique = useMemo(() => {
    const emails: Array<string | null> = selectedClubIds
      .filter((id) => id !== "__no_club__")
      .map((id) => clubsIndex[id]?.kidsEmail ?? null);
    return uniqueNonEmptyEmails(emails);
  }, [selectedClubIds, clubsIndex]);

  const nutritionEmailsUnique = useMemo(() => {
    const emails: Array<string | null> = selectedClubIds
      .filter((id) => id !== "__no_club__")
      .map((id) => clubsIndex[id]?.nutritionEmail ?? null);
    return uniqueNonEmptyEmails(emails);
  }, [selectedClubIds, clubsIndex]);

  function formatEmailSummary(values: string[]): string {
    if (values.length === 0) return "—";
    if (values.length <= 2) return values.join(", ");
    return `${values.slice(0, 2).join(", ")}, +${values.length - 2} more`;
  }

  const sendableCount = useMemo(() => {
    return selectedLeads.reduce((acc, lead) => {
      const club = lead.clubId ? clubsIndex[lead.clubId] : undefined;
      const email =
        sendTarget === "kids" ? club?.kidsEmail : club?.nutritionEmail;
      return acc + (email ? 1 : 0);
    }, 0);
  }, [selectedLeads, clubsIndex, sendTarget]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSendAllMode(false);
                setSendOpen(true);
              }}
              disabled={busy || sending}
              aria-disabled={busy || sending}
            >
              {sending ? "Sending..." : "Send leads to club"}
            </button>
          ) : scope === "global" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSendAllMode(true);
                setSendOpen(true);
              }}
              disabled={busy || sending || rows.length === 0}
              aria-disabled={busy || sending || rows.length === 0}
            >
              {sending
                ? "Sending..."
                : sendAllLabel || "Send Leads to all clubs"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Local scope: auto-select all rows from the table and open modal (selection-based send)
                const allIds = new Set(rows.map((r) => r.id));
                setSelectedIds(allIds);
                setSendAllMode(false);
                setSendOpen(true);
              }}
              disabled={busy || sending || rows.length === 0}
              aria-disabled={busy || sending || rows.length === 0}
            >
              {sending
                ? "Sending..."
                : sendAllLabel || "Send all leads to club"}
            </button>
          )}
          {selectedIds.size > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => deleteIds(Array.from(selectedIds))}
              className="btn btn-secondary"
            >
              Delete selected
            </button>
          ) : null}
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
              <th className="px-3 py-2 text-left w-[280px]">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-left">Created Time</th>
              <th className="px-3 py-2 text-left">Campaign</th>
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
                <td className="px-3 py-2 max-w-[280px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {r.email}
                </td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2">
                  {r.clubId ? (
                    <Link
                      href={`/clubs/${r.clubId}`}
                      className="badge badge-primary"
                    >
                      {r.clubOfInterest}
                    </Link>
                  ) : (
                    <span className="badge badge-primary">
                      {r.clubOfInterest}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.createdTime ? formatDateUtcMinus6(r.createdTime) : ""}
                </td>
                <td className="px-3 py-2">
                  {r.campaignName ? (
                    <Link
                      href={`/ads/${r.adId}`}
                      className="badge badge-primary"
                    >
                      {r.campaignName}
                    </Link>
                  ) : (
                    ""
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/leads/${r.id}`} className="btn btn-secondary">
                      View
                    </Link>
                    <LeadEditDialog lead={r} />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteIds([r.id])}
                      className="inline-flex items-center justify-center rounded-md border border-red-600 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
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

      {sendOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (!sending ? setSendOpen(false) : undefined)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[min(520px,95vw)] rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 className="text-lg font-semibold">Send leads to club</h3>
                <button
                  type="button"
                  className="btn btn-secondary p-2"
                  aria-label="Close"
                  onClick={() => setSendOpen(false)}
                  disabled={sending}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {sendAllMode
                    ? "Choose the destination mailbox. This will send all leads in the database to their respective clubs."
                    : "Choose the destination mailbox for the selected leads."}
                </p>
                <div className="flex flex-col gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="send-target"
                      value="kids"
                      className="h-4 w-4"
                      checked={sendTarget === "kids"}
                      onChange={() => setSendTarget("kids")}
                      disabled={sending}
                    />
                    <span>Send to Kids email address</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (
                      {clubsLoading
                        ? "Loading…"
                        : formatEmailSummary(kidsEmailsUnique)}
                      )
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="send-target"
                      value="nutrition"
                      className="h-4 w-4"
                      checked={sendTarget === "nutrition"}
                      onChange={() => setSendTarget("nutrition")}
                      disabled={sending}
                    />
                    <span>Send to Nutrition email address</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (
                      {clubsLoading
                        ? "Loading…"
                        : formatEmailSummary(nutritionEmailsUnique)}
                      )
                    </span>
                  </label>
                </div>

                {/* Preview counts */}
                {!sendAllMode && (
                  <div className="mt-4 text-sm">
                    <div>
                      Will send{" "}
                      <span className="font-semibold">{sendableCount}</span> of{" "}
                      <span className="font-semibold">
                        {selectedLeads.length}
                      </span>{" "}
                      selected lead{selectedLeads.length === 1 ? "" : "s"}.
                    </div>
                    {selectedLeads.length > sendableCount && (
                      <div className="text-muted-foreground">
                        {selectedLeads.length - sendableCount} will be skipped
                        (missing {sendTarget}_email or no club).
                      </div>
                    )}
                  </div>
                )}

                {/* Selected clubs and their emails */}
                <div className="mt-4 max-h-[40vh] overflow-auto pr-1">
                  {clubsLoading ? (
                    <div className="text-sm text-muted-foreground">
                      Loading club details…
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(
                        new Map(
                          selectedLeads
                            .map((l) => l.clubId || "__no_club__")
                            .map((id) => [id, id] as const)
                        ).values()
                      ).map((clubId) => {
                        if (clubId === "__no_club__") {
                          return (
                            <div
                              key={clubId}
                              className="rounded-md border border-border px-3 py-2"
                            >
                              <div className="font-medium">No club</div>
                              <div className="text-xs text-muted-foreground">
                                kids_email: —
                              </div>
                              <div className="text-xs text-muted-foreground">
                                nutrition_email: —
                              </div>
                            </div>
                          );
                        }
                        const c = clubsIndex[clubId];
                        return (
                          <div
                            key={clubId}
                            className="rounded-md border border-border px-3 py-2"
                          >
                            <div className="font-medium">
                              {c?.name ?? "Unknown club"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              kids_email:{" "}
                              {c?.kidsEmail && c.kidsEmail.trim().length > 0
                                ? c.kidsEmail
                                : "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              nutrition_email:{" "}
                              {c?.nutritionEmail &&
                              c.nutritionEmail.trim().length > 0
                                ? c.nutritionEmail
                                : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSendOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={sendSelectedToClub}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
