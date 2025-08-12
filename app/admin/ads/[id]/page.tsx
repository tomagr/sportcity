import { db } from "@/lib/db/client";
import { ads, leads, clubs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

type Params = Promise<{ id: string }>; // Next.js 15 route segment param

export default async function AdDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [ad] = await db
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
      updatedAt: ads.updatedAt,
    })
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);

  if (!ad) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Ad not found</h1>
        <Link href="/admin/ads" className="text-primary hover:underline">
          Back to Ads
        </Link>
      </div>
    );
  }

  const relatedLeads = await db
    .select({
      id: leads.id,
      clubId: leads.clubId,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      createdTime: leads.createdTime,
      clubOfInterest: clubs.name,
    })
    .from(leads)
    .leftJoin(clubs, eq(leads.clubId, clubs.id))
    .where(eq(leads.adId, ad.id))
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {ad.campaignName || ad.adName || ad.adId}
        </h1>
        <p className="text-muted-foreground">Ad detail</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground mb-1">Campaign</div>
          <div className="font-medium">{ad.campaignName || ad.campaignId}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground mb-1">Ad</div>
          <div className="font-medium">{ad.adName || ad.adId}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground mb-1">Adset</div>
          <div className="font-medium">{ad.adsetName || ad.adsetId}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground mb-1">Form</div>
          <div className="font-medium">{ad.formName || ad.formId}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-left">Created</th>
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
                <td className="px-3 py-2">
                  {r.clubId ? (
                    <Link
                      href={`/admin/clubs/${r.clubId}`}
                      className="badge badge-primary"
                    >
                      {r.clubOfInterest}
                    </Link>
                  ) : (
                    r.clubOfInterest
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.createdTime
                    ? new Date(
                        r.createdTime as unknown as string
                      ).toLocaleString()
                    : ""}
                </td>
              </tr>
            ))}
            {relatedLeads.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-muted-foreground"
                  colSpan={5}
                >
                  No leads found for this ad.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
