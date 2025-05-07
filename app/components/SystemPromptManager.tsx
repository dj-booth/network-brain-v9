'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircleIcon, CheckIcon, XIcon, PencilIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { v4 as uuidv4 } from 'uuid';
// Temporary module declaration for slugify if types are missing
// @ts-ignore
// eslint-disable-next-line
declare module 'slugify';
import slugify from 'slugify';

interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  description: string;
}

export function SystemPromptManager() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<Partial<SystemPrompt>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Partial<SystemPrompt>>({
    name: '',
    content: '',
    description: ''
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPrompts((data || []).filter((p: any) => !p.deleted));
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to load system prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (prompt: Partial<SystemPrompt>) => {
    try {
      if (!prompt.name || !prompt.content || !prompt.description) {
        toast.error('Name, content, and description are required');
        return;
      }
      const { error } = await supabase
        .from('system_prompts')
        .update({
          name: prompt.name,
          content: prompt.content,
          description: prompt.description
        })
        .eq('id', isEditing);
      if (error) throw error;
      toast.success('System prompt updated successfully');
      setIsEditing(null);
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save system prompt');
    }
  };

  const handleCreate = async () => {
    try {
      if (!newPrompt.name || !newPrompt.content || !newPrompt.description) {
        toast.error('Name, content, and description are required');
        return;
      }
      let key = slugify(newPrompt.name || '', { lower: true, strict: true });
      if (!key) key = uuidv4();
      const { data, error } = await supabase
        .from('system_prompts')
        .insert([{ ...newPrompt, key, deleted: false, is_active: true }])
        .select()
        .single();
      if (error) throw error;
      toast.success('System prompt created successfully');
      setIsCreating(false);
      setNewPrompt({ name: '', content: '', description: '' });
      fetchPrompts();
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast.error('Failed to create system prompt');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('system_prompts')
        .update({ deleted: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('Prompt deleted');
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-2xl font-bold">System Prompts</div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add New Prompt
        </Button>
      </div>

      {isCreating && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/10 mb-4">
          <Input
            placeholder="Prompt Name"
            value={newPrompt.name}
            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
          />
          <Textarea
            placeholder="Description"
            value={newPrompt.description}
            onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
            className="min-h-[100px]"
          />
          <Textarea
            placeholder="Prompt Content"
            value={newPrompt.content}
            onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      )}

      <Accordion type="multiple" className="w-full">
        {prompts.map((prompt) => (
          <AccordionItem value={prompt.id} key={prompt.id} className="border-b">
            <AccordionTrigger className="text-lg font-medium py-4">
              {prompt.name}
            </AccordionTrigger>
            <AccordionContent>
              {isEditing === prompt.id ? (
                <>
                  <Input
                    value={editedPrompt.name}
                    onChange={(e) => setEditedPrompt({ ...editedPrompt, name: e.target.value })}
                    className="font-medium text-lg mb-2"
                  />
                  <Textarea
                    value={editedPrompt.description}
                    onChange={(e) => setEditedPrompt({ ...editedPrompt, description: e.target.value })}
                    className="min-h-[100px] mb-2"
                  />
                  <Textarea
                    value={editedPrompt.content}
                    onChange={(e) => setEditedPrompt({ ...editedPrompt, content: e.target.value })}
                    className="min-h-[200px] mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(null);
                        setEditedPrompt({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleSave(editedPrompt)}>
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Last updated: {new Date(prompt.updated_at).toLocaleDateString()}
                  </div>
                  <div className="mb-2 text-sm font-medium">{prompt.description}</div>
                  <pre className="whitespace-pre-wrap text-sm bg-muted/10 p-4 rounded mb-2">
                    {prompt.content}
                  </pre>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(prompt.id);
                        setEditedPrompt(prompt);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <XIcon className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 