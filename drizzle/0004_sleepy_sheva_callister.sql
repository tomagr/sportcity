CREATE UNIQUE INDEX "Lead_email_createdTime_unique" ON "Lead" USING btree ("email","createdTime");--> statement-breakpoint
ALTER TABLE "Club" DROP COLUMN "type";