import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";

export default async function SiteClubsListPage() {
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .orderBy(asc(clubs.name))
    .limit(500);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clubs</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nutrition Email</th>
              <th className="px-4 py-3">Kids Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.nutritionEmail || "—"}</td>
                <td className="px-4 py-3">{c.kidsEmail || "—"}</td>
                <td className="px-4 py-3">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/clubs/${c.id}`} className="badge badge-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-muted-foreground"
                  colSpan={5}
                >
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
