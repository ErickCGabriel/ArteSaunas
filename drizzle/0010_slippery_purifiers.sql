CREATE TABLE "item_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"default_unit_price_cents" integer DEFAULT 0 NOT NULL,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_catalog" ADD CONSTRAINT "item_catalog_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_catalog_description_idx" ON "item_catalog" USING btree ("description");--> statement-breakpoint
ALTER TABLE "public"."item_catalog" ENABLE ROW LEVEL SECURITY;