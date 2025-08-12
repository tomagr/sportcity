import { db } from "@/lib/db/client";
import { leads, ads } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const importId =
    typeof params.importId === "string" ? params.importId : undefined;
  const success = params.success === "1";
  const created =
    typeof params.created === "string" ? params.created : undefined;
  const updated =
    typeof params.updated === "string" ? params.updated : undefined;

  const rows = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      clubOfInterest: leads.clubOfInterest,
      platform: leads.platform,
      createdTime: leads.createdTime,
      metaId: leads.metaId,
      adName: ads.adName,
      campaignName: ads.campaignName,
      formName: ads.formName,
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .where(importId ? eq(leads.importId, importId) : undefined);

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
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Age</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-left">Platform</th>
              <th className="px-3 py-2 text-left">Created Time</th>
              <th className="px-3 py-2 text-left">Ad</th>
              <th className="px-3 py-2 text-left">Campaign</th>
              <th className="px-3 py-2 text-left">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ")}
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2 capitalize">{r.clubOfInterest}</td>
                <td className="px-3 py-2 uppercase">{r.platform}</td>
                <td className="px-3 py-2">
                  {r.createdTime
                    ? new Date(r.createdTime).toLocaleString()
                    : ""}
                </td>
                <td className="px-3 py-2">{r.adName}</td>
                <td className="px-3 py-2">{r.campaignName}</td>
                <td className="px-3 py-2">{r.formName}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-gray-500"
                  colSpan={10}
                >
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
