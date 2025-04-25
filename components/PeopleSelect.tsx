'use client';

import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Person } from '@/lib/supabase';

interface PeopleSelectProps {
  selectedPeople: Person[];
  onSelect: (people: Person[]) => void;
  people: Person[];
}

export function PeopleSelect({ selectedPeople, onSelect, people }: PeopleSelectProps) {
  const [open, setOpen] = useState(false);

  const togglePerson = (person: Person) => {
    const isSelected = selectedPeople.some(p => p.id === person.id);
    if (isSelected) {
      onSelect(selectedPeople.filter(p => p.id !== person.id));
    } else {
      onSelect([...selectedPeople, person]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPeople.length === 0
            ? "Select people..."
            : `${selectedPeople.length} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandEmpty>No person found.</CommandEmpty>
          <CommandGroup>
            {people.map((person) => (
              <CommandItem
                key={person.id}
                onSelect={() => togglePerson(person)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPeople.some(p => p.id === person.id)
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{person.name}</span>
                  {(person.title || person.company) && (
                    <span className="text-sm text-muted-foreground">
                      {[person.title, person.company].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 