import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const importId = searchParams.get('importId') ?? '';
    const startedAtRaw = searchParams.get('startedAt');

    if (!importId || !startedAtRaw) {
      return NextResponse.json(
        { error: 'Missing importId or startedAt' },
        { status: 400 }
      );
    }

    const startedAt = new Date(startedAtRaw);
    if (isNaN(startedAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startedAt' },
        { status: 400 }
      );
    }

    const [row] = await db
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(leads)
      .where(and(eq(leads.importId, importId), gte(leads.createdAt, startedAt)));

    const created = row?.value ?? 0;

    return NextResponse.json({ created }, { status: 200 });
  } catch (error) {
    console.log('LOG =====> Import status error', error);
    return NextResponse.json({ error: 'Failed to read status' }, { status: 500 });
  }
}


