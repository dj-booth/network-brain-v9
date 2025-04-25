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
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Community {
  id: string;
  name: string;
  description: string;
}

interface CommunitySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (communityId: string) => void;
}

export function CommunitySelector({ open, onOpenChange, onSelect }: CommunitySelectorProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunities() {
      try {
        console.log('Loading communities...');
        const { data, error } = await supabase
          .from('communities')
          .select('id, name, description');

        if (error) {
          console.error('Supabase error loading communities:', error);
          throw error;
        }
        
        console.log('Loaded communities:', data);
        setCommunities(data || []);
      } catch (error) {
        console.error('Error loading communities:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadCommunities();
    }
  }, [open]);

  const handleSelect = (community: Community) => {
    console.log('Selected community:', community);
    onSelect(community.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Community</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search communities..." />
          <CommandEmpty>No communities found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading communities...</div>
            ) : (
              communities.map((community) => (
                <CommandItem
                  key={community.id}
                  value={community.name}
                  onSelect={() => handleSelect(community)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{community.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {community.description}
                    </div>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 