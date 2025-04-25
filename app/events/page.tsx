'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, MapPin, Users, Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventAttendees } from '../../app/components/EventAttendees';
import { format } from 'date-fns';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  short_description: string;
  description: string;
  event_date: string;
  location: string;
  attendee_count: number;
  slug: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('selected');

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) throw error;

        setEvents(data || []);
        
        // If there's a selected slug, find and set the selected event
        if (selectedSlug) {
          const selected = data?.find(e => e.slug === selectedSlug) || null;
          setSelectedEvent(selected);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [selectedSlug]);

  const EventList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Events</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No events found. Create your first event to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <Link 
                key={event.id} 
                href={`/events?selected=${event.slug}`}
                className={`block ${selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''}`}
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    {event.short_description && (
                      <CardDescription>{event.short_description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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

      <div className="p-4 border-t">
        <Link href="/events/new" className="w-full">
          <Button className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[400px] border-r bg-muted/10">
        <EventList />
      </div>
      <div className="flex-1 overflow-auto">
        {selectedEvent ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
              {selectedEvent.short_description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedEvent.short_description.length > 150 
                    ? `${selectedEvent.short_description.slice(0, 150)}...` 
                    : selectedEvent.short_description}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(selectedEvent.event_date), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {selectedEvent.attendee_count} {selectedEvent.attendee_count === 1 ? 'attendee' : 'attendees'}
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {selectedEvent.location}
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">About</h3>
                <div className="text-sm text-muted-foreground">
                  {selectedEvent.description.length > 300 ? (
                    <>
                      <p className="whitespace-pre-wrap">{selectedEvent.description.slice(0, 300)}</p>
                      <Button
                        variant="link"
                        className="px-0 py-1 h-auto text-xs"
                        onClick={() => {
                          // TODO: Implement full description view
                          console.log('Show full description');
                        }}
                      >
                        Read more
                      </Button>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-3">Attendees</h3>
              <EventAttendees eventId={selectedEvent.id} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select an event to view details
          </div>
        )}
      </div>
    </div>
  );
} 