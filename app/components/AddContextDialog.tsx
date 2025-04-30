'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Contact } from '@/lib/types';
import { AudioRecorder } from '@/app/components/AudioRecorder';

interface AddContextDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteAdded?: () => void;
}

export function AddContextDialog({ contact, open, onOpenChange, onNoteAdded }: AddContextDialogProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [noteType, setNoteType] = useState<'text' | 'voice'>('text');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNoteContent('');
      setNoteType('text');
    }
  }, [open]);

  const handleTranscriptionComplete = (transcribedText: string) => {
    setNoteContent(transcribedText);
    setNoteType('voice');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      setIsLoading(true);

      // Log the data we're trying to insert
      console.log('Attempting to save note with data:', {
        person_id: contact.id,
        content: noteContent.trim(),
        type: noteType,
      });

      const { data, error } = await supabase
        .from('notes')
        .insert({
          person_id: contact.id,
          content: noteContent.trim(),
          type: noteType,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Note saved successfully:', data);

      // Reset form and close dialog
      setNoteContent('');
      setNoteType('text');
      onOpenChange(false);
      
      // Call the callback to refresh timeline
      onNoteAdded?.();

      toast.success('Note added', {
        description: `Successfully added note for ${contact.name}`,
      });
    } catch (error: unknown) {
      console.error('Full error object:', error);
      let message = 'Please try again.';
      let details, hint, code;
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message?: string }).message || message;
        details = (error as { details?: string }).details;
        hint = (error as { hint?: string }).hint;
        code = (error as { code?: string }).code;
      }
      console.error('Error saving note:', {
        message,
        details,
        hint,
        code
      });
      toast.error('Error saving note', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && isLoading) return; // Prevent closing while saving
        onOpenChange(newOpen);
      }}
    >
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
            onChange={(e) => {
              setNoteContent(e.target.value);
              setNoteType('text');
            }}
            className="min-h-[100px]"
            disabled={isLoading}
          />
          <div className="flex justify-end items-center gap-3">
            <AudioRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
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