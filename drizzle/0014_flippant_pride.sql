CREATE TABLE "contract_files" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"stored_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"contact_id" text NOT NULL,
	"budget_id" text,
	"contract_date" timestamp with time zone NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"notes" text,
	"created_by_id" text,
	"assigned_to_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "contract_files" ADD CONSTRAINT "contract_files_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_files" ADD CONSTRAINT "contract_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_files_contract_idx" ON "contract_files" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contracts_contact_idx" ON "contracts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contracts_budget_idx" ON "contracts" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_assigned_to_idx" ON "contracts" USING btree ("assigned_to_id");--> statement-breakpoint
ALTER TABLE "public"."contract_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;