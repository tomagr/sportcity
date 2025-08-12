-- Create Club table
CREATE TABLE "Club" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "type" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Unique index on name
CREATE UNIQUE INDEX "Club_name_unique" ON "Club" USING btree ("name");
--> statement-breakpoint

-- Add clubId column to Lead
ALTER TABLE "Lead" ADD COLUMN "clubId" uuid;
--> statement-breakpoint

-- Add FK constraint (set null on delete, cascade on update)
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clubId_Club_id_fk" FOREIGN KEY ("clubId") REFERENCES "public"."Club"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint

-- Backfill: insert distinct clubs from existing Lead.clubOfInterest
INSERT INTO "Club" ("name")
SELECT DISTINCT trim("clubOfInterest") AS name
FROM "Lead"
WHERE "clubOfInterest" IS NOT NULL AND trim("clubOfInterest") <> ''
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Backfill: set Lead.clubId based on matching Club.name
UPDATE "Lead" l
SET "clubId" = c."id"
FROM "Club" c
WHERE c."name" = l."clubOfInterest" AND l."clubOfInterest" IS NOT NULL;
--> statement-breakpoint

-- Drop deprecated text column
ALTER TABLE "Lead" DROP COLUMN "clubOfInterest";


