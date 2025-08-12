"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export type AdRow = {
  id: string;
  adId: string;
  adName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  formId: string | null;
  formName: string | null;
  createdAt?: string | Date | null;
};

type ModalMode = "create" | "edit" | null;

export default function AdsTableClient({
  rows,
  apiBase = "/api/ads",
}: {
  rows: AdRow[];
  apiBase?: string;
}) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [adId, setAdId] = useState("");
  const [adName, setAdName] = useState("");
  const [adsetId, setAdsetId] = useState("");
  const [adsetName, setAdsetName] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");

  const openCreate = useCallback(() => {
    setModalMode("create");
    setEditingId(null);
    setAdId("");
    setAdName("");
    setAdsetId("");
    setAdsetName("");
    setCampaignId("");
    setCampaignName("");
    setFormId("");
    setFormName("");
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      setEditingId(id);
      setModalMode("edit");
      setAdId(row.adId ?? "");
      setAdName(row.adName ?? "");
      setAdsetId(row.adsetId ?? "");
      setAdsetName(row.adsetName ?? "");
      setCampaignId(row.campaignId ?? "");
      setCampaignName(row.campaignName ?? "");
      setFormId(row.formId ?? "");
      setFormName(row.formName ?? "");
    },
    [rows]
  );

  const closeModal = useCallback(() => setModalMode(null), []);

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!modalMode) return;
    if (!adId.trim()) {
      toast.error("Ad ID is required");
      return;
    }
    try {
      setBusy(true);
      if (modalMode === "create") {
        const res = await fetch(`${apiBase}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            adId: adId.trim(),
            adName: adName.trim() || null,
            adsetId: adsetId.trim() || null,
            adsetName: adsetName.trim() || null,
            campaignId: campaignId.trim() || null,
            campaignName: campaignName.trim() || null,
            formId: formId.trim() || null,
            formName: formName.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed to create ad");
        console.log("LOG =====> Ad created via modal");
        toast.success("Ad created");
      } else if (modalMode === "edit" && editingId) {
        const res = await fetch(`${apiBase}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            adId: adId.trim(),
            adName: adName.trim() || null,
            adsetId: adsetId.trim() || null,
            adsetName: adsetName.trim() || null,
            campaignId: campaignId.trim() || null,
            campaignName: campaignName.trim() || null,
            formId: formId.trim() || null,
            formName: formName.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("Failed to update ad");
        console.log(`LOG =====> Ad updated via modal: ${editingId}`);
        toast.success("Ad updated");
      }
      closeModal();
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Ad modal submit error", e);
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      setBusy(true);
      const res = await fetch(`${apiBase}/${confirmDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete ad");
      console.log(`LOG =====> Ad deleted via modal: ${confirmDeleteId}`);
      toast.success("Ad deleted");
      setConfirmDeleteId(null);
      router.refresh();
    } catch (e) {
      console.log("LOG =====> Delete ad error", e);
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Ads</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          New Ad
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Adset</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Form</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.adName || r.adId}</td>
                <td className="px-4 py-3">{r.adsetName || r.adsetId}</td>
                <td className="px-4 py-3">{r.campaignName || r.campaignId}</td>
                <td className="px-4 py-3">{r.formName || r.formId}</td>
                <td className="px-4 py-3">
                  {r.createdAt
                    ? new Date(
                        r.createdAt as unknown as string
                      ).toLocaleString()
                    : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/ads/${r.id}`} className="btn btn-secondary">
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => openEdit(r.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No ads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-[min(720px,92vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {modalMode === "create" ? "Create ad" : "Edit ad"}
              </h3>
            </div>
            <form
              onSubmit={submitForm}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Ad ID</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adId}
                  onChange={(e) => setAdId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ad Name
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adName}
                  onChange={(e) => setAdName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adset ID
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adsetId}
                  onChange={(e) => setAdsetId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adset Name
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={adsetName}
                  onChange={(e) => setAdsetName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Campaign ID
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Campaign Name
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Form ID
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Form Name
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="col-span-full mt-4 flex justify-end gap-2">
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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative z-10 w-[min(420px,92vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete ad?</h3>
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
