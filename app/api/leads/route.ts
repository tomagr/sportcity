import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { verifySessionFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    type DeleteLeadsRequestBody = { ids?: unknown };
    const body: DeleteLeadsRequestBody = await req
      .json()
      .catch(() => ({} as DeleteLeadsRequestBody));
    const ids: string[] = Array.isArray(body.ids)
      ? (body.ids as unknown[]).filter(
          (value: unknown): value is string => typeof value === "string"
        )
      : [];
    if (ids.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }
    const res = await db.delete(leads).where(inArray(leads.id, ids));
    console.log(`LOG =====> Deleted ${ids.length} leads`);
    return NextResponse.json({ deleted: ids.length, ok: true });
  } catch (e) {
    console.log("LOG =====> DELETE /api/leads error", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}


