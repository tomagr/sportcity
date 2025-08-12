CREATE TABLE "Ad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adId" text NOT NULL,
	"adName" text,
	"adsetId" text,
	"adsetName" text,
	"adgroupId" text,
	"campaignId" text,
	"campaignName" text,
	"formId" text,
	"formName" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metaId" text NOT NULL,
	"firstName" text,
	"lastName" text,
	"email" text,
	"phoneNumber" text,
	"leadStatus" text,
	"age" text,
	"clubOfInterest" text,
	"platform" text,
	"createdTime" timestamp,
	"adId" uuid NOT NULL,
	"importId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_adId_Ad_id_fk" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Ad_adId_unique" ON "Ad" USING btree ("adId");--> statement-breakpoint
CREATE UNIQUE INDEX "Lead_metaId_unique" ON "Lead" USING btree ("metaId");--> statement-breakpoint
CREATE INDEX "Lead_importId_idx" ON "Lead" USING btree ("importId");