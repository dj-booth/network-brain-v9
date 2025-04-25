import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // Although not used here, good practice to check
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Google OAuth environment variables');
    return NextResponse.json(
      { error: 'Google OAuth credentials not configured correctly.' },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Define the scope needed to create/edit calendar events
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  // Generate the URL for the consent screen
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token
    scope: scopes,
    prompt: 'consent', // Force consent screen even if previously authorized
  });

  // Redirect the user to the Google consent screen
  return NextResponse.redirect(authorizationUrl);
} 