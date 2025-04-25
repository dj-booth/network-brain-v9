'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Contact } from '@/lib/types';

interface AddContextDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteAdded?: () => void;
}

export function AddContextDialog({ contact, open, onOpenChange, onNoteAdded }: AddContextDialogProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('notes')
        .insert({
          person_id: contact.id,
          content: noteContent.trim(),
          type: 'text',
        });

      if (error) throw error;

      toast.success('Note added', {
        description: `Successfully added note for ${contact.name}`,
      });

      // Reset form and close dialog
      setNoteContent('');
      onOpenChange(false);
      
      // Call the callback to refresh timeline
      onNoteAdded?.();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error saving note', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Context</DialogTitle>
          <DialogDescription>
            Add a note or context about your interactions with {contact.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={`Write your note about ${contact.name} here...`}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!noteContent.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 