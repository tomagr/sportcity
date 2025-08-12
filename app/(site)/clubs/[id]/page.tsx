import { db } from "@/lib/db/client";
import { clubs, leads, ads } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import ClubEditDialog from "@/app/components/ClubEditDialog";
import type { ClubRecord } from "@/app/components/ClubEditDialog";
import LeadsTableClient from "@/app/components/LeadsTableClient";
import LeadsStatusTabs from "@/app/components/LeadsStatusTabs";

type Params = Promise<{ id: string }>; // Next.js 15 route segment param

type SearchParams = Promise<{ status?: "sent" | "unsent" }>;

export default async function SiteClubDetailPage({
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
  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
      updatedAt: clubs.updatedAt,
    })
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);

  if (!club) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Club not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const relatedLeads = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      createdTime: leads.createdTime,
      campaignName: ads.campaignName,
      adId: ads.id,
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .where(
      and(eq(leads.clubId, club.id), eq(leads.sent, statusParam === "sent"))
    )
    .orderBy(desc(leads.createdAt))
    .limit(200);

  // Compute simple lead stats
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const daysAgo = (n: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  const toDate = (v: unknown): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    try {
      return new Date(v as unknown as string);
    } catch {
      return null;
    }
  };
  const totalLeads = relatedLeads.length;
  const leadsToday = relatedLeads.filter((r) => {
    const dt = toDate(r.createdTime);
    return dt ? dt >= startOfToday : false;
  }).length;
  const leads7d = relatedLeads.filter((r) => {
    const dt = toDate(r.createdTime);
    return dt ? dt >= daysAgo(7) : false;
  }).length;
  const leads30d = relatedLeads.filter((r) => {
    const dt = toDate(r.createdTime);
    return dt ? dt >= daysAgo(30) : false;
  }).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{club.name}</h1>
          <p className="text-muted-foreground">Club detail</p>
        </div>
        {/* Inline CRUD edit dialog for club */}
        <ClubEditDialog club={club as ClubRecord} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">
            Nutrition Email
          </div>
          <div className="font-medium">{club.nutritionEmail || "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Kids Email</div>
          <div className="font-medium">{club.kidsEmail || "—"}</div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        <LeadsStatusTabs value={statusParam} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-semibold">{totalLeads}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Today</div>
          <div className="text-2xl font-semibold">{leadsToday}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Last 7 days</div>
          <div className="text-2xl font-semibold">{leads7d}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Last 30 days</div>
          <div className="text-2xl font-semibold">{leads30d}</div>
        </div>
      </div>

      <LeadsTableClient
        scope="local"
        sendAllLabel="Send all leads to club"
        rows={relatedLeads.map((r) => ({
          id: r.id,
          adId: r.adId as string,
          clubId: club.id,
          firstName: r.firstName ?? null,
          lastName: r.lastName ?? null,
          email: r.email ?? null,
          phoneNumber: r.phoneNumber ?? null,
          age: r.age ?? null,
          clubOfInterest: club.name,
          createdTime: r.createdTime
            ? new Date(r.createdTime as unknown as string).toISOString()
            : null,
          campaignName: r.campaignName ?? null,
        }))}
      />
    </div>
  );
}
