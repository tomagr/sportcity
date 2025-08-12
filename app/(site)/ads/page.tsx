import { db } from "@/lib/db/client";
import { ads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import AdsTableClient from "@/app/components/AdsTableClient";

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

  return <AdsTableClient rows={rows} apiBase="/api/ads" />;
}
