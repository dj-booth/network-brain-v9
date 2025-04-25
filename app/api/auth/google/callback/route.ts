import { NextResponse, type NextRequest } from 'next/server';
import { google } from 'googleapis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// TODO: Consider encrypting/decrypting the refresh token before storing/retrieving
// import { encrypt, decrypt } from '@/lib/encryption'; // Placeholder

// Create Supabase client outside the handler for Route Handler pattern
const createSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Errors can be ignored in Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Errors can be ignored in Route Handlers
          }
        },
      },
    }
  );
};

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();

  // Use the request object directly for getSession in Route Handlers
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
     console.error('Supabase session error:', sessionError);
     return NextResponse.redirect(new URL('/?error=session_error', request.url));
  }

  if (!session) {
    // Not logged in
    return NextResponse.redirect(new URL('/?error=unauthenticated', request.url));
  }
  const userId = session.user.id;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Base URL for redirecting back to settings
  const settingsUrl = new URL('/settings', request.url);

  if (error) {
    console.error('Google OAuth Error:', error);
    settingsUrl.searchParams.set('google_auth_error', error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    console.error('Google OAuth Callback: Missing code');
    settingsUrl.searchParams.set('google_auth_error', 'Missing authorization code');
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  // Use the correct redirect URI for token exchange
  const redirectUri = process.env.GOOGLE_REDIRECT_URI; 

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Google OAuth environment variables for callback');
    settingsUrl.searchParams.set('google_auth_error', 'Server configuration error');
    return NextResponse.redirect(settingsUrl);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri // Ensure this EXACTLY matches the URI in Google Cloud Console and .env.local
  );

  try {
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn('Google OAuth Callback: Missing refresh token. User might need to re-authorize.');
      settingsUrl.searchParams.set('google_auth_error', 'Missing refresh token. Please try connecting again.');
      return NextResponse.redirect(settingsUrl);
    }

    const refreshToken = tokens.refresh_token;
    // const encryptedToken = await encrypt(refreshToken); // Placeholder for encryption

    // Store the refresh token in Supabase
    const { error: upsertError } = await supabase
      .from('user_google_tokens')
      .upsert(
        {
          user_id: userId,
          google_refresh_token: refreshToken, // Store encryptedToken here ideally
        },
        { onConflict: 'user_id' } 
      );

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      settingsUrl.searchParams.set('google_auth_error', 'Failed to save token');
      return NextResponse.redirect(settingsUrl);
    }

    // Redirect to settings page with success indicator
    settingsUrl.searchParams.set('google_auth_success', 'true');
    return NextResponse.redirect(settingsUrl);

  } catch (err: any) {
    console.error('Error exchanging Google token:', err);
    settingsUrl.searchParams.set('google_auth_error', err.message || 'Token exchange failed');
    return NextResponse.redirect(settingsUrl);
  }
} 