import UploadLeadsDialog from "@/app/components/UploadLeadsDialog";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { leads, ads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LeadsTableClient from "@/app/components/LeadsTableClient";

export default async function Home() {
  const session = await verifySessionFromCookiesOnly();
  if (!session) {
    redirect("/login");
  }

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
    .leftJoin(ads, eq(leads.adId, ads.id));

  return (
    <div className="font-sans min-h-screen">
      <div className="mx-auto max-w-6xl px-4 mt-10 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Upload Leads CSV</h1>
          <UploadLeadsDialog />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Leads</h2>
          <LeadsTableClient
            rows={rows.map((r) => ({
              ...r,
              createdTime: r.createdTime
                ? new Date(r.createdTime as unknown as string).toISOString()
                : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
