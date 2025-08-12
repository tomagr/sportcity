"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadRow } from "@/app/components/LeadsTableClient";

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
              ? data.clubs.filter((c: any) => c?.id && c?.name)
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

  async function onDelete() {
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
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (!busy ? setOpen(false) : undefined)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-[min(720px,95vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Lead</h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Close
                </button>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      className="input"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
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
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input
                      className="input"
                      value={form.phoneNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                      }
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
                    />
                  </div>
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
                </div>

                {error && <div className="alert error">{error}</div>}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    onClick={onDelete}
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
    </div>
  );
}
