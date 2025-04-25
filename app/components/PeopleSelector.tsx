import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface Person {
  id: string;
  name: string;
  image_url?: string;
  title?: string;
  company?: string;
}

export type ResponseStatus = 
  | 'consider_for_invite'
  | 'to_invite'
  | 'invited'
  | 'attending'
  | 'rsvp_accepted'
  | 'rsvp_maybe'
  | 'rsvp_declined';

interface PeopleSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (personId: string, status: ResponseStatus) => void;
  eventId: string;
}

export function PeopleSelector({ open, onOpenChange, onSelect, eventId }: PeopleSelectorProps) {
  console.log('PeopleSelector received eventId:', eventId);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus>('consider_for_invite');

  useEffect(() => {
    async function loadPeople() {
      console.log('PeopleSelector loadPeople using eventId:', eventId);
      try {
        console.log('Loading people...');
        
        // Get existing attendees to exclude
        const { data: existingAttendees, error: attendeesError } = await supabase
          .from('event_attendees')
          .select('person_id')
          .eq('event_id', eventId);

        if (attendeesError) throw attendeesError;

        const existingIds = existingAttendees?.map(a => a.person_id) || [];

        // Get all people except those already attending
        const query = supabase
          .from('people')
          .select('id, name, image_url, title, company')
          .order('name');

        // Only add the not-in condition if there are existing attendees
        if (existingIds.length > 0) {
          query.not('id', 'in', `(${existingIds.join(',')})`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Supabase error loading people:', error);
          throw error;
        }
        
        console.log('Loaded people:', data);
        setPeople(data || []);
      } catch (error) {
        console.error('Error loading people:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadPeople();
    }
  }, [open, eventId]);

  const handleSelect = () => {
    if (selectedPerson) {
      try {
        console.log('Selecting person with details:', {
          person: selectedPerson,
          status: selectedStatus,
          eventId
        });
        
        onSelect(selectedPerson.id, selectedStatus);
        onOpenChange(false);
        setSelectedPerson(null);
        setSelectedStatus('consider_for_invite');
      } catch (error) {
        console.error('Error in handleSelect:', error);
        toast.error('Failed to select person');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Attendee</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <Command className="rounded-lg border shadow-md h-full">
              <CommandInput placeholder="Search people..." />
              <CommandEmpty>No people found.</CommandEmpty>
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandGroup>
                  {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading people...</div>
                  ) : (
                    people.map((person) => (
                      <CommandItem
                        key={person.id}
                        value={person.name}
                        onSelect={() => setSelectedPerson(person)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={person.image_url} alt={person.name} />
                            <AvatarFallback>
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{person.name}</p>
                            {(person.title || person.company) && (
                              <p className="text-sm text-muted-foreground truncate">
                                {[person.title, person.company].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                          {selectedPerson?.id === person.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {selectedPerson && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Status</label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ResponseStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
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
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSelect}
              disabled={!selectedPerson}
            >
              Add Attendee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 