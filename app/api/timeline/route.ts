import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const type = searchParams.get('type');
    
    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    if (type === 'notes') {
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (notesError) throw notesError;
      return NextResponse.json(notes);
    }

    if (type === 'events') {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_time,
          event_attendees!inner (
            response_status
          )
        `)
        .eq('event_attendees.person_id', personId)
        .order('start_time', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (eventsError) throw eventsError;

      // Transform the data to include the response_status directly in the event object
      const transformedEvents = events.map(event => ({
        ...event,
        response_status: event.event_attendees[0].response_status
      }));

      return NextResponse.json(transformedEvents);
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 