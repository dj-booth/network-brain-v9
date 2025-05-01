'use client';

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
import { CommunityMembershipStatus } from '@/lib/types'; // Use Community status

interface Person {
  id: string;
  name: string;
  image_url?: string;
  title?: string;
  company?: string;
}

// Renamed Props interface
interface MemberSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (personIds: string[], status: CommunityMembershipStatus) => void; // Updated callback signature
  communityId: string; // Changed from eventId
}

// Renamed component
export function MemberSelector({ open, onOpenChange, onSelect, communityId }: MemberSelectorProps) {
  console.log('MemberSelector received communityId:', communityId);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<Set<string>>(new Set());
  // Default to 'prospect'
  const [selectedStatus, setSelectedStatus] = useState<CommunityMembershipStatus>('prospect'); 

  useEffect(() => {
    async function loadPeople() {
      console.log('MemberSelector loadPeople using communityId:', communityId);
      setLoading(true); // Ensure loading is true at start
      try {
        console.log('Loading people for community membership...');
        
        // Get existing members to exclude
        const { data: existingMembers, error: membersError } = await supabase
          .from('community_members') // Query community_members table
          .select('person_id')
          .eq('community_id', communityId); // Use communityId

        if (membersError) throw membersError;

        const existingIds = existingMembers?.map(m => m.person_id) || [];

        // Get people who aren't already members
        const { data, error } = await supabase
          .from('people')
          .select('*')
          .is('deleted', false) // Filter out deleted profiles
          .not('id', 'in', existingIds)
          .order('name');

        if (error) throw error;
        
        console.log('Loaded potential members:', data);
        setPeople(data || []);
      } catch (error) {
        console.error('Error loading people for community membership:', error);
        // Optionally show a toast error to the user
        toast.error("Failed to load people list.");
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadPeople();
      // Reset state when dialog opens
      setSelectedPeopleIds(new Set());
      setSelectedStatus('prospect');
    } else {
      // Clear people list when dialog closes to avoid stale data flashing
      setPeople([]); 
    }
  }, [open, communityId]);

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
        console.log('Adding members with details:', {
          personIds: selectedIdsArray,
          status: selectedStatus,
          communityId
        });

        onSelect(selectedIdsArray, selectedStatus);
        onOpenChange(false);
      } catch (error) {
        console.error('Error in handleSelect (MemberSelector):', error);
        toast.error('Failed to add selected members');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Increased max width slightly */}
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          {/* Updated Title */}
          <DialogTitle>Add Members to Community</DialogTitle>
        </DialogHeader>
        {/* Ensure content area takes available space */}
        <div className="flex-1 overflow-hidden flex flex-col gap-4 pt-4">
          {/* Ensure Command takes space and scrolls */}
          <div className="flex-1 min-h-0">
            <Command className="rounded-lg border shadow-md h-full">
              <CommandInput placeholder="Search people..." />
              <CommandList className="max-h-full">
                <CommandEmpty>No people found or all eligible people are already members.</CommandEmpty>
                <CommandGroup>
                  {loading ? (
                    <CommandItem disabled>Loading people...</CommandItem>
                  ) : (
                    people.map((person) => (
                      <CommandItem
                        key={person.id}
                        value={`${person.name} ${person.title || ''} ${person.company || ''}`}
                        onSelect={() => {
                          // We handle selection via onClick on the div
                        }}
                        className="cursor-pointer data-[disabled]:opacity-50"
                        // Prevent adding people while the main add operation is happening? (Optional)
                        // disabled={isAdding} 
                      >
                        <div 
                          className="flex items-center gap-3 w-full p-2" 
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation(); // Prevent Command default select
                            handlePersonToggle(person.id);
                          }}
                        >
                          <Checkbox
                            checked={selectedPeopleIds.has(person.id)}
                            // Use a functional update for onCheckedChange too for robustness
                            onCheckedChange={() => handlePersonToggle(person.id)}
                            aria-label={`Select ${person.name}`}
                            className="mr-2"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent double toggle
                          />
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={person.image_url} alt={person.name} />
                            <AvatarFallback>
                              {person.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{person.name}</p>
                            {(person.title || person.company) && (
                              <p className="text-xs text-muted-foreground truncate">
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

          {/* Status selection moved below the list, before the button */}
          <div className="space-y-2 pt-2">
            <label htmlFor="initial-status" className="text-sm font-medium">
              Initial Status (for all selected)
            </label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as CommunityMembershipStatus)}
            >
              <SelectTrigger id="initial-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Use statusOrder from CommunityMembers or define locally? For now, hardcode based on agreement */}
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="nominated">Nominated</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem> 
              </SelectContent>
            </Select>
          </div>

          {/* Action Button Area */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSelect}
              disabled={selectedPeopleIds.size === 0 || loading}
            >
              Add {selectedPeopleIds.size > 0 ? selectedPeopleIds.size : ''} Member{selectedPeopleIds.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 