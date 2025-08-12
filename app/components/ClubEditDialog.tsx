"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ClubRecord = {
  id: string;
  name: string;
  nutritionEmail: string | null;
  kidsEmail: string | null;
};

export default function ClubEditDialog({ club }: { club: ClubRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    nutritionEmail: "",
    kidsEmail: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: club.name ?? "",
      nutritionEmail: club.nutritionEmail ?? "",
      kidsEmail: club.kidsEmail ?? "",
    });
  }, [open, club]);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && !busy;
  }, [form.name, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          nutritionEmail: form.nutritionEmail.trim() || null,
          kidsEmail: form.kidsEmail.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      console.log("LOG =====> Club updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Update club error: ${message}`);
      setError("Failed to update club");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      console.log("LOG =====> Club deleted successfully");
      setOpen(false);
      router.replace("/clubs");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Delete club error: ${message}`);
      setError("Failed to delete club");
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
            <div className="w-[min(600px,95vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Club</h3>
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
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">Nutrition Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.nutritionEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nutritionEmail: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Kids Email</label>
                  <input
                    className="input"
                    type="email"
                    value={form.kidsEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, kidsEmail: e.target.value }))
                    }
                  />
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


