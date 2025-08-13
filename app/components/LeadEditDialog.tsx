"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeadRow } from "@/app/components/LeadsTableClient";
import { formatDateUtcMinus6 } from "@/lib/date";

type ClubOption = { id: string; name: string };

export default function LeadEditDialog({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    age: "",
    clubId: "",
  });
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      firstName: lead.firstName ?? "",
      lastName: lead.lastName ?? "",
      email: lead.email ?? "",
      phoneNumber: lead.phoneNumber ?? "",
      age: lead.age ?? "",
      clubId: lead.clubId ?? "",
    });
    // Focus first input when opening
    queueMicrotask(() => firstNameRef.current?.focus());
  }, [open, lead]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadClubs() {
      try {
        const res = await fetch("/api/clubs", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load clubs");
        const data = await res.json();
        if (!cancelled) {
          setClubs(
            Array.isArray(data?.clubs)
              ? (data.clubs as unknown[]).filter(
                  (c): c is ClubOption =>
                    typeof (c as ClubOption)?.id === "string" &&
                    typeof (c as ClubOption)?.name === "string"
                )
              : []
          );
        }
      } catch (err) {
        console.log("LOG =====> Load clubs error", err);
      }
    }
    loadClubs();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy]);

  const canSubmit = useMemo(() => {
    return !busy;
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          email: form.email || null,
          phoneNumber: form.phoneNumber || null,
          age: form.age || null,
          clubId: form.clubId || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      console.log("LOG =====> Lead updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Update lead error: ${message}`);
      setError("Failed to update lead");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteConfirmed() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      console.log("LOG =====> Lead deleted successfully");
      setConfirmDeleteOpen(false);
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Delete lead error: ${message}`);
      setError("Failed to delete lead");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex">
      <button
        type="button"
        className="btn btn-primary mr-2"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-dialog-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (!busy ? setOpen(false) : undefined)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[min(760px,95vw)] rounded-xl border border-border bg-card shadow-xl">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 bg-card rounded-t-xl">
                <div>
                  <h3 id="lead-dialog-title" className="text-lg font-semibold">
                    Edit Lead
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Created{" "}
                    {lead.createdTime
                      ? formatDateUtcMinus6(lead.createdTime)
                      : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <form onSubmit={onSubmit} className="px-5 py-4">
                <div className="max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
                  {/* Personal */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      Personal
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">First Name</label>
                        <input
                          ref={firstNameRef}
                          className="input"
                          value={form.firstName}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Jane"
                        />
                      </div>
                      <div>
                        <label className="label">Last Name</label>
                        <input
                          className="input"
                          value={form.lastName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, lastName: e.target.value }))
                          }
                          placeholder="e.g., Doe"
                        />
                      </div>
                      <div>
                        <label className="label">Age</label>
                        <input
                          className="input"
                          value={form.age}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, age: e.target.value }))
                          }
                          placeholder="e.g., 35"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">Email</label>
                        <input
                          className="input"
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                          placeholder="name@example.com"
                        />
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input
                          className="input"
                          value={form.phoneNumber}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              phoneNumber: e.target.value,
                            }))
                          }
                          placeholder="e.g., +1 555-123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campaign & Club */}
                  <div className="mb-2">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      Campaign & Club
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">Club</label>
                        <select
                          className="input"
                          value={form.clubId ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, clubId: e.target.value }))
                          }
                        >
                          <option value="">No club</option>
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Club of interest</label>
                        <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                          {lead.clubOfInterest || "—"}
                        </div>
                      </div>
                      <div>
                        <label className="label">Campaign</label>
                        {lead.campaignName ? (
                          <Link
                            href={`/ads/${lead.adId}`}
                            className="badge badge-primary"
                          >
                            {lead.campaignName}
                          </Link>
                        ) : (
                          <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                            —
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && <div className="mt-4 alert error">{error}</div>}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 border-t bg-card px-0 pt-4 pb-1">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setOpen(false)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!canSubmit}
                    >
                      {busy ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDeleteOpen(false)}
          />
          <div className="relative z-10 w-[min(420px,92vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete lead?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                onClick={onDeleteConfirmed}
                disabled={busy}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
