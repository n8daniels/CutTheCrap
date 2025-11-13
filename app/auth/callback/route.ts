import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth callback handler
 * This route handles the OAuth redirect from providers like Google
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      // Redirect to login with error
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    // Get the user to check if profile exists
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // If no profile exists, create a basic one
      if (profileError || !profile) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'user', // Default role - admin must be set manually for security
            verified: false,
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }
      }
    }
  }

  // Redirect to admin dashboard (will handle permissions there)
  return NextResponse.redirect(`${origin}/admin`);
}
