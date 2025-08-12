import { db } from "@/lib/db/client";
import { leads, ads, clubs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LeadsClubFilter from "@/app/components/LeadsClubFilter";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const importId =
    typeof params.importId === "string" ? params.importId : undefined;
  const clubParam = params.club;
  const selectedClubs: string[] = Array.isArray(clubParam)
    ? clubParam
        .flatMap((v) => String(v).split(","))
        .map((v) => v.trim())
        .filter(Boolean)
    : typeof clubParam === "string"
    ? clubParam
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  const success = params.success === "1";
  const created =
    typeof params.created === "string" ? params.created : undefined;
  const updated =
    typeof params.updated === "string" ? params.updated : undefined;

  // Build base query joined with Ads and Clubs

  const baseQuery = db
    .select({
      id: leads.id,
      adId: leads.adId,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      clubOfInterest: clubs.name,
      createdTime: leads.createdTime,
      metaId: leads.metaId,
      campaignName: ads.campaignName,
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .leftJoin(clubs, eq(leads.clubId, clubs.id));

  const rows = await (importId
    ? baseQuery.where(eq(leads.importId, importId))
    : baseQuery);

  const filteredRows =
    selectedClubs.length > 0
      ? rows.filter(
          (r) => r.clubOfInterest && selectedClubs.includes(r.clubOfInterest)
        )
      : rows;

  // distinct clubs for filter buttons (respect current import filter)
  const clubRows = await db
    .select({ club: clubs.name })
    .from(leads)
    .leftJoin(clubs, eq(leads.clubId, clubs.id))
    .where(importId ? eq(leads.importId, importId) : undefined)
    .groupBy(clubs.name);
  const allClubs = clubRows
    .map((r) => r.club)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Leads {importId ? `(import ${importId})` : ""}
      </h1>
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-800 px-4 py-3">
          <p className="text-sm font-medium">
            Import completed successfully{created || updated ? ": " : ""}
            {created ? `${created} created` : ""}
            {created && updated ? ", " : ""}
            {updated ? `${updated} updated` : ""}
          </p>
        </div>
      )}
      <div className="mb-4">
        <LeadsClubFilter allClubs={allClubs} selectedClubs={selectedClubs} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-left">Created Time</th>
              <th className="px-3 py-2 text-left">Campaign</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ")}
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2 capitalize">{r.clubOfInterest}</td>
                <td className="px-3 py-2">
                  {r.createdTime
                    ? new Date(r.createdTime).toLocaleString()
                    : ""}
                </td>
                <td className="px-3 py-2">
                  {r.campaignName ? (
                    <Link
                      href={`/admin/ads/${r.adId}`}
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
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
