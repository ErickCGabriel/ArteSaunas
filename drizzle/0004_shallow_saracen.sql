CREATE TABLE "budget_files" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"stored_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_files" ADD CONSTRAINT "budget_files_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_files" ADD CONSTRAINT "budget_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_files_budget_idx" ON "budget_files" USING btree ("budget_id");--> statement-breakpoint
-- Mesma política das demais tabelas (ver 0001): RLS habilitado sem policies
-- bloqueia o acesso público via PostgREST; o app conecta direto via
-- DATABASE_URL, o que ignora RLS.
ALTER TABLE "public"."budget_files" ENABLE ROW LEVEL SECURITY;