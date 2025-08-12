"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClubPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    nutritionEmail: "",
    kidsEmail: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nutritionEmail: form.nutritionEmail || undefined,
          kidsEmail: form.kidsEmail || undefined,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/admin/clubs");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> New club create error: ${message}`);
      setError("Failed to create club");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">New Club</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              setForm({ ...form, nutritionEmail: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label">Kids Email</label>
          <input
            className="input"
            type="email"
            value={form.kidsEmail}
            onChange={(e) => setForm({ ...form, kidsEmail: e.target.value })}
          />
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="flex gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
