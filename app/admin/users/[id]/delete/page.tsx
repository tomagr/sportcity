"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DeleteUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (!res.ok) return setError("Failed to load user");
      const data = await res.json();
      setEmail(data.user.email);
    }
    load();
  }, [params?.id]);

  async function onDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      router.push("/admin/users");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Delete user error: ${message}`);
      setError("Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Delete User</h2>
      <p className="mb-4">Are you sure you want to delete <strong>{email || "this user"}</strong>? This action cannot be undone.</p>
      {error && <div className="alert error">{error}</div>}
      <div className="flex gap-2">
        <button disabled={loading} className="btn btn-primary" onClick={onDelete}>
          {loading ? "Deleting..." : "Confirm Delete"}
        </button>
      </div>
    </div>
  );
}



