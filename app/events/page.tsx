'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import { CalendarIcon, MapPin, Users, Globe, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { PeopleSelect } from "@/components/PeopleSelect";
import { supabase, type Event, type Community, type Person } from '@/lib/supabase';
import { toast } from 'sonner';
import Script from 'next/script';

type EventWithCommunity = Event & {
  community?: {
    name: string;
  };
};

declare global {
  interface Window {
    google: any;
    initPlacesAutocomplete: () => void;
  }
}

export default function EventsPage() {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('none');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithCommunity[]>([]);
  const [communities, setCommunities] = useState<Pick<Community, 'id' | 'name'>[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [autocomplete, setAutocomplete] = useState<typeof google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    window.initPlacesAutocomplete = () => {
      if (!document.getElementById('location-input')) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(
        document.getElementById('location-input') as HTMLInputElement,
        {
          types: ['establishment', 'geocode'],
          fields: [
            'formatted_address',
            'name',
            'geometry',
            'place_id',
            'types',
            'url'
          ]
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          const locationName = place.name && place.name !== place.formatted_address
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address;
          setLocation(locationName);
        }
      });

      setAutocomplete(autocomplete);
    };
  }, []);

  // Fetch events, communities, and people
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            community:communities(name)
          `)
          .order('start_time', { ascending: true });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // Fetch communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name');

        if (communitiesError) throw communitiesError;
        setCommunities(communitiesData || []);

        // Fetch people
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .order('name');

        if (peopleError) throw peopleError;
        setPeople(peopleData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!date || !time || !name) {
      toast.error('Please fill in all required fields');
      return;
    }

    const eventDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes));

    // Calculate end time (default to 1 hour after start)
    const endDateTime = new Date(eventDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    // Determine if event is in the past by comparing with start of today
    const isPastEvent = isBefore(eventDateTime, startOfDay(new Date()));

    const eventData = {
      summary: name,
      description,
      location,
      start_time: eventDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_past_event: isPastEvent,
      community_id: selectedCommunity === 'none' ? null : selectedCommunity,
      status: 'confirmed',
      visibility: 'default',
      all_day: false,
      guest_can_invite_others: true,
      guest_can_modify: false,
      guest_can_see_other_guests: true,
    };

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      // Add attendees
      if (selectedPeople.length > 0) {
        const attendeesData = selectedPeople.map(person => ({
          event_id: data.id,
          person_id: person.id,
          response_status: 'needsAction'
        }));

        const { error: attendeesError } = await supabase
          .from('event_attendees')
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
      }

      toast.success('Event created successfully!');
      setIsOpen(false);
      
      // Reset form
      setDate(undefined);
      setTime('');
      setName('');
      setLocation('');
      setDescription('');
      setSelectedPeople([]);
      setSelectedCommunity('none');

      // Refresh events list
      const { data: newEvents } = await supabase
        .from('events')
        .select('*, community:communities(name)')
        .order('start_time', { ascending: true });
      
      setEvents(newEvents || []);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  // Group events by date and status (upcoming/past)
  const groupedEvents = events.reduce((acc, event) => {
    const startDate = parseISO(event.start_time);
    const isUpcoming = isAfter(startDate, startOfDay(new Date())) || isToday(startDate);
    const key = isUpcoming ? 'upcoming' : 'past';
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(event);
    return acc;
  }, {} as Record<'upcoming' | 'past', EventWithCommunity[]>);

  return (
    <div className="p-8">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initPlacesAutocomplete`}
        strategy="lazyOnload"
      />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Events</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create New Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter event name"
                />
              </div>

              {/* Community Selection */}
              <div className="space-y-2">
                <Label htmlFor="community">Community (Optional)</Label>
                <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Search for a location"
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Start typing to see location suggestions
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter event description"
                  className="min-h-[100px]"
                />
              </div>

              {/* People */}
              <div className="space-y-2">
                <Label>Add People</Label>
                <PeopleSelect
                  selectedPeople={selectedPeople}
                  onSelect={setSelectedPeople}
                  people={people}
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSubmit}
              >
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : events.length === 0 ? (
        <Card className="bg-muted">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No events found. Create your first event to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {groupedEvents.upcoming && groupedEvents.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="grid gap-4">
                {groupedEvents.upcoming.map((event) => (
                  <Card key={event.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.summary}</CardTitle>
                          <CardDescription>
                            {format(parseISO(event.start_time), "PPP 'at' p")}
                          </CardDescription>
                        </div>
                        {event.community && (
                          <div className="text-sm text-muted-foreground">
                            {(event.community as any).name}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.conference_data && Object.keys(event.conference_data).length > 0 && (
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-1" />
                            Video Call
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {groupedEvents.past && groupedEvents.past.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Events</h2>
              <div className="grid gap-4">
                {groupedEvents.past.map((event) => (
                  <Card key={event.id} className="hover:bg-muted/50 transition-colors opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.summary}</CardTitle>
                          <CardDescription>
                            {format(parseISO(event.start_time), "PPP 'at' p")}
                          </CardDescription>
                        </div>
                        {event.community && (
                          <div className="text-sm text-muted-foreground">
                            {(event.community as any).name}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.conference_data && Object.keys(event.conference_data).length > 0 && (
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-1" />
                            Video Call
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 