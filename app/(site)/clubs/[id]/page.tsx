import { db } from "@/lib/db/client";
import { clubs, leads, ads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

type Params = Promise<{ id: string }>; // Next.js 15 route segment param

export default async function SiteClubDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
      updatedAt: clubs.updatedAt,
    })
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);

  if (!club) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Club not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const relatedLeads = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      createdTime: leads.createdTime,
      campaignName: ads.campaignName,
      adId: ads.id,
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .where(eq(leads.clubId, club.id))
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{club.name}</h1>
        <p className="text-muted-foreground">Club detail</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">
            Nutrition Email
          </div>
          <div className="font-medium">{club.nutritionEmail || "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Kids Email</div>
          <div className="font-medium">{club.kidsEmail || "—"}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Campaign</th>
            </tr>
          </thead>
          <tbody>
            {relatedLeads.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ")}
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2">
                  {r.createdTime
                    ? new Date(
                        r.createdTime as unknown as string
                      ).toLocaleString()
                    : ""}
                </td>
                <td className="px-3 py-2">
                  {r.campaignName ? (
                    <Link
                      href={`/ads/${r.adId}`}
                      className="text-primary hover:underline"
                    >
                      {r.campaignName}
                    </Link>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}
            {relatedLeads.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No leads found for this club.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
