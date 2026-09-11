CREATE TABLE "contact_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"body" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"budget_id" text,
	"description" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_notes_contact_idx" ON "contact_notes" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_contact_idx" ON "maintenance_records" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_budget_idx" ON "maintenance_records" USING btree ("budget_id");--> statement-breakpoint
ALTER TABLE "public"."contact_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."maintenance_records" ENABLE ROW LEVEL SECURITY;