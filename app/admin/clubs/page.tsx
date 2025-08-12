import Link from "next/link";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

async function getClubs() {
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .orderBy(desc(clubs.createdAt));
  return rows;
}

export default async function ClubsListPage() {
  const clubList = await getClubs();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Clubs</h2>
        <Link href="/admin/clubs/new" className="btn btn-primary">
          New Club
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nutrition Email</th>
              <th className="px-4 py-3">Kids Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubList.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.nutritionEmail || "—"}</td>
                <td className="px-4 py-3">{c.kidsEmail || "—"}</td>
                <td className="px-4 py-3">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/clubs/${c.id}`}
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/clubs/${c.id}/delete`}
                      className="btn btn-secondary"
                    >
                      Delete
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
