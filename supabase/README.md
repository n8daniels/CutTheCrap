# Supabase Setup for CutTheCrap

This guide will help you set up Supabase for the CutTheCrap application.

## Prerequisites

- A Supabase account (https://supabase.com)
- Supabase CLI installed locally (optional but recommended)

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Fill in the project details:
   - Name: CutTheCrap
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your API Keys

1. In your Supabase dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the Database Migration

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the contents of `supabase/migrations/20241113000000_initial_schema.sql`
5. Paste into the SQL editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. You should see "Success. No rows returned"

#### Option B: Using Supabase CLI (Recommended for Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 5. Verify the Setup

1. Go to "Table Editor" in your Supabase dashboard
2. You should see the following tables:
   - user_profiles
   - bills
   - bill_sections
   - votes
   - partisan_perspectives
   - content_cache
   - audit_log

### 6. Enable Authentication

1. Go to "Authentication" → "Providers" in your Supabase dashboard
2. Enable "Email" provider (enabled by default)
3. Optional: Configure additional providers (Google, GitHub, etc.)

### 7. Configure Row Level Security

Row Level Security (RLS) policies are already set up in the migration. To verify:

1. Go to "Authentication" → "Policies" in your Supabase dashboard
2. You should see policies for each table
3. These policies enforce:
   - Public read access to bills, sections, and votes
   - Admin-only write access to bills
   - Author-only write access to their own perspectives

## Testing the Connection

You can test the connection by running:

```bash
npm run dev
```

Then try to fetch bills from the API:

```bash
curl http://localhost:3000/api/bills
```

## Generating TypeScript Types

To generate accurate TypeScript types from your Supabase schema:

```bash
# Using Supabase CLI
supabase gen types typescript --local > types/supabase.ts

# Or from remote
supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

## Creating Your First Admin User

After authentication is set up, you'll need to create an admin user:

1. Sign up a user through your application or Supabase dashboard
2. Run this SQL in the SQL Editor:

```sql
-- Replace 'user-id-here' with the actual user UUID from auth.users
INSERT INTO user_profiles (id, name, role, verified)
VALUES ('user-id-here', 'Admin User', 'admin', true);
```

## Sample Data

To load sample data for testing:

```sql
-- This will be added in a future migration
-- For now, you can manually insert the sample bill from lib/sample-data/sample-bill.json
```

## Troubleshooting

### "relation does not exist" error

- Make sure you ran the migration SQL in the correct order
- Check that all tables were created in the "Table Editor"

### Authentication not working

- Verify your `.env.local` has the correct Supabase URL and anon key
- Check that the middleware is set up correctly
- Ensure cookies are enabled in your browser

### RLS policies blocking requests

- Check if the user is authenticated
- Verify the user has the correct role in user_profiles table
- Review policies in "Authentication" → "Policies"

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment-specific projects** (dev, staging, production)
3. **Rotate your database password** regularly
4. **Enable 2FA** on your Supabase account
5. **Monitor usage** in the Supabase dashboard
6. **Review audit logs** regularly

## Helpful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Next Steps

1. Set up your first admin user
2. Import bill data from Congress.gov API
3. Create verified author accounts
4. Configure email templates for authentication
5. Set up production environment
