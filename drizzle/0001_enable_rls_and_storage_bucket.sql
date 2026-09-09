-- Enables Row Level Security with zero policies on every table. This blocks
-- access through Supabase's public REST API (PostgREST) for the anon/
-- authenticated roles — our app never uses that API, it connects directly
-- via DATABASE_URL as the table-owning role, which bypasses RLS. Without
-- this, anyone with the project's anon key could read/write every row
-- (including password hashes) straight through the REST API.
ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."budget_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Private bucket for contact file uploads (plans, photos). Accessed only
-- server-side via the service role key, which bypasses storage RLS too.
insert into storage.buckets (id, name, public)
values ('contact-files', 'contact-files', false)
on conflict (id) do nothing;
