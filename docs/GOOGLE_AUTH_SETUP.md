# Google Authentication Setup for CutTheCrap

This guide will help you set up Google OAuth authentication for n8daniels@gmail.com.

## Step 1: Enable Google Auth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand

4. **Enable Google provider**
   - Toggle "Enable Sign in with Google" to ON

5. **Get Google OAuth Credentials**

   You have two options:

   ### Option A: Use Supabase's Google OAuth (Easiest)
   - Just toggle it on - Supabase provides credentials
   - Skip to "Configure Redirect URLs" below

   ### Option B: Use Your Own Google OAuth App
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: CutTheCrap
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
   - Paste into Supabase Google provider settings

6. **Configure Redirect URLs**
   - Add your app URLs to the redirect list:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://yourdomain.com/auth/callback`

7. Click **Save**

## Step 2: Update Site URL in Supabase

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (when deployed)

## Step 3: Sign In with Google

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Select n8daniels@gmail.com
5. Authorize the app

## Step 4: Create Admin Profile

After signing in the first time, you need to create your admin profile.

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Create a new query
4. Run this SQL:

```sql
-- First, find your user ID from the auth.users table
SELECT id, email FROM auth.users WHERE email = 'n8daniels@gmail.com';

-- Copy the ID from the result, then run:
-- Replace 'YOUR-USER-ID-HERE' with the actual UUID

INSERT INTO public.user_profiles (id, name, role, party, verified, verified_at)
VALUES (
  'YOUR-USER-ID-HERE',
  'Nate Daniels',
  'admin',
  NULL,  -- or 'democratic', 'republican', 'independent' if desired
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  verified = true,
  verified_at = NOW();
```

5. Now visit `http://localhost:3000/admin`
6. You should have full admin access! 🎉

## Step 5: Verify Everything Works

Test your setup:

1. **Login**: Go to `/login` and sign in with Google
2. **Profile**: Check that your user profile was created
3. **Admin Access**: Visit `/admin` - you should see the dashboard
4. **API Status**: Check the API Status tab shows system health
5. **Logout**: Test logout functionality

## Troubleshooting

### "Email not confirmed" error
- Google OAuth users are auto-confirmed
- Check Supabase Auth → Users to verify user exists

### "Access Denied" on /admin
- Verify user_profiles entry was created correctly
- Check that role = 'admin'
- Check browser console for errors

### OAuth redirect issues
- Verify redirect URLs match exactly in Supabase settings
- Check Site URL is configured correctly
- Clear browser cache and try again

### User exists but no profile
- Run the admin profile SQL script again
- Check for conflicts in user_profiles table

## Security Notes

- Admin role grants full access to the system
- Only give admin role to trusted users
- Consider using MFA for admin accounts (Supabase supports this)
- Regularly review user_profiles table for role assignments

## Next Steps

Once your admin account is working:

1. Create additional admin users if needed
2. Set up verified author accounts
3. Import bill data
4. Configure Ollama for LLM analysis
5. Deploy to production

For production deployment, remember to:
- Update Site URL to production domain
- Update redirect URLs to production domain
- Use production Google OAuth credentials (recommended)
- Enable MFA for admin accounts
