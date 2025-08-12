"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", isAdmin: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (!res.ok) return setError("Failed to load user");
      const data = await res.json();
      setUser(data.user);
      setForm({
        email: data.user.email || "",
        password: "",
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        isAdmin: !!data.user.isAdmin,
      });
    }
    load();
  }, [params?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          isAdmin: form.isAdmin,
          ...(form.password ? { password: form.password } : {}),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push("/admin/users");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`LOG =====> Update user error: ${message}`);
      setError("Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Edit User</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="label">New Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" minLength={8} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="isAdmin" type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
          <label htmlFor="isAdmin">Admin</label>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="flex gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">{loading ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}



