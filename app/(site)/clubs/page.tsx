import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import ClubsTableClient from "@/app/components/ClubsTableClient";

export default async function SiteClubsListPage() {
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .orderBy(asc(clubs.name))
    .limit(500);

  return <ClubsTableClient rows={rows} apiBase="/api/clubs" />;
}
