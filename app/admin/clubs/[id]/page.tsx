"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Club = {
  id: string;
  name: string;
  nutritionEmail: string | null;
  kidsEmail: string | null;
};

export default function EditClubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [form, setForm] = useState({
    name: "",
    nutritionEmail: "",
    kidsEmail: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const res = await fetch(`/api/admin/clubs/${params.id}`);
      if (!res.ok) return setError("Failed to load club");
      const data = await res.json();
      setClub(data.club);
      setForm({
        name: data.club.name || "",
        nutritionEmail: data.club.nutritionEmail || "",
        kidsEmail: data.club.kidsEmail || "",
      });
    }
    load();
  }, [params?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!club) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clubs/${club.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nutritionEmail: form.nutritionEmail || null,
          kidsEmail: form.kidsEmail || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/admin/clubs");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Update club error: ${message}`);
      setError("Failed to update club");
    } finally {
      setLoading(false);
    }
  }

  if (!club) return <div>Loading...</div>;

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Edit Club</h2>
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
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
