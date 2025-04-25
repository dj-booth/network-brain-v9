import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addEventAttendee() {
  const { data, error } = await supabase
    .from('event_attendees')
    .insert({
      event_id: '79157d36-ebc7-46ad-a75a-f653206e3c72',
      person_id: '2b7977ad-c771-41fd-9d5a-157f3c756fcf',
      response_status: 'needsAction',
      notifications_enabled: true,
      is_organizer: false,
      is_optional: false
    })
    .select();

  if (error) {
    console.error('Error adding event attendee:', error);
    return;
  }

  console.log('Successfully added event attendee:', data);
}

addEventAttendee(); 