-- Add new email columns to Club
ALTER TABLE "Club" ADD COLUMN "nutrition_email" text;
--> statement-breakpoint
ALTER TABLE "Club" ADD COLUMN "kids_email" text;
--> statement-breakpoint

-- Backfill nutrition_email from existing email
UPDATE "Club" SET "nutrition_email" = "email" WHERE "email" IS NOT NULL;
--> statement-breakpoint

-- Drop old email column
ALTER TABLE "Club" DROP COLUMN "email";


