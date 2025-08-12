"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export type ClubRow = {
  id: string;
  name: string;
  nutritionEmail: string | null;
  kidsEmail: string | null;
  createdAt?: string | Date | null; // optional
};

type ModalMode = "create" | "edit" | null;

export default function ClubsTableClient({ rows }: { rows: ClubRow[] }) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [nutritionEmail, setNutritionEmail] = useState<string>("");
  const [kidsEmail, setKidsEmail] = useState<string>("");

  const currentEditing = useMemo(
    () => rows.find((r) => r.id === editingId) || null,
    [rows, editingId]
  );

  const openCreate = useCallback(() => {
    setModalMode("create");
    setEditingId(null);
    setName("");
    setNutritionEmail("");
    setKidsEmail("");
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      setEditingId(id);
      setModalMode("edit");
      setName(row.name ?? "");
      setNutritionEmail(row.nutritionEmail ?? "");
      setKidsEmail(row.kidsEmail ?? "");
    },
    [rows]
  );

  const closeModal = useCallback(() => {
    setModalMode(null);
  }, []);

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    const bg = type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    const el = document.createElement("div");
    el.className = `fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow ${bg}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }, []);

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!modalMode) return;
    if (!name.trim()) {
      toast("Name is required", "error");
      return;
    }
    try {
      setBusy(true);
      if (modalMode === "create") {
        const res = await fetch("/api/admin/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            nutritionEmail: nutritionEmail.trim() || null,
            kidsEmail: kidsEmail.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed to create club");
        console.log("LOG =====> Club created via modal");
        toast("Club created");
      } else if (modalMode === "edit" && editingId) {
        const res = await fetch(`/api/admin/clubs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            nutritionEmail: nutritionEmail.trim() || null,
            kidsEmail: kidsEmail.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed to update club");
        console.log(`LOG =====> Club updated via modal: ${editingId}`);
        toast("Club updated");
      }
      closeModal();
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Club modal submit error", e);
      toast("Action failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/clubs/${confirmDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete club");
      console.log(`LOG =====> Club deleted via modal: ${confirmDeleteId}`);
      toast("Club deleted");
      setConfirmDeleteId(null);
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Delete club error", e);
      toast("Delete failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Clubs</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New Club
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nutrition Email</th>
              <th className="px-4 py-3">Kids Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.nutritionEmail || "—"}</td>
                <td className="px-4 py-3">{c.kidsEmail || "—"}</td>
                <td className="px-4 py-3">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => openEdit(c.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-[min(520px,92vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {modalMode === "create" ? "Create club" : "Edit club"}
              </h3>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Midtown Club"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nutrition Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={nutritionEmail}
                  onChange={(e) => setNutritionEmail(e.target.value)}
                  placeholder="nutrition@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kids Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={kidsEmail}
                  onChange={(e) => setKidsEmail(e.target.value)}
                  placeholder="kids@example.com"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy}
                >
                  {modalMode === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-[min(420px,92vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete club?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                onClick={confirmDelete}
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


