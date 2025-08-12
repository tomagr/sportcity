import UploadLeadsDialogClient from "@/app/components/UploadLeadsDialogClient";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { leads, ads, clubs } from "@/lib/db/schema";
import { eq, ilike, or, sql, and, ne, isNotNull, gte, desc } from "drizzle-orm";
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
      clubId: leads.clubId,
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

  // Additional stats
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [{ value: leadsLast7 }] = await db
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(leads)
    .where(gte(leads.createdTime, last7));

  const [{ value: uniqueEmails }] = await db
    .select({
      value: sql<number>`count(distinct ${leads.email})`.mapWith(Number),
    })
    .from(leads);

  const [{ value: withPhone }] = await db
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(leads)
    .where(and(isNotNull(leads.phoneNumber), ne(leads.phoneNumber, "")));

  const topClubs = await db
    .select({ name: clubs.name, value: sql<number>`count(*)`.mapWith(Number) })
    .from(leads)
    .leftJoin(clubs, eq(leads.clubId, clubs.id))
    .groupBy(clubs.name)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const topCampaigns = await db
    .select({
      name: ads.campaignName,
      value: sql<number>`count(*)`.mapWith(Number),
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .groupBy(ads.campaignName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return (
    <div className="font-sans min-h-screen">
      <div className="mx-auto max-w-8xl px-4 mt-10 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-4">Upload Leads CSV</h1>
          <UploadLeadsDialogClient />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Lead stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total" value={totalLeads} />
            <StatCard label="Last 7 days" value={leadsLast7} />
            <StatCard label="Unique emails" value={uniqueEmails} />
            <StatCard label="With phone" value={withPhone} />
          </div>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopList
              title="Top clubs"
              rows={
                topClubs.filter((r) => typeof r.name === "string") as {
                  name: string | null;
                  value: number;
                }[]
              }
            />
            <TopList
              title="Top campaigns"
              rows={
                topCampaigns.filter((r) => typeof r.name === "string") as {
                  name: string | null;
                  value: number;
                }[]
              }
            />
          </div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: { name: string | null; value: number }[];
}) {
  const safeRows = rows.filter((r) => r.name && r.name.trim().length > 0);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      {safeRows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No data</div>
      ) : (
        <ul className="divide-y">
          {safeRows.map((r, idx) => (
            <li
              key={`${r.name}-${idx}`}
              className="py-2 flex items-center justify-between"
            >
              <span className="truncate max-w-[70%]">{r.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {r.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
