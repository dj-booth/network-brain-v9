import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies(); // Await the promise
    const response = NextResponse.redirect(requestUrl.origin);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Use response cookies to set
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Use response cookies to remove (by setting empty value)
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Optionally redirect to an error page or return an error response
      // For now, just redirecting back to origin
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_error`);
    }

    return response; // Return the response with cookies set
  }

  // If no code, redirect to origin (potentially with an error)
  console.warn('Auth callback called without a code parameter.');
  return NextResponse.redirect(`${requestUrl.origin}?error=no_code`);
}
