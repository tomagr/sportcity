import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import ClubsTableClient from "@/app/components/ClubsTableClient";

async function getClubs() {
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      nutritionEmail: clubs.nutritionEmail,
      kidsEmail: clubs.kidsEmail,
      createdAt: clubs.createdAt,
    })
    .from(clubs)
    .orderBy(asc(clubs.name));
  return rows;
}

export default async function ClubsListPage() {
  const clubList = await getClubs();
  return <ClubsTableClient rows={clubList} />;
}
