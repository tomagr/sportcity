import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to the admin panel.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="rounded-lg border bg-white p-6 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-medium">Manage Users</div>
          <div className="text-muted-foreground text-sm">
            Create, read, update and delete users.
          </div>
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-lg border bg-white p-6 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-medium">Manage Leads</div>
          <div className="text-muted-foreground text-sm">
            Browse, import, and delete leads.
          </div>
        </Link>
        <Link
          href="/admin/clubs"
          className="rounded-lg border bg-white p-6 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-medium">Manage Clubs</div>
          <div className="text-muted-foreground text-sm">
            Create and edit clubs.
          </div>
        </Link>
        <Link
          href="/admin/ads"
          className="rounded-lg border bg-white p-6 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-medium">Manage Ads</div>
          <div className="text-muted-foreground text-sm">
            Review and manage ad metadata.
          </div>
        </Link>
      </div>
    </div>
  );
}
