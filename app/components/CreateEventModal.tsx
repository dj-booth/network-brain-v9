'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import eventTemplates, { EventTemplate } from '@/lib/event-templates';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { CreateEventTemplateModal } from './CreateEventTemplateModal';

interface Community {
  id: string;
  name: string;
}

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void; // Callback to refresh list
}

export function CreateEventModal({ open, onOpenChange, onEventCreated }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    async function loadCommunities() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setCommunities(data || []);
      } catch (error) {
        console.error('Error loading communities:', error);
        toast.error('Failed to load communities');
      }
    }

    if (open) {
      loadCommunities();
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setEventDate('');
      setLocation('');
      setSelectedCommunityId(null);
      setLoading(false);
    }
  }, [open]);

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "create-template") {
      setIsTemplateModalOpen(true);
      return;
    }

    if (templateId === "something-new") {
      let monthName = 'Month';
      if (eventDate) {
        try {
          const dateParts = eventDate.split('-');
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          const dateObj = new Date(Date.UTC(year, month, day));
          monthName = dateObj.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        } catch (e) {
          console.error("Error parsing date:", e);
          toast.warning("Couldn't determine month from selected date.");
        }
      }
      
      setTitle(`Something New ✨ || ${monthName} Dinner`);
      setDescription('');
      setStartTime('18:00');
      setEndTime('20:00');

    } else {
      const selectedTemplate = eventTemplates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setTitle(selectedTemplate.title);
        setDescription(selectedTemplate.description);
        setStartTime(selectedTemplate.startTime);
        setEndTime(selectedTemplate.endTime);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentTitle = title;
    const currentDescription = description;
    const currentStartTime = startTime;
    const currentEndTime = endTime;
    const currentEventDate = eventDate;
    const currentLocation = location;

    if (!currentTitle || !currentEventDate) {
        toast.error("Event Title and Date are required.");
        setLoading(false);
        return;
    }

    const startDateTime = currentStartTime ? `${currentEventDate}T${currentStartTime}:00Z` : `${currentEventDate}T00:00:00Z`;
    const endDateTime = currentEndTime ? `${currentEventDate}T${currentEndTime}:00Z` : startDateTime;

    const slug = currentTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      console.log('[TEMP] Creating event directly in Supabase:', {
        title: currentTitle,
        description: currentDescription,
        event_date: currentEventDate,
        start_time: startDateTime,
        end_time: endDateTime,
        location: currentLocation,
        slug,
        community_id: selectedCommunityId,
      });

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: currentTitle,
            description: currentDescription,
            event_date: currentEventDate,
            start_time: startDateTime,
            end_time: endDateTime,
            location: currentLocation,
            slug,
            attendee_count: 0,
            community_id: selectedCommunityId,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Event created successfully:', data);
      toast.success('Event created successfully!');
      onEventCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating event:', {
        error,
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(error && typeof error === 'object' && 'code' in error ? { code: error.code } : {}),
        ...(error && typeof error === 'object' && 'hint' in error ? { hint: error.hint } : {})
      });
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4" id="create-event-form">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date *</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <span className="text-sm text-muted-foreground pb-2">at</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 space-y-2">
               <Label htmlFor="template">Apply Template</Label>
               <Select onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="something-new">Something New...</SelectItem>
                    {eventTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create-template">Create New Template...</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Enter event location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              {/* TODO: Implement rich text editing for description */}
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of your event"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">Community</Label>
              <Select
                value={selectedCommunityId || undefined}
                onValueChange={(value) => setSelectedCommunityId(value === "none" ? null : value)}
              >
                <SelectTrigger id="community">
                  <SelectValue placeholder="Select community..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Community</SelectItem>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateEventTemplateModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onTemplateCreated={() => {
          // TODO: Refresh the templates list
          toast.success('Template created! It will appear in the list shortly.');
        }}
      />
    </>
  );
} 