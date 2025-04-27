import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// No longer need placeholder
// const TARGET_USER_ID = '...';

// Corrected Supabase client creation for Route Handlers
const createSupabaseClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
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
            // Use the passed cookieStore object directly
            cookieStore.set({ name, value, ...options }); 
          } catch (error) {
            // Errors can be ignored in Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
             // Use the passed cookieStore object directly
            cookieStore.set({ name, value: '', ...options }); 
          } catch (error) {
             // Errors can be ignored in Route Handlers
          }
        },
      },
    }
  );
};

export async function POST() { // Using POST as this triggers an action
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(cookieStore);

  // Get the logged-in user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Supabase session error:', sessionError);
    return NextResponse.json({ error: 'Failed to retrieve session.' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
  }
  const userId = session.user.id;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI; // Needed for OAuth2 client

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Missing Google OAuth environment variables for sync');
    return NextResponse.json({ error: 'Google OAuth credentials not configured.' }, { status: 500 });
  }

  try {
    // 1. Fetch the Google Refresh Token for the target user
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('google_refresh_token')
      .eq('user_id', userId) // Use the actual user ID from the session
      .single();

    if (tokenError || !tokenData?.google_refresh_token) {
      console.error('Failed to fetch Google refresh token:', tokenError);
      return NextResponse.json({ error: 'Google account not linked or token missing.' }, { status: 400 });
    }
    const refreshToken = tokenData.google_refresh_token;
    // TODO: Decrypt token if it was encrypted during storage

    // 2. Initialize Google OAuth2 client and Calendar API
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Refresh the access token (optional here, googleapis library often handles it)
    // await oauth2Client.refreshAccessToken(); 

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 3. Fetch 'published' events from Supabase
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*') // Select all fields, or specify needed ones
      .eq('status', 'published');

    if (eventsError) {
      console.error('Failed to fetch events from Supabase:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events.' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No published events to sync.' });
    }

    // 4. Process each event
    for (const event of events) {
      // TODO: Implement logic to fetch 'invited' attendees for this event
      // const { data: attendees, error: attendeesError } = await supabase
      //   .from('event_attendees') // Assuming this table name
      //   .select('email') // Assuming attendee email is stored
      //   .eq('event_id', event.id)
      //   .eq('status', 'invited');
      
      // TODO: Handle attendeesError

      // Map Supabase event data to Google Calendar event format
      const calendarEvent = {
        summary: event.title, // Map Supabase field names
        description: event.description,
        start: {
          dateTime: new Date(event.start_time).toISOString(), // Ensure start_time is a valid ISO string or Date object
          timeZone: 'UTC', // Or fetch user's timezone if available
        },
        end: {
          dateTime: new Date(event.end_time).toISOString(), // Ensure end_time is a valid ISO string or Date object
          timeZone: 'UTC', // Or fetch user's timezone if available
        },
        // attendees: attendees?.map(att => ({ email: att.email })) || [],
        // TODO: Add other relevant fields (location, etc.)
        // TODO: Use event.google_calendar_event_id if it exists for updates
      };

      try {
        // TODO: Check if event.google_calendar_event_id exists
        // If yes, use calendar.events.update()
        // If no, use calendar.events.insert() and store the returned ID back in Supabase
        
        const createdEvent = await calendar.events.insert({
          calendarId: 'primary', // Or use a specific calendar ID if configured
          requestBody: calendarEvent,
          sendNotifications: true, // Send invites to attendees
        });

        console.log('Event created: %s', createdEvent.data.htmlLink);
        // TODO: Update the Supabase event record with createdEvent.data.id
        // await supabase
        //   .from('events')
        //   .update({ google_calendar_event_id: createdEvent.data.id })
        //   .eq('id', event.id);

      } catch (apiError: unknown) {
        if (apiError && typeof apiError === 'object' && 'message' in apiError) {
          console.error(`Error syncing event ${event.id} to Google Calendar:`, (apiError as { message?: string }).message);
        } else {
          console.error(`Error syncing event ${event.id} to Google Calendar:`, apiError);
        }
        // Decide if we should continue with other events or stop
      }
    }

    return NextResponse.json({ message: `Successfully processed ${events.length} events.` });

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.error('Error in event sync:', (error as { message?: string }).message);
      return NextResponse.json({ error: (error as { message?: string }).message || 'Internal server error' }, { status: 500 });
    } else {
      console.error('Error in event sync:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
} 