'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MapPin, Users, Calendar, Edit, Save, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventAttendees } from '../../app/components/EventAttendees';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { CreateEventModal } from '@/app/components/CreateEventModal';

interface Event {
  id: string;
  title: string;
  short_description: string;
  description: string;
  event_date: string;
  location: string;
  attendee_count: number;
  slug: string;
  community_id: string | null;
}

interface Community {
    id: string;
    name: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});
  const [timeFilter, setTimeFilter] = useState<'all' | 'past' | 'future'>('all');
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('selected');

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, community_id')
          .order('event_date', { ascending: true });

        if (eventError) throw eventError;
        setEvents(eventData || []);

        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('id, name');
        
        if (communityError) throw communityError;
        setCommunities(communityData || []);
        
        if (selectedSlug && eventData) {
          const selected = eventData.find(e => e.slug === selectedSlug) || null;
          setSelectedEvent(selected);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [selectedSlug]);

  useEffect(() => {
    if (selectedEvent) {
      setEditedEvent({ ...selectedEvent }); 
      setIsEditing(false);
    } else {
      setEditedEvent({});
      setIsEditing(false);
    }
  }, [selectedEvent]);

  const reloadEvents = async (keepSelection = true) => {
    setLoading(true);
    try {
       const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, community_id')
          .order('event_date', { ascending: true });

      if (eventError) throw eventError;
      setEvents(eventData || []);
      
      if (keepSelection && selectedSlug && eventData) {
        const selected = eventData.find(e => e.slug === selectedSlug) || null;
        setSelectedEvent(selected);
        if (selected) {
          setEditedEvent({ ...selected });
        }
      } else if (!keepSelection) {
        setSelectedEvent(null);
        setEditedEvent({});
      }

    } catch (error) {
      console.error('Error reloading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof Event, value: string | number | null) => {
    setEditedEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedEvent) return;

    const updateData: Partial<Event> = {
        title: editedEvent.title,
        short_description: editedEvent.short_description,
        description: editedEvent.description,
        event_date: editedEvent.event_date, 
        location: editedEvent.location,
        community_id: editedEvent.community_id,
    };

    if (!updateData.title) {
      console.error("Title cannot be empty");
      return;
    }
    if (!updateData.event_date) {
        console.error("Date cannot be empty");
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', selectedEvent.id);

        if (error) throw error;

        await reloadEvents(true);
        setIsEditing(false);

    } catch (error) {
        console.error('Error saving event:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedEvent({ ...selectedEvent });
    setIsEditing(false);
  };

  const filteredEvents = selectedCommunityId 
    ? events.filter(event => event.community_id === selectedCommunityId)
    : events;

  // Apply time filter
  const timeFilteredEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate date comparison

    switch (timeFilter) {
      case 'past':
        return eventDate < today;
      case 'future':
        return eventDate >= today;
      default:
        return true;
    }
  });

  const EventList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <Select 
          value={selectedCommunityId ?? 'all'} 
          onValueChange={(value) => {
            setSelectedCommunityId(value === 'all' ? null : value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by community" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communities</SelectItem>
            {communities.map(community => (
              <SelectItem key={community.id} value={community.id}>
                {community.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={timeFilter} 
          onValueChange={(value: 'all' | 'past' | 'future') => {
            setTimeFilter(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="future">Future Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading && !timeFilteredEvents.length ? (
          <div className="text-center py-8">Loading events...</div>
        ) : timeFilteredEvents.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {selectedCommunityId 
                  ? 'No events found for this community.' 
                  : timeFilter !== 'all'
                    ? `No ${timeFilter} events found.`
                    : 'No events found.'
                } 
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {timeFilteredEvents.map((event) => (
              <Link 
                key={event.id} 
                href={`/events?selected=${event.slug}`}
                className={`block rounded-lg border bg-card text-card-foreground shadow-sm ${selectedEvent?.id === event.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <div className="hover:bg-muted/50 transition-colors cursor-pointer p-0">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        {event.short_description && (
                          <CardDescription>{event.short_description}</CardDescription>
                        )}
                        {event.community_id && (
                          <div className="mt-2">
                            {communities.map((community) => {
                              if (community.id === event.community_id) {
                                const isSomethingNew = community.name === 'Something New';
                                const colors = [
                                  'bg-blue-100 text-blue-800',
                                  'bg-green-100 text-green-800',
                                  'bg-purple-100 text-purple-800',
                                  'bg-pink-100 text-pink-800',
                                ];
                                const colorClass = isSomethingNew 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : colors[0];

                                return (
                                  <Badge 
                                    key={community.id} 
                                    variant="outline" 
                                    className={`border ${colorClass}`}
                                  >
                                    {community.name}
                                  </Badge>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <Button className="w-full" onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
      </div>
    </div>
  );

  const selectedCommunityName = selectedEvent?.community_id 
    ? communities.find(c => c.id === selectedEvent.community_id)?.name
    : null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[400px] border-r bg-muted/10">
        <EventList />
      </div>
      <div className="flex-1 overflow-auto">
        {selectedEvent ? (
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4">
                {isEditing ? (
                  <Input 
                    placeholder="Event Title"
                    value={editedEvent.title || ''} 
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="text-2xl font-bold p-0 border-0 shadow-none focus-visible:ring-0 h-auto"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <XCircle className="h-4 w-4 mr-1"/> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading}> 
                      <Save className="h-4 w-4 mr-1"/> {loading ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1"/> Edit
                  </Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <Textarea
                  placeholder="Short Description (optional)"
                  value={editedEvent.short_description || ''}
                  onChange={(e) => handleEditChange('short_description', e.target.value)}
                  className="text-sm text-muted-foreground mb-3 min-h-[60px]"
              />
            ) : selectedEvent.short_description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedEvent.short_description} 
                </p>
              )
            }
              
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-6">
              <div className="flex items-center">
                 <Calendar className="h-3.5 w-3.5 mr-1" />
                {isEditing ? (
                   <Input 
                      type="date" 
                      value={editedEvent.event_date ? format(parseISO(editedEvent.event_date), 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleEditChange('event_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="h-6 px-1 py-0 text-xs border-dashed"
                   />
                ) : (
                   format(new Date(selectedEvent.event_date), 'MMMM d, yyyy')
                )}
              </div>
              <div className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                {selectedEvent.attendee_count} {selectedEvent.attendee_count === 1 ? 'attendee' : 'attendees'}
              </div>
              <div className="flex items-center">
                 <MapPin className="h-3.5 w-3.5 mr-1" />
                {isEditing ? (
                   <Input 
                      placeholder="Location (optional)"
                      value={editedEvent.location || ''}
                      onChange={(e) => handleEditChange('location', e.target.value)}
                      className="h-6 px-1 py-0 text-xs border-dashed"
                   />
                ) : selectedEvent.location ? (
                   selectedEvent.location
                ) : (
                  <span className="italic">No location</span>
                )}
              </div>
              <div className="flex items-center">
                {isEditing ? (
                  <Select 
                    value={editedEvent.community_id || 'none'} 
                    onValueChange={(value) => handleEditChange('community_id', value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="h-6 px-1 py-0 text-xs border-dashed [&>span]:truncate">
                      <SelectValue placeholder="Assign Community" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Community</SelectItem>
                      {communities.map(community => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedCommunityName ? (
                  <Badge variant="secondary">{selectedCommunityName}</Badge>
                ) : null } 
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">About</h3>
              {isEditing ? (
                <Textarea
                  placeholder="Full event description (optional)"
                  value={editedEvent.description || ''}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="text-sm text-muted-foreground min-h-[120px]"
                />
              ) : selectedEvent.description ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedEvent.description}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )} 
            </div>

            {!isEditing && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Attendees</h3>
                <EventAttendees eventId={selectedEvent.id} />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select an event to view details
          </div>
        )}
      </div>

      <CreateEventModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onEventCreated={() => reloadEvents(false)}
      />
    </div>
  );
} 