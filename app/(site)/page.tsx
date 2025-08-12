import UploadLeadsDialog from "@/app/components/UploadLeadsDialog";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { leads, ads, clubs } from "@/lib/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import LeadsTableClient from "@/app/components/LeadsTableClient";
import SearchLeadsInput from "@/app/components/SearchLeadsInput";

type SearchParams = Promise<{ q?: string }>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await verifySessionFromCookiesOnly();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = (params?.q ?? "").trim();

  const baseSelect = db
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

  const whereClause = q
    ? or(
        ilike(leads.firstName, `%${q}%`),
        ilike(leads.lastName, `%${q}%`),
        ilike(leads.email, `%${q}%`)
      )
    : undefined;

  const rows = await (whereClause ? baseSelect.where(whereClause) : baseSelect);

  const [{ value: totalLeads }] = await db
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(leads);

  return (
    <div className="font-sans min-h-screen">
      <div className="mx-auto max-w-6xl px-4 mt-10 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Upload Leads CSV</h1>
          <UploadLeadsDialog />
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-3">
            <h2 className="text-xl font-semibold">Leads</h2>
            <div className="flex items-center gap-3">
              <SearchLeadsInput defaultValue={q} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            <span>Total leads: {totalLeads}</span>
            {q ? <span className="ml-3">Showing: {rows.length}</span> : null}
          </div>
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
