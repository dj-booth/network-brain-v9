import { Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PencilIcon, CheckIcon, PlusCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CommunitySelector } from './CommunitySelector';
import { Timeline } from './Timeline';
import { toast } from 'sonner';
import { AddContextDialog } from './AddContextDialog';

interface ProfileDetailProps {
  contact: Contact;
}

export function ProfileDetail({ contact }: ProfileDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [showAddContext, setShowAddContext] = useState(false);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update the person record
      const { error: personError } = await supabase
        .from('people')
        .update({
          detailed_summary: editedContact.detailedSummary,
          intros_sought: editedContact.introsSought,
          reasons_to_introduce: editedContact.reasonsToIntroduce
        })
        .eq('id', contact.id);

      if (personError) throw personError;

      setIsEditing(false);
      toast.success("Changes saved", {
        description: "Profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error("Error saving changes", {
        description: "Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCommunity = async (communityId: string) => {
    try {
      console.log('Adding to community:', { communityId, personId: contact.id });
      
      // First verify the community exists
      const { data: communityCheck, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('id', communityId)
        .single();

      if (communityError) {
        console.error('Error verifying community:', communityError);
        throw new Error('Failed to verify community');
      }

      if (!communityCheck) {
        throw new Error('Community not found');
      }

      // Check if already a member
      const { data: existingMembers, error: checkError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('person_id', contact.id);

      if (checkError) {
        console.error('Error checking membership:', checkError);
        throw new Error('Failed to check existing membership');
      }

      if (existingMembers && existingMembers.length > 0) {
        console.log('Already a member:', existingMembers[0]);
        toast.info("Already a member", {
          description: "This person is already a member of this community."
        });
        return;
      }

      console.log('Attempting to insert community member with:', {
        community_id: communityId,
        person_id: contact.id
      });

      // Add to community
      const { data, error } = await supabase
        .from('community_members')
        .insert([{ 
          community_id: communityId,
          person_id: contact.id 
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Successfully added member:', data);
      
      toast.success("Added to community", {
        description: "Successfully added to the community."
      });
    } catch (error) {
      console.error('Full error details:', error);
      toast.error("Error adding to community", {
        description: error instanceof Error ? error.message : "Database error occurred. Please try again."
      });
    }
  };

  const handleAddToEvent = async () => {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .insert([{ person_id: contact.id }]);
      
      if (error) throw error;
      toast.success("Added to event", {
        description: "Successfully added to the event."
      });
    } catch (error) {
      console.error('Error adding to event:', error);
      toast.error("Error adding to event", {
        description: "Please try again."
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{contact.name}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
        >
          {isEditing ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <PencilIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Profile Header */}
        <div className="flex items-start space-x-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <Image
              src={contact.imageUrl}
              alt={contact.name}
              width={96}
              height={96}
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold truncate">{contact.name}</h1>
            </div>
            {contact.title && (
              <p className="text-muted-foreground mt-1">{contact.title}</p>
            )}
            {contact.company && (
              <p className="text-muted-foreground">{contact.company}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCommunitySelector(true)}
              >
                Add to Community
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddToEvent()}
              >
                Add to Event
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddContext(true)}
              >
                Add Context
              </Button>
            </div>
          </div>
        </div>

        {/* Community Selector Dialog */}
        <CommunitySelector
          open={showCommunitySelector}
          onOpenChange={setShowCommunitySelector}
          onSelect={handleAddToCommunity}
        />

        <AddContextDialog
          contact={contact}
          open={showAddContext}
          onOpenChange={setShowAddContext}
          onNoteAdded={() => setTimelineRefreshTrigger(prev => prev + 1)}
        />

        {/* Detailed Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-3">About</h3>
          {isEditing ? (
            <Textarea
              value={editedContact.detailedSummary}
              onChange={(e) => setEditedContact({
                ...editedContact,
                detailedSummary: e.target.value
              })}
              className="min-h-[100px]"
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {contact.detailedSummary}
            </p>
          )}
        </div>

        {/* Intros Sought */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Looking to Connect With</h3>
          {isEditing ? (
            <Textarea
              value={editedContact.introsSought || ''}
              onChange={(e) => setEditedContact({
                ...editedContact,
                introsSought: e.target.value
              })}
              className="min-h-[100px] w-full"
              placeholder="Describe the types of people you're looking to connect with..."
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {contact.introsSought || 'No connection preferences specified'}
            </p>
          )}
        </div>

        {/* Reasons to Introduce */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Ways {contact.name.split(' ')[0]} Can Help</h3>
          {isEditing ? (
            <Textarea
              value={editedContact.reasonsToIntroduce || ''}
              onChange={(e) => setEditedContact({
                ...editedContact,
                reasonsToIntroduce: e.target.value
              })}
              className="min-h-[100px] w-full"
              placeholder="Describe how you can help others..."
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {contact.reasonsToIntroduce || 'No ways to help specified'}
            </p>
          )}
        </div>

        {/* Timeline Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <Timeline personId={contact.id} refreshTrigger={timelineRefreshTrigger} />
        </div>
      </div>
    </div>
  );
} 