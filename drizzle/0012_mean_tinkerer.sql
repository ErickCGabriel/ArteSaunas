ALTER TABLE "budgets" ADD COLUMN "assigned_to_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "assigned_to_id" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_assigned_to_idx" ON "budgets" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "invoices_assigned_to_idx" ON "invoices" USING btree ("assigned_to_id");