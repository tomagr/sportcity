"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DeleteClubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const res = await fetch(`/api/admin/clubs/${params.id}`);
      if (!res.ok) return setError("Failed to load club");
      const data = await res.json();
      setName(data.club.name);
    }
    load();
  }, [params?.id]);

  async function onDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clubs/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/admin/clubs");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Delete club error: ${message}`);
      setError("Failed to delete club");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Delete Club</h2>
      <p className="mb-4">
        Are you sure you want to delete <strong>{name || "this club"}</strong>?
        This action cannot be undone.
      </p>
      {error && <div className="alert error">{error}</div>}
      <div className="flex gap-2">
        <button
          disabled={loading}
          className="btn btn-primary"
          onClick={onDelete}
        >
          {loading ? "Deleting..." : "Confirm Delete"}
        </button>
      </div>
    </div>
  );
}
