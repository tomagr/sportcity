import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-gray-600">Welcome to the admin panel.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="rounded-lg border bg-white p-6 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-medium">Manage Users</div>
          <div className="text-gray-600 text-sm">Create, read, update and delete users.</div>
        </Link>
      </div>
    </div>
  );
}



