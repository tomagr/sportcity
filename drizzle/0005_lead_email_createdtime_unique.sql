-- Normalize emails to lowercase and trimmed to improve deduplication accuracy
UPDATE "Lead"
SET "email" = lower(trim("email"))
WHERE "email" IS NOT NULL AND "email" <> lower(trim("email"));
-- statement-breakpoint

-- Remove duplicates keeping the most recently updated row per (email, createdTime)
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY email, "createdTime"
      ORDER BY "updatedAt" DESC, id DESC
    ) AS rn
  FROM "Lead"
  WHERE email IS NOT NULL AND "createdTime" IS NOT NULL
), to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM "Lead" l
USING to_delete d
WHERE l.id = d.id;
-- statement-breakpoint

-- Enforce uniqueness for future inserts/updates
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_email_createdTime_unique"
  ON "Lead" USING btree ("email", "createdTime");


