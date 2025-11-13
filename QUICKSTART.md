# Quick Start Guide for n8daniels

This guide will get you up and running with CutTheCrap in about 10 minutes.

## Prerequisites

✅ You already have:
- Supabase account
- Node.js and npm installed
- Repository cloned
- Dependencies installed (`npm install` was already run)

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Enable Google Auth

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your CutTheCrap project (or create a new one)
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and toggle it ON
5. Use Supabase's hosted Google OAuth (easiest option)
6. Click **Save**

### 1.2 Run the Database Migration

1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/20241113000000_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### 1.3 Configure URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**: `http://localhost:3000/auth/callback`
4. Click **Save**

## Step 2: Configure Environment Variables (1 minute)

1. In Supabase, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**

3. Create `.env.local` in your project root:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Step 3: Start the App (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 4: Sign In with Google (2 minutes)

1. Go to http://localhost:3000/login
2. Click **"Sign in with Google"**
3. Select **n8daniels@gmail.com**
4. Authorize the app
5. You'll be redirected to `/admin` (will show "Access Denied" for now - that's expected!)

## Step 5: Make Yourself Admin (1 minute)

1. Go back to Supabase dashboard
2. Click **SQL Editor** → **New query**
3. Run this query to find your user ID:

```sql
SELECT id, email FROM auth.users WHERE email = 'n8daniels@gmail.com';
```

4. Copy the `id` value (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

5. Run this query (replace `YOUR-USER-ID-HERE` with the copied ID):

```sql
INSERT INTO public.user_profiles (id, name, role, verified, verified_at)
VALUES (
  'YOUR-USER-ID-HERE',
  'Nate Daniels',
  'admin',
  true,
  NOW()
);
```

6. You should see "Success. 1 rows affected"

## Step 6: Access Admin Dashboard 🎉

1. Go back to http://localhost:3000/admin
2. You should now see the full admin dashboard!
3. Click through the tabs:
   - **API Status**: System health and database stats
   - **Bills**: Manage bills (empty for now)
   - **Users**: See your admin account

## What You Can Do Now

✅ **Full admin access** to the dashboard
✅ **View system statistics** and health
✅ **Manage users** (once you add more)
✅ **View/edit bills** (once you import some)

## Next Steps

### Import Your First Bill

You can manually add a test bill using the sample data:

1. Go to **SQL Editor** in Supabase
2. See `lib/sample-data/sample-bill.json` for an example
3. Or wait for the bill import feature (coming soon)

### Set Up Ollama (Optional - for LLM analysis)

```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama2

# Ollama will run on http://localhost:11434
```

### Add More Users

Share the login page with trusted colleagues. After they sign in with Google, you can:

1. Go to **Admin Dashboard** → **Users** tab
2. Edit their role (admin, verified_author, or user)
3. For verified authors, set their party affiliation

## Troubleshooting

### "Access Denied" after signing in
- Make sure you ran the admin profile SQL
- Check that the UUID matches exactly
- Try logging out and back in

### Google OAuth not working
- Verify redirect URL is exactly: `http://localhost:3000/auth/callback`
- Check Site URL is: `http://localhost:3000`
- Clear browser cache and try again

### Can't see admin dashboard tabs
- Check browser console for errors
- Make sure you're signed in
- Verify role is 'admin' in user_profiles table

## Support

If you run into issues:
1. Check browser console (F12)
2. Check Supabase logs (Dashboard → Logs)
3. Review the detailed setup guide: `docs/GOOGLE_AUTH_SETUP.md`

## Summary

You should now have:
- ✅ Supabase project configured
- ✅ Google OAuth working
- ✅ Admin account set up (n8daniels@gmail.com)
- ✅ Full access to admin dashboard
- ✅ Ready to import bills and add users

**Total time: ~10 minutes** 🚀
