import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { ads, leads, clubs } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { normalizeNameKey, toDisplayName } from '@/lib/name';

// Normalize CSV header keys: lowercased, trimmed, spaces/accents replaced, punctuation removed
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

type ImportRow = Record<string, string | null | undefined>;

function parseCreatedTime(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // Case: 2025-08-06 23:56:22(UTC-06:00)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\(UTC([+\-]\d{2}:\d{2})\)$/);
  if (m) {
    const iso = `${m[1]}T${m[2]}${m[3]}`; // 2025-08-06T23:56:22-06:00
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseAdFromRow(row: ImportRow) {
  // Support both schemas
  const adId = row['ad_id'] ?? row['adid'] ?? row['adid_'];
  const adName = row['ad_name'];
  const adsetId = row['adset_id'];
  const adsetName = row['adset_name'];
  const adgroupId = row['adgroup_id'];
  const campaignId = row['campaign_id'];
  const campaignName = row['campaign_name'];
  const formId = row['form_id'];
  const formName = row['form_name'];
  return {
    adId: adId ? String(adId) : '',
    adName: adName ? String(adName) : null,
    adsetId: adsetId ? String(adsetId) : null,
    adsetName: adsetName ? String(adsetName) : null,
    adgroupId: adgroupId ? String(adgroupId) : null,
    campaignId: campaignId ? String(campaignId) : null,
    campaignName: campaignName ? String(campaignName) : null,
    formId: formId ? String(formId) : null,
    formName: formName ? String(formName) : null,
  };
}

function parseLeadFromRow(row: ImportRow, adRecordId: string, importId: string) {
  // Age and club across schemas with accents
  const age = row['que_edad_tiene_tu_peque'] ?? row['que_edad_tiene_tu_peque_'];
  const clubName = row['cual_es_el_club_de_tu_interes'] ?? row['cual_es_el_club_de_tu_preferencia'];

  // Meta ID and platform vary
  const metaId = row['id'] ?? row['lead_id'];
  const platform = row['platform'] ?? row['plaform'] ?? row['plataforma'];

  // Name fields vary: sometimes combined Name, sometimes first/last
  const firstName = row['first_name'] ?? row['name'] ?? null;
  const lastName = row['last_name'] ?? null;
  const email = row['email'] ?? row['correo'] ?? null;
  const phone = row['phone_number'] ?? row['phone'];
  const leadStatus = row['lead_status'] ?? null;

  return {
    metaId: metaId ? String(metaId) : '',
    firstName: firstName ? String(firstName) : null,
    lastName: lastName ? String(lastName) : null,
    email: email ? String(email).trim().toLowerCase() : null,
    phoneNumber: phone ? String(phone) : null,
    leadStatus: leadStatus ? String(leadStatus) : null,
    age: age ? String(age) : null,
    clubName: clubName ? String(clubName) : null,
    platform: platform ? String(platform) : null,
    createdTime: parseCreatedTime(row['created_time']),
    adId: adRecordId,
    importId,
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Build a normalized club name cache to avoid duplicate creations during import
    const normalizeClubKey = (name: string): string => normalizeNameKey(name.replace(/_/g, ' '));

    const existingClubs = await db.select({ id: clubs.id, name: clubs.name }).from(clubs);
    const clubKeyToId = new Map<string, string>();
    for (const c of existingClubs) {
      const key = normalizeClubKey(c.name);
      if (!clubKeyToId.has(key)) clubKeyToId.set(key, c.id);
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const importId = String(form.get('importId') || '');
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const text = await file.text();

    // Simple CSV parsing to avoid extra deps: split lines and commas respecting quotes
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ rows: 0, created: 0, updated: 0 }, { status: 200 });
    }

    // Parse header
    const headerRaw = lines[0];
    const headers = headerRaw
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) // split by commas not inside quotes
      .map((h) => normalizeKey(h.replace(/^\"|\"$/g, '')));

    let created = 0;
    let updated = 0;
    const rowsProcessed = lines.length - 1;

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      const cols = line
        .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
        .map((c) => c.replace(/^\"|\"$/g, ''));
      const row: ImportRow = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx];
      });

      // Build or find Ad by adId
      const adPayload = parseAdFromRow(row);
      if (!adPayload.adId) continue; // skip invalid

      const existingAd = await db.query.ads.findFirst({
        where: (a, { eq }) => eq(a.adId, adPayload.adId),
      });

      let adRecordId: string;
      if (existingAd) {
        await db.update(ads).set({
          adName: adPayload.adName,
          adsetId: adPayload.adsetId,
          adsetName: adPayload.adsetName,
          adgroupId: adPayload.adgroupId,
          campaignId: adPayload.campaignId,
          campaignName: adPayload.campaignName,
          formId: adPayload.formId,
          formName: adPayload.formName,
          updatedAt: new Date(),
        }).where(eq(ads.id, existingAd.id));
        adRecordId = existingAd.id;
      } else {
        const inserted = await db.insert(ads).values({
          adId: adPayload.adId,
          adName: adPayload.adName,
          adsetId: adPayload.adsetId,
          adsetName: adPayload.adsetName,
          adgroupId: adPayload.adgroupId,
          campaignId: adPayload.campaignId,
          campaignName: adPayload.campaignName,
          formId: adPayload.formId,
          formName: adPayload.formName,
        }).returning({ id: ads.id });
        adRecordId = inserted[0].id;
      }

      // Build or upsert Lead by metaId
      const leadPayload = parseLeadFromRow(row, adRecordId, importId);
      if (!leadPayload.metaId) continue;

      // Resolve Club by name (create if missing)
      let clubId: string | null = null;
      const rawClubName = leadPayload.clubName?.trim();
      if (rawClubName) {
        const key = normalizeClubKey(rawClubName);
        const cached = clubKeyToId.get(key);
        if (cached) {
          clubId = cached;
        } else {
          const displayName = toDisplayName(rawClubName);
          const insertedClub = await db
            .insert(clubs)
            .values({ name: displayName })
            .returning({ id: clubs.id });
          clubId = insertedClub[0]?.id ?? null;
          if (clubId) clubKeyToId.set(key, clubId);
        }
      }

      const existingLead = await db.query.leads.findFirst({
        where: (l, { eq }) => eq(l.metaId, leadPayload.metaId),
      });

      if (existingLead) {
        await db
          .update(leads)
          .set({
            firstName: leadPayload.firstName,
            lastName: leadPayload.lastName,
            email: leadPayload.email,
            phoneNumber: leadPayload.phoneNumber,
            leadStatus: leadPayload.leadStatus,
            age: leadPayload.age,
            clubId: clubId ?? existingLead.clubId ?? null,
            platform: leadPayload.platform,
            createdTime: leadPayload.createdTime ?? existingLead.createdTime,
            adId: adRecordId,
            importId,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, existingLead.id));
        updated += 1;
      } else {
        // If metaId is new, also deduplicate by (email, createdTime)
        let dupByEmailTime: { id: string } | undefined;
        if (leadPayload.email && leadPayload.createdTime) {
          const found = await db.query.leads.findFirst({
            where: (l, { and, eq }) =>
              and(eq(l.email, leadPayload.email as string), eq(l.createdTime, leadPayload.createdTime as Date)),
            columns: { id: true },
          });
          dupByEmailTime = found ?? undefined;
        }

        if (dupByEmailTime) {
          await db
            .update(leads)
            .set({
              metaId: leadPayload.metaId,
              firstName: leadPayload.firstName,
              lastName: leadPayload.lastName,
              email: leadPayload.email,
              phoneNumber: leadPayload.phoneNumber,
              leadStatus: leadPayload.leadStatus,
              age: leadPayload.age,
              clubId: clubId,
              platform: leadPayload.platform,
              createdTime: leadPayload.createdTime,
              adId: adRecordId,
              importId,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, dupByEmailTime.id));
          updated += 1;
        } else {
          await db.insert(leads).values({
            metaId: leadPayload.metaId,
            firstName: leadPayload.firstName,
            lastName: leadPayload.lastName,
            email: leadPayload.email,
            phoneNumber: leadPayload.phoneNumber,
            leadStatus: leadPayload.leadStatus,
            age: leadPayload.age,
            clubId: clubId,
            platform: leadPayload.platform,
            createdTime: leadPayload.createdTime,
            adId: adRecordId,
            importId,
          });
          created += 1;
        }
      }
    }

    return NextResponse.json({ rows: rowsProcessed, created, updated, importId }, { status: 200 });
  } catch (error) {
    console.log('LOG =====> Import error', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}


