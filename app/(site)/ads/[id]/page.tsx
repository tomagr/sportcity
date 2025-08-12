import { db } from "@/lib/db/client";
import { ads, leads, clubs } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import AdEditDialog from "@/app/components/AdEditDialog";
import type { AdRecord } from "@/app/components/AdEditDialog";
import LeadsTableClient from "@/app/components/LeadsTableClient";
import LeadsStatusTabs from "@/app/components/LeadsStatusTabs";

type Params = Promise<{ id: string }>; // Next.js 15 route segment param
type SearchParams = Promise<{ status?: "sent" | "unsent" }>;

export default async function SiteAdDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const statusParam = (sp?.status === "sent" ? "sent" : "unsent") as
    | "sent"
    | "unsent";
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
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Ad not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
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
    .where(and(eq(leads.adId, ad.id), eq(leads.sent, statusParam === "sent")))
    .orderBy(desc(leads.createdAt))
    .limit(200);

  // Derived lead stats
  const totalLeads = relatedLeads.length;
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const last24h = relatedLeads.filter(
    (l) =>
      l.createdTime &&
      new Date(l.createdTime as unknown as string).getTime() >=
        twentyFourHoursAgo
  ).length;
  const uniqueEmails = new Set(
    relatedLeads.map((l) => l.email).filter((e): e is string => Boolean(e))
  ).size;
  const uniqueClubs = new Set(
    relatedLeads
      .map((l) => l.clubId || l.clubOfInterest)
      .filter((v): v is string => Boolean(v))
  ).size;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {ad.campaignName || ad.adName || ad.adId}
          </h1>
          <p className="text-muted-foreground">Ad detail</p>
        </div>
        {/* Inline CRUD edit dialog */}
        <AdEditDialog ad={ad as AdRecord} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Campaign</div>
          <div className="font-medium">{ad.campaignName || ad.campaignId}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Ad</div>
          <div className="font-medium">{ad.adName || ad.adId}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Adset</div>
          <div className="font-medium">{ad.adsetName || ad.adsetId}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Form</div>
          <div className="font-medium">{ad.formName || ad.formId}</div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        <LeadsStatusTabs value={statusParam} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Leads</div>
          <div className="mt-1 text-2xl font-semibold">{totalLeads}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Last 24h</div>
          <div className="mt-1 text-2xl font-semibold">{last24h}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Unique Emails</div>
          <div className="mt-1 text-2xl font-semibold">{uniqueEmails}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Clubs Reached</div>
          <div className="mt-1 text-2xl font-semibold">{uniqueClubs}</div>
        </div>
      </div>

      <LeadsTableClient
        scope="local"
        sendAllLabel="Send all leads to club"
        rows={relatedLeads.map((r) => ({
          id: r.id,
          adId: ad.id,
          clubId: r.clubId ?? undefined,
          firstName: r.firstName ?? null,
          lastName: r.lastName ?? null,
          email: r.email ?? null,
          phoneNumber: r.phoneNumber ?? null,
          age: null,
          clubOfInterest: r.clubOfInterest ?? null,
          createdTime: r.createdTime
            ? new Date(r.createdTime as unknown as string).toISOString()
            : null,
          campaignName: ad.campaignName ?? null,
        }))}
      />
    </div>
  );
}
