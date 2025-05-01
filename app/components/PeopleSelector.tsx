import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Community {
  id: string;
  name: string;
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
  onSelect: (personIds: string[], status: ResponseStatus) => void;
  eventId: string;
  communityId?: string | null;
}

export function PeopleSelector({ open, onOpenChange, onSelect, eventId, communityId }: PeopleSelectorProps) {
  console.log('PeopleSelector received eventId:', eventId, 'communityId:', communityId);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus>('consider_for_invite');
  const [searchScope, setSearchScope] = useState<'all' | 'community'>('all');
  const [communityName, setCommunityName] = useState<string>('');

  useEffect(() => {
    async function loadCommunityName() {
      if (!communityId) return;
      
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('name')
          .eq('id', communityId)
          .single();

        if (error) throw error;
        if (data) {
          setCommunityName(data.name);
        }
      } catch (error) {
        console.error('Error loading community name:', error);
      }
    }

    if (communityId) {
      loadCommunityName();
    }
  }, [communityId]);

  useEffect(() => {
    async function loadPeople() {
      console.log('PeopleSelector loadPeople using eventId:', eventId);
      setLoading(true);
      try {
        let query = supabase
          .from('people')
          .select('*, community_members(community_id)')
          .is('deleted', false);

        if (eventId) {
          const { data: existingAttendees } = await supabase
            .from('event_attendees')
            .select('person_id')
            .eq('event_id', eventId);
          
          const existingAttendeeIds = existingAttendees?.map(row => row.person_id) || [];
          if (existingAttendeeIds.length > 0) {
            query = query.not('id', 'in', existingAttendeeIds);
          }
        }

        if (searchScope === 'community' && communityId) {
          query = query.eq('community_members.community_id', communityId);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        console.log('People query results:', data);
        setPeople(data || []);
      } catch (error) {
        console.error('Error loading people:', error);
        toast.error('Failed to load people');
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadPeople();
      setSelectedPeopleIds(new Set());
      setSelectedStatus('consider_for_invite');
    }
  }, [open, eventId, searchScope, communityId]);

  const handlePersonToggle = (personId: string) => {
    setSelectedPeopleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  const handleSelect = () => {
    const selectedIdsArray = Array.from(selectedPeopleIds);
    if (selectedIdsArray.length > 0) {
      try {
        console.log('Selecting people with details:', {
          personIds: selectedIdsArray,
          status: selectedStatus,
          eventId
        });

        onSelect(selectedIdsArray, selectedStatus);
        onOpenChange(false);
      } catch (error) {
        console.error('Error in handleSelect:', error);
        toast.error('Failed to select people');
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
          {communityId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Scope</label>
              <Select
                value={searchScope}
                onValueChange={(value: 'all' | 'community') => setSearchScope(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Search All People</SelectItem>
                  <SelectItem value="community">Search {communityName} Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <Command className="rounded-lg border shadow-md h-full">
              <CommandInput placeholder="Search people..." />
              <CommandEmpty>
                {searchScope === 'community' 
                  ? 'No community members found or all members are already attendees.'
                  : 'No people found.'}
              </CommandEmpty>
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandGroup>
                  {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading people...</div>
                  ) : (
                    people.map((person) => (
                      <CommandItem
                        key={person.id}
                        value={person.name}
                        onSelect={(currentValue) => {
                          console.log("CommandItem selected (ignored):", currentValue);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full" onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handlePersonToggle(person.id);
                        }}>
                          <Checkbox
                            checked={selectedPeopleIds.has(person.id)}
                            onCheckedChange={() => handlePersonToggle(person.id)}
                            aria-label={`Select ${person.name}`}
                            className="mr-2"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          />
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
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Response Status (for all selected)</label>
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

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSelect}
              disabled={selectedPeopleIds.size === 0}
            >
              Add {selectedPeopleIds.size > 0 ? selectedPeopleIds.size : ''} Attendee{selectedPeopleIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 