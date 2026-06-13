CREATE TABLE "status_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"impact" text DEFAULT 'minor' NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "incident_started_idx" ON "status_incidents" USING btree ("started_at");