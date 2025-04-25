'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { PlusIcon, ChevronDown, ChevronRight } from 'lucide-react';
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

// Define the order of statuses
const statusOrder: ResponseStatus[] = [
  'attending',
  'rsvp_accepted',
  'invited',
  'to_invite',
  'consider_for_invite',
  'rsvp_maybe',
  'rsvp_declined'
];

export function EventAttendees({ eventId }: EventAttendeesProps) {
  console.log('EventAttendees received eventId:', eventId);
  const [groupedAttendees, setGroupedAttendees] = useState<Record<ResponseStatus, Attendee[]>>({} as Record<ResponseStatus, Attendee[]>);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<ResponseStatus, boolean>>({} as Record<ResponseStatus, boolean>);
  const [loading, setLoading] = useState(true);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [eventCommunityId, setEventCommunityId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEventDetails() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('community_id')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEventCommunityId(data.community_id);
      } catch (error) {
        console.error('Error loading event details:', error);
      }
    }

    loadEventDetails();
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

      // Group attendees by status
      const grouped = statusOrder.reduce((acc, status) => {
        acc[status] = [];
        return acc;
      }, {} as Record<ResponseStatus, Attendee[]>);

      transformedAttendees.forEach(attendee => {
        if (grouped[attendee.response_status]) {
          grouped[attendee.response_status].push(attendee);
        }
      });

      setGroupedAttendees(grouped);

      // Initialize collapse state (start expanded)
      const initialCollapseState = statusOrder.reduce((acc, status) => {
          acc[status] = false; // Initially expanded
          return acc;
      }, {} as Record<ResponseStatus, boolean>);
      setCollapsedGroups(initialCollapseState);

    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Failed to load event attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendee = async (personIds: string[], status: ResponseStatus) => {
    if (!personIds || personIds.length === 0) {
      toast.warning("No people selected to add.");
      return;
    }

    try {
      console.log('Adding attendees:', { eventId, personIds, status });

      const attendeesToAdd = personIds.map(personId => ({
        event_id: eventId,
        person_id: personId,
        response_status: status
      }));

      const { data, error } = await supabase
        .from('event_attendees')
        .insert(attendeesToAdd) // Insert multiple rows
        .select();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // Handle unique constraint violation (might happen if called concurrently, less likely now)
        // Also, Supabase bulk insert might error partially or fully. We should check the response.
        if (error.code === '23505') {
          toast.error("One or more selected people are already attendees of this event");
          // Optionally, filter out existing attendees and retry, or just refresh.
        } else {
          throw error; // Re-throw other errors
        }
      }

      if (data && data.length > 0) {
         console.log(`Successfully added ${data.length} attendee(s):`, data);
         toast.success(`Added ${data.length} attendee(s) successfully`);
      } else if (!error) {
         // If no error but no data, likely means all were duplicates (or an issue with SELECT returning:false)
         console.log('No new attendees added, possibly duplicates.');
         // Consider a different toast message if needed
      }

      await fetchAttendees(); // Refresh the list regardless
    } catch (err) {
      const error = err as Error;
      console.error('Error adding attendees:', {
        message: error.message,
        name: error.name
      });
      const count = personIds.length;
      toast.error(`Failed to add ${count > 1 ? count + ' attendees' : 'attendee'}`);
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

  const toggleGroupCollapse = (status: ResponseStatus) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  if (loading) {
    return <div>Loading attendees...</div>;
  }

  const totalAttendees = Object.values(groupedAttendees).reduce((sum, group) => sum + group.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Attendees ({totalAttendees})</h3>
        <Button onClick={() => setShowPeopleSelector(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Attendee
        </Button>
      </div>

      <div className="space-y-2"> 
        {totalAttendees === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendees yet. Add some attendees to get started!
          </div>
        ) : (
          statusOrder.map((status) => {
            const groupAttendees = groupedAttendees[status] || [];
            if (groupAttendees.length === 0) {
              return null; // Don't render empty groups
            }
            const isCollapsed = collapsedGroups[status];
            return (
              <div key={status} className="border rounded-md">
                <button 
                  onClick={() => toggleGroupCollapse(status)}
                  className="flex items-center justify-between w-full p-3 bg-muted hover:bg-muted/80 rounded-t-md"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className={`font-medium text-sm px-2 py-0.5 rounded ${getStatusColor(status)} text-white`}>{formatStatus(status)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Count: {groupAttendees.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0 border-t"> {/* Use space-y-0 to avoid double spacing if attendee rows have padding */}
                    {groupAttendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center space-x-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
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
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <PeopleSelector
        open={showPeopleSelector}
        onOpenChange={setShowPeopleSelector}
        onSelect={handleAddAttendee}
        eventId={eventId}
        communityId={eventCommunityId}
      />
    </div>
  );
} 