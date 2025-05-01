import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Define the valid response status values as a const enum
export type ResponseStatus = 
  | 'consider_for_invite'
  | 'to_invite'
  | 'invited'
  | 'attending'
  | 'rsvp_accepted'
  | 'rsvp_maybe'
  | 'rsvp_declined';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface EventSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (eventId: string, status: ResponseStatus) => void;
}

const RESPONSE_STATUS_OPTIONS: { value: ResponseStatus; label: string }[] = [
  { value: 'consider_for_invite', label: 'Consider for Invite' },
  { value: 'to_invite', label: 'To Invite' },
  { value: 'invited', label: 'Invited' },
  { value: 'attending', label: 'Attending' },
  { value: 'rsvp_accepted', label: 'RSVP Accepted' },
  { value: 'rsvp_maybe', label: 'Maybe' },
  { value: 'rsvp_declined', label: 'Declined' }
];

export function EventSelector({ open, onOpenChange, onSelect }: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus>('to_invite');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, event_date')
          .order('event_date', { ascending: false })
          .limit(50); // Limit to recent events

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchEvents();
      setSelectedEventId(''); // Reset selection when opening
      setSelectedStatus('to_invite'); // Reset to default status
    }
  }, [open]);

  const handleSubmit = () => {
    if (selectedEventId && selectedStatus) {
      onSelect(selectedEventId, selectedStatus);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Event</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Event</label>
            <Select
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({new Date(event.event_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Response Status</label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ResponseStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedEventId || loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add to Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 