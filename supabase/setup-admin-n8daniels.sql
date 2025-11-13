-- Setup Admin User for n8daniels@gmail.com
-- Run this SQL in Supabase SQL Editor AFTER signing in with Google for the first time

-- Step 1: Find the user ID (run this first to get the UUID)
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'n8daniels@gmail.com';

-- Step 2: Create/Update admin profile
-- Copy the 'id' from the result above and replace 'USER-ID-FROM-STEP-1' below

INSERT INTO public.user_profiles (
  id,
  name,
  role,
  party,
  title,
  verified,
  verified_at
)
VALUES (
  'USER-ID-FROM-STEP-1',  -- Replace this with the actual UUID from Step 1
  'Nate Daniels',
  'admin',
  NULL,  -- Set to 'democratic', 'republican', or 'independent' if desired
  'System Administrator',
  true,
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  verified = true,
  verified_at = NOW(),
  title = 'System Administrator';

-- Step 3: Verify the admin user was created
SELECT
  up.id,
  up.name,
  up.role,
  up.party,
  up.verified,
  up.verified_at,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'n8daniels@gmail.com';

-- You should see:
-- - role: admin
-- - verified: true
-- - verified_at: (current timestamp)

-- Step 4 (Optional): Create additional admin users
-- Repeat the process for other trusted administrators

-- Step 5 (Optional): Set up verified authors
-- Example for a Democratic author:
/*
INSERT INTO public.user_profiles (
  id,
  name,
  role,
  party,
  title,
  verified,
  verified_at
)
VALUES (
  'author-user-id',
  'Author Name',
  'verified_author',
  'democratic',
  'Policy Analyst',
  true,
  NOW()
);
*/

-- Security Notes:
-- 1. Only run this for trusted users
-- 2. Admin role grants full system access
-- 3. Verify the email before granting admin access
-- 4. Consider enabling MFA for admin accounts in Supabase Auth settings
-- 5. Regularly audit user_profiles table for role assignments
