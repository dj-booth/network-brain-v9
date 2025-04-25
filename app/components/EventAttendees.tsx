'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { PlusIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { PeopleSelector, ResponseStatus } from './PeopleSelector';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface EventAttendeesProps {
  eventId: string;
}

interface Attendee {
  id: string;
  name: string;
  image_url?: string;
  title?: string;
  company?: string;
  response_status: ResponseStatus;
}

interface SupabaseAttendee {
  person: {
    id: string;
    name: string;
    image_url?: string;
    title?: string;
    company?: string;
  };
  response_status: ResponseStatus;
}

export function EventAttendees({ eventId }: EventAttendeesProps) {
  console.log('EventAttendees received eventId:', eventId);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          person:person_id (
            id,
            name,
            image_url,
            title,
            company
          ),
          response_status
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      // Transform the data to match our Attendee interface
      const transformedAttendees = ((data as unknown) as SupabaseAttendee[])?.map(item => ({
        ...item.person,
        response_status: item.response_status
      })) || [];

      setAttendees(transformedAttendees);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Failed to load event attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendee = async (personId: string, status: ResponseStatus) => {
    try {
      console.log('Adding attendee:', { eventId, personId, status });
      
      const { data, error } = await supabase
        .from('event_attendees')
        .insert([{ 
          event_id: eventId,
          person_id: personId,
          response_status: status
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // Handle unique constraint violation
        if (error.code === '23505') {
          toast.error("This person is already an attendee of this event");
          return;
        }
        
        throw error;
      }

      console.log('Successfully added attendee:', data);
      toast.success("Added attendee successfully");
      await fetchAttendees(); // Refresh the list
    } catch (err) {
      const error = err as Error;
      console.error('Error adding attendee:', {
        message: error.message,
        name: error.name
      });
      toast.error("Failed to add attendee");
    }
  };

  const handleUpdateStatus = async (personId: string, newStatus: ResponseStatus) => {
    try {
      setUpdatingStatus(personId);
      
      const { error } = await supabase
        .from('event_attendees')
        .update({ response_status: newStatus })
        .eq('event_id', eventId)
        .eq('person_id', personId);

      if (error) throw error;

      toast.success("Updated status successfully");
      fetchAttendees(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: ResponseStatus): string => {
    switch (status) {
      case 'consider_for_invite':
        return 'bg-gray-500';
      case 'to_invite':
        return 'bg-blue-500';
      case 'invited':
        return 'bg-yellow-500';
      case 'attending':
        return 'bg-green-500';
      case 'rsvp_accepted':
        return 'bg-emerald-500';
      case 'rsvp_maybe':
        return 'bg-orange-500';
      case 'rsvp_declined':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatStatus = (status: ResponseStatus): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return <div>Loading attendees...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Attendees ({attendees.length})</h3>
        <Button onClick={() => setShowPeopleSelector(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Attendee
        </Button>
      </div>

      <div className="space-y-4">
        {attendees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendees yet. Add some attendees to get started!
          </div>
        ) : (
          attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={attendee.image_url} alt={attendee.name} />
                <AvatarFallback>
                  {attendee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium truncate">{attendee.name}</p>
                  <Select
                    value={attendee.response_status}
                    onValueChange={(value) => handleUpdateStatus(attendee.id, value as ResponseStatus)}
                    disabled={updatingStatus === attendee.id}
                  >
                    <SelectTrigger className="h-7 w-[180px]">
                      <SelectValue>
                        <Badge variant="secondary" className={getStatusColor(attendee.response_status)}>
                          {formatStatus(attendee.response_status)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consider_for_invite">Consider for Invite</SelectItem>
                      <SelectItem value="to_invite">To Invite</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="attending">Attending</SelectItem>
                      <SelectItem value="rsvp_accepted">RSVP Accepted</SelectItem>
                      <SelectItem value="rsvp_maybe">RSVP Maybe</SelectItem>
                      <SelectItem value="rsvp_declined">RSVP Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(attendee.title || attendee.company) && (
                  <p className="text-sm text-muted-foreground truncate">
                    {[attendee.title, attendee.company].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <PeopleSelector
        open={showPeopleSelector}
        onOpenChange={setShowPeopleSelector}
        onSelect={handleAddAttendee}
        eventId={eventId}
      />
    </div>
  );
} 