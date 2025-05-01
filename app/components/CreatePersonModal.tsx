'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Person {
  id: string;
  name: string;
  email?: string;
  title?: string;
  company?: string;
  summary?: string;
  detailed_summary?: string;
  image_url?: string;
  last_contact?: string;
  intros_sought?: string;
  reasons_to_introduce?: string;
  deleted?: boolean;
}

interface CreatePersonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonCreated?: () => void;
}

export function CreatePersonModal({ open, onOpenChange, onPersonCreated }: CreatePersonModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    email: '',
    title: '',
    company: '',
    summary: '',
    detailed_summary: '',
    image_url: '/placeholder-avatar.svg',
    last_contact: new Date().toISOString().split('T')[0],
    intros_sought: '',
    reasons_to_introduce: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email already exists
      if (formData.email) {
        const { data: existingPerson, error: checkError } = await supabase
          .from('people')
          .select('id')
          .eq('email', formData.email)
          .is('deleted', false) // Only check non-deleted profiles
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw checkError;
        }

        if (existingPerson) {
          toast.error("Email already exists", {
            description: "A profile with this email address already exists."
          });
          return;
        }
      }

      // Create the person
      const { data, error } = await supabase
        .from('people')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Profile created", {
        description: "New profile has been created successfully."
      });

      onPersonCreated?.();
      onOpenChange(false);
      setFormData({
        name: '',
        email: '',
        title: '',
        company: '',
        summary: '',
        detailed_summary: '',
        image_url: '/placeholder-avatar.svg',
        last_contact: new Date().toISOString().split('T')[0],
        intros_sought: '',
        reasons_to_introduce: ''
      });
    } catch (error) {
      console.error('Error creating person:', error);
      toast.error("Error creating profile", {
        description: "Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Professional title"
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company or organization"
                />
              </div>

              <div>
                <Label htmlFor="image_url">Profile Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="URL to profile image"
                />
              </div>

              <div>
                <Label htmlFor="last_contact">Last Contact Date</Label>
                <Input
                  id="last_contact"
                  name="last_contact"
                  type="date"
                  value={formData.last_contact}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Summaries */}
            <div>
              <Label htmlFor="summary">Brief Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="A brief professional summary"
                className="h-20"
              />
            </div>

            <div>
              <Label htmlFor="detailed_summary">Detailed Summary</Label>
              <Textarea
                id="detailed_summary"
                name="detailed_summary"
                value={formData.detailed_summary}
                onChange={handleChange}
                placeholder="A more detailed professional background"
                className="h-32"
              />
            </div>

            {/* Networking Information */}
            <div>
              <Label htmlFor="intros_sought">Introductions Sought</Label>
              <Textarea
                id="intros_sought"
                name="intros_sought"
                value={formData.intros_sought}
                onChange={handleChange}
                placeholder="What kind of introductions is this person looking for?"
                className="h-32"
              />
            </div>

            <div>
              <Label htmlFor="reasons_to_introduce">Reasons to Introduce</Label>
              <Textarea
                id="reasons_to_introduce"
                name="reasons_to_introduce"
                value={formData.reasons_to_introduce}
                onChange={handleChange}
                placeholder="Why would someone want to be introduced to this person?"
                className="h-32"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Person"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 