import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { formatDateUtcMinus6 } from "@/lib/date";

export default async function AdminAdsPage() {
  const rows = await db
    .select({
      id: ads.id,
      adId: ads.adId,
      adName: ads.adName,
      adsetId: ads.adsetId,
      adsetName: ads.adsetName,
      campaignId: ads.campaignId,
      campaignName: ads.campaignName,
      formId: ads.formId,
      formName: ads.formName,
      createdAt: ads.createdAt,
    })
    .from(ads)
    .orderBy(desc(ads.createdAt))
    .limit(500);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Ads</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Ad ID</th>
              <th className="px-3 py-2 text-left">Ad Name</th>
              <th className="px-3 py-2 text-left">Adset</th>
              <th className="px-3 py-2 text-left">Campaign</th>
              <th className="px-3 py-2 text-left">Form</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.adId}</td>
                <td className="px-3 py-2">{r.adName}</td>
                <td className="px-3 py-2">{r.adsetName || r.adsetId}</td>
                <td className="px-3 py-2">{r.campaignName || r.campaignId}</td>
                <td className="px-3 py-2">{r.formName || r.formId}</td>
                <td className="px-3 py-2">
                  {r.createdAt
                    ? formatDateUtcMinus6(r.createdAt as unknown as string)
                    : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No ads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
