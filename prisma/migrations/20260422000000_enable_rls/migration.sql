-- Enable Row-Level Security on all public tables.
-- The app accesses these tables exclusively through Prisma using DATABASE_URL,
-- which connects as a privileged Postgres role and bypasses RLS. Enabling RLS
-- with no policies blocks access via Supabase's PostgREST anon/authenticated
-- endpoints, resolving the "rls_disabled_in_public" advisor finding.

ALTER TABLE "visits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cached_bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cached_donors" ENABLE ROW LEVEL SECURITY;
