import { db } from "@/lib/db/client";
import { leads, ads, clubs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import LeadEditDialog from "@/app/components/LeadEditDialog";

type Params = Promise<{ id: string }>; // Next.js 15 route segment param

export default async function SiteLeadDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      id: leads.id,
      adId: leads.adId,
      clubId: leads.clubId,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      age: leads.age,
      createdTime: leads.createdTime,
      campaignName: ads.campaignName,
      clubOfInterest: clubs.name,
    })
    .from(leads)
    .leftJoin(ads, eq(leads.adId, ads.id))
    .leftJoin(clubs, eq(leads.clubId, clubs.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!row) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Lead not found</h1>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const leadForEdit = {
    ...row,
    createdTime: row.createdTime
      ? new Date(row.createdTime as unknown as string).toISOString()
      : null,
  } as unknown as any;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {[row.firstName, row.lastName].filter(Boolean).join(" ") || "Lead"}
          </h1>
          <p className="text-muted-foreground">Lead detail</p>
        </div>
        <LeadEditDialog lead={leadForEdit} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Email</div>
          <div className="font-medium">{row.email || "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Phone</div>
          <div className="font-medium">{row.phoneNumber || "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Age</div>
          <div className="font-medium">{row.age || "—"}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Created</div>
          <div className="font-medium">
            {row.createdTime
              ? new Date(row.createdTime as unknown as string).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Club</div>
          <div className="font-medium">
            {row.clubId ? (
              <Link
                href={`/clubs/${row.clubId}`}
                className="badge badge-primary"
              >
                {row.clubOfInterest}
              </Link>
            ) : (
              row.clubOfInterest || "—"
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <div className="mb-1 text-sm text-muted-foreground">Campaign</div>
          <div className="font-medium">
            {row.campaignName ? (
              <Link href={`/ads/${row.adId}`} className="badge badge-primary">
                {row.campaignName}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
