-- Enable Row-Level Security on Prisma's migration-tracking table.
-- Prisma creates _prisma_migrations in the public schema automatically and
-- accesses it through DATABASE_URL (a privileged role that bypasses RLS).
-- Enabling RLS with no policies blocks access via Supabase's PostgREST
-- anon/authenticated endpoints, resolving the advisor finding for this table.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
