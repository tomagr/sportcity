import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [row] = await db
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

  if (!row) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold mb-2">Ad not found</h1>
        <p className="text-muted-foreground">This ad does not exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">
        {row.campaignName || row.campaignId}
      </h1>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium w-48">Ad ID</td>
              <td className="px-3 py-2">{row.adId}</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium">Ad Name</td>
              <td className="px-3 py-2">{row.adName}</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium">Adset</td>
              <td className="px-3 py-2">{row.adsetName || row.adsetId}</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium">Campaign</td>
              <td className="px-3 py-2">
                {row.campaignName || row.campaignId}
              </td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium">Form</td>
              <td className="px-3 py-2">{row.formName || row.formId}</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2 font-medium">Created</td>
              <td className="px-3 py-2">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium">Updated</td>
              <td className="px-3 py-2">
                {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
