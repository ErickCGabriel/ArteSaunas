CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"address" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"contact_id" text,
	"budget_id" text,
	"assigned_to_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'analista';--> statement-breakpoint
CREATE INDEX "calendar_events_start_idx" ON "calendar_events" USING btree ("start_at");--> statement-breakpoint
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;