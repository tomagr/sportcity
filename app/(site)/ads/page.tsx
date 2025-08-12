import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function SiteAdsListPage() {
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
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ads</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-accent text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Adset</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Form</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.adName || r.adId}</td>
                <td className="px-4 py-3">{r.adsetName || r.adsetId}</td>
                <td className="px-4 py-3">{r.campaignName || r.campaignId}</td>
                <td className="px-4 py-3">{r.formName || r.formId}</td>
                <td className="px-4 py-3">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/ads/${r.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-muted-foreground"
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
