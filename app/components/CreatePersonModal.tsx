'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface CreatePersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonCreated?: () => void;
}

export function CreatePersonModal({ open, onOpenChange, onPersonCreated }: CreatePersonModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [shouldEnrich, setShouldEnrich] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      // Create the person
      const { data: person, error: insertError } = await supabase
        .from('people')
        .insert({
          name: name.trim(),
          title: title.trim() || null,
          company: company.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If enrichment is enabled, call the profile generation API
      if (shouldEnrich && person) {
        try {
          const enrichResponse = await fetch('/api/profile/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personId: person.id,
              systemPromptKey: 'enrich_profile',
            }),
          });
          if (!enrichResponse.ok) {
            console.error('Failed to enrich profile:', await enrichResponse.text());
          }
        } catch (enrichError) {
          console.error('Error enriching profile:', enrichError);
        }
      }

      toast({
        title: 'Profile created',
        description: 'New profile has been created successfully.'
      });
      onPersonCreated?.();
      onOpenChange(false);
      setName('');
      setTitle('');
      setCompany('');
      setLinkedinUrl('');
      setShouldEnrich(true);
    } catch (error) {
      console.error('Error creating person:', error);
      toast({
        title: 'Error creating profile',
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Name *</label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Professional title"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="company">Company</label>
            <Input
              id="company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company or organization"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="linkedin">LinkedIn URL</label>
            <Input
              id="linkedin"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              placeholder="LinkedIn profile URL"
              disabled={loading}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={shouldEnrich}
              onChange={e => setShouldEnrich(e.target.checked)}
              className="rounded border-gray-300"
              disabled={loading}
            />
            Enrich profile with OpenAI
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 