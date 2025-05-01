import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  attendee_count: number;
  slug: string;
}

interface CommunityEventsProps {
  communityId: string;
}

export function CommunityEvents({ communityId }: CommunityEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('events')
          .select('id, title, event_date, location, attendee_count, slug')
          .eq('community_id', communityId)
          .gte('event_date', timeFilter === 'upcoming' ? now : '1900-01-01')
          .lt('event_date', timeFilter === 'past' ? now : '2100-01-01')
          .order('event_date', { ascending: timeFilter === 'upcoming' })
          .limit(3);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching community events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [communityId, timeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Events</h3>
        <div className="inline-flex items-center rounded-lg border bg-card p-1">
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              timeFilter === 'upcoming'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            onClick={() => setTimeFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              timeFilter === 'past'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            onClick={() => setTimeFilter('past')}
          >
            Past
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No {timeFilter} events found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events?selected=${event.slug}`}
              className="block"
            >
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">{event.title}</h4>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(event.event_date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {event.attendee_count} {event.attendee_count === 1 ? 'attendee' : 'attendees'}
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 