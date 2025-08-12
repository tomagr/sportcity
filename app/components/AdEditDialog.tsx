"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type AdRecord = {
  id: string;
  adId: string | null;
  adName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  formId: string | null;
  formName: string | null;
};

export default function AdEditDialog({ ad }: { ad: AdRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    adId: "",
    adName: "",
    adsetId: "",
    adsetName: "",
    campaignId: "",
    campaignName: "",
    formId: "",
    formName: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      adId: ad.adId ?? "",
      adName: ad.adName ?? "",
      adsetId: ad.adsetId ?? "",
      adsetName: ad.adsetName ?? "",
      campaignId: ad.campaignId ?? "",
      campaignName: ad.campaignName ?? "",
      formId: ad.formId ?? "",
      formName: ad.formName ?? "",
    });
  }, [open, ad]);

  const canSubmit = useMemo(() => {
    return form.adId.trim().length > 0 && !busy;
  }, [form.adId, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adId: form.adId.trim(),
          adName: form.adName || null,
          adsetId: form.adsetId || null,
          adsetName: form.adsetName || null,
          campaignId: form.campaignId || null,
          campaignName: form.campaignName || null,
          formId: form.formId || null,
          formName: form.formName || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      console.log("LOG =====> Ad updated successfully");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Update ad error: ${message}`);
      setError("Failed to update ad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
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
            <div className="w-[min(700px,95vw)] rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Ad</h3>
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
                    <label className="label">Ad ID</label>
                    <input
                      className="input"
                      value={form.adId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, adId: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Ad Name</label>
                    <input
                      className="input"
                      value={form.adName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, adName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Adset ID</label>
                    <input
                      className="input"
                      value={form.adsetId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, adsetId: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Adset Name</label>
                    <input
                      className="input"
                      value={form.adsetName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, adsetName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Campaign ID</label>
                    <input
                      className="input"
                      value={form.campaignId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, campaignId: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Campaign Name</label>
                    <input
                      className="input"
                      value={form.campaignName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, campaignName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Form ID</label>
                    <input
                      className="input"
                      value={form.formId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, formId: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Form Name</label>
                    <input
                      className="input"
                      value={form.formName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, formName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {error && <div className="alert error">{error}</div>}

                <div className="flex items-center justify-end gap-2 pt-2">
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
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
