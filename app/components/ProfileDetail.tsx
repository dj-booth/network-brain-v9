import { Contact, ProfileFields } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PencilIcon, CheckIcon, PlusCircleIcon, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommunitySelector } from './CommunitySelector';
import { Timeline } from './Timeline';
import { toast } from 'sonner';
import { AddContextDialog } from './AddContextDialog';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface ProfileDetailProps {
  contact: Contact;
}

// Define a simple type for the community info we need
interface CommunityMembershipInfo {
  id: string;
  name: string;
}

// Helper function to check if a field has content
const hasContent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export function ProfileDetail({ contact }: ProfileDetailProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<ProfileFields> & Pick<ProfileFields, 'id' | 'name' | 'imageUrl'>>({
    ...contact,
    skills: contact.skills || [],
    interests: contact.interests || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [showAddContext, setShowAddContext] = useState(false);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);
  const [communityMemberships, setCommunityMemberships] = useState<CommunityMembershipInfo[]>([]);

  // Fetch community memberships when contact changes
  useEffect(() => {
    const fetchCommunityMemberships = async () => {
      if (!contact.id) return;

      try {
        const { data, error } = await supabase
          .from('community_members')
          .select(`
            community:communities (
              id,
              name
            )
          `)
          .eq('person_id', contact.id)
          // Optionally filter by status if needed, e.g., only show 'approved'?
          // .eq('membership_status', 'approved') 

        if (error) throw error;

        // Transform data to get community names
        const memberships = data
          ?.map(item => (item as any).community)
          .filter(community => community !== null) as CommunityMembershipInfo[] || [];
        
        setCommunityMemberships(memberships);

      } catch (error) {
        console.error('Error fetching community memberships:', error);
        // Optional: Show toast error
        // toast.error("Failed to load community memberships");
      }
    };

    fetchCommunityMemberships();
  }, [contact.id]);

  const refreshTimeline = () => {
    setTimelineRefreshTrigger(prev => prev + 1);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Create an object with only the fields that have content
      const updateData = Object.entries(editedContact).reduce((acc, [key, value]) => {
        if (key !== 'id' && hasContent(value)) {
          // Convert snake_case for database
          const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          acc[dbKey] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Update the person record
      const { error: personError } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', contact.id);

      if (personError) throw personError;

      setIsEditing(false);
      refreshTimeline(); // Refresh timeline after save
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
          person_id: contact.id,
          membership_status: 'prospect'
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
      
      refreshTimeline(); // Refresh timeline after adding to community
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Check if we have a valid contact ID
      if (!contact.id) {
        throw new Error('Invalid contact ID');
      }

      console.log('Starting profile generation for:', {
        contactId: contact.id,
        name: contact.name
      });

      const response = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: contact.id })
      });

      const data = await response.json();
      console.log('Profile generation response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        // Extract the error message from the response
        const errorMessage = data.error || `Server error (${response.status})`;
        console.error('Profile generation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.data) {
        console.error('Invalid response format:', data);
        throw new Error('No data returned from profile generation');
      }
      
      // Update the local state with the generated content
      setEditedContact(prev => ({
        ...prev,
        summary: data.data.summary,
        detailedSummary: data.data.detailed_summary,
        introsSought: data.data.intros_sought,
        reasonsToIntroduce: data.data.reasons_to_introduce
      }));

      // Save the changes immediately
      console.log('Saving generated profile to database');
      const { error: saveError } = await supabase
        .from('people')
        .update({
          summary: data.data.summary,
          detailed_summary: data.data.detailed_summary,
          intros_sought: data.data.intros_sought,
          reasons_to_introduce: data.data.reasons_to_introduce,
          last_generated_at: new Date().toISOString()
        })
        .eq('id', contact.id);

      if (saveError) {
        console.error('Error saving generated profile:', saveError);
        throw new Error('Generated profile but failed to save changes');
      }

      refreshTimeline(); // Refresh timeline after generation
      toast.success('Profile generated successfully', {
        description: 'AI has analyzed the timeline and updated the profile.'
      });
    } catch (error) {
      console.error('Error generating profile:', error);
      toast.error('Failed to generate profile', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Define the fields to display
  const profileFields: Array<{key: keyof ProfileFields; label: string; type: 'text' | 'textarea' | 'array'; showByDefault?: boolean}> = [
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'text' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'detailedSummary', label: 'About', type: 'textarea', showByDefault: true },
    { key: 'currentFocus', label: 'Current Focus', type: 'textarea' },
    { key: 'startupExperience', label: 'Startup Experience', type: 'textarea' },
    { key: 'lastStartupRole', label: 'Last Startup Role', type: 'text' },
    { key: 'preferredRole', label: 'Preferred Role', type: 'text' },
    { key: 'preferredCompanyStage', label: 'Preferred Company Stage', type: 'text' },
    { key: 'longTermGoal', label: 'Long Term Goal', type: 'textarea' },
    { key: 'skills', label: 'Skills', type: 'array' },
    { key: 'interests', label: 'Interests', type: 'array' },
    { key: 'introsSought', label: 'Looking to Connect With', type: 'textarea', showByDefault: true },
    { key: 'reasonsToIntroduce', label: `Ways to Help`, type: 'textarea', showByDefault: true },
    { key: 'referralSource', label: 'Referral Source', type: 'text' },
    { key: 'internalNotes', label: 'Internal Notes', type: 'textarea' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{contact.name}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
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
      </div>

      {/* Content */}
      <div className="p-6 flex justify-between items-start space-x-6">
        {/* Left Column: Profile Info & Details */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Profile Header */}
          <div className={`flex items-start space-x-6 p-4 rounded-lg ${isEditing ? 'bg-blue-50/50 border border-blue-200' : ''}`}>
            <div className="relative h-24 w-24 flex-shrink-0">
              <Image
                src={contact.imageUrl}
                alt={contact.name}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            </div>
            {/* Name, Title, Company, Tags */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate">{contact.name}</h1>
              {(!isEditing && contact.title) && (
                <p className="text-muted-foreground mt-1">{contact.title}</p>
              )}
              {(!isEditing && contact.company) && (
                <p className="text-muted-foreground">{contact.company}</p>
              )}
              {(!isEditing && contact.email) && (
                <p className="text-muted-foreground mt-1">{contact.email}</p>
              )}
              {(!isEditing && contact.linkedinUrl) && (
                <a 
                  href={contact.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 mt-1 block"
                >
                  LinkedIn Profile
                </a>
              )}
              {/* Community Membership Tags */}
              {communityMemberships.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {communityMemberships.map((community) => (
                    <Badge 
                      key={community.id} 
                      variant="outline" 
                      className="border bg-blue-100 text-blue-800"
                    >
                      {community.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          <div className={`rounded-lg p-6 space-y-6 relative border transition-colors duration-200 ${
            isEditing 
              ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
              : 'bg-gray-100/70 border-gray-200/80'
          }`}>
            {isEditing && (
              <div className="absolute top-0 right-0 m-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Editing Mode
              </div>
            )}
            {profileFields.map(({ key, label, type, showByDefault }) => {
              const value = editedContact[key];
              const showField = isEditing || (showByDefault && hasContent(value));
              
              if (!showField) return null;

              // Special rendering for introsSought and reasonsToIntroduce
              const isIntroField = key === 'introsSought' || key === 'reasonsToIntroduce';

              return (
                <div key={key} className={`${isEditing ? 'bg-white rounded-lg p-4 shadow-sm' : ''}`}>
                  <h3 className="text-lg font-semibold mb-3">{label}</h3>
                  {isEditing ? (
                    type === 'textarea' ? (
                      <Textarea
                        value={value as string || ''}
                        onChange={(e) => setEditedContact({
                          ...editedContact,
                          [key]: e.target.value
                        })}
                        className="min-h-[100px]"
                        placeholder={`Enter ${label.toLowerCase()}...`}
                      />
                    ) : type === 'text' ? (
                      <Input
                        value={value as string || ''}
                        onChange={(e) => setEditedContact({
                          ...editedContact,
                          [key]: e.target.value
                        })}
                        placeholder={`Enter ${label.toLowerCase()}...`}
                      />
                    ) : type === 'array' ? (
                      <div className="space-y-2">
                        <Input
                          value={(value as string[])?.join(', ') || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            [key]: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
                          })}
                          placeholder={`Enter ${label.toLowerCase()} separated by commas...`}
                        />
                        <p className="text-sm text-muted-foreground">
                          Separate multiple {label.toLowerCase()} with commas
                        </p>
                      </div>
                    ) : null
                  ) : (
                    isIntroField && Array.isArray(value) ? (
                      value.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {(value as any[]).map((item, idx) => (
                            <li key={idx}>
                              {item.title ? <span className="font-medium">{item.title}: </span> : null}
                              {item.description}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          No information specified
                        </p>
                      )
                    ) : type === 'array' ? (
                      <div className="flex flex-wrap gap-2">
                        {(value as string[])?.map((item, index) => (
                          <Badge key={index} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {value as string}
                      </p>
                    )
                  )}
                </div>
              );
            })}

            {/* Generate Button */}
            <div className="absolute bottom-4 right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Regenerate"}
              </Button>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Timeline</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTimeline}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Timeline 
              personId={contact.id} 
              refreshTrigger={timelineRefreshTrigger} 
            />
          </div>
        </div>

        {/* Right Column: Action Buttons */}
        <div className="flex flex-col gap-3 w-40">
          <Button
            variant="outline"
            onClick={() => setShowCommunitySelector(true)}
            size="sm"
          >
            Add to Community
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/introductions?personId=${contact.id}`)}
            size="sm"
          >
            Suggest Intros
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddToEvent()}
            size="sm"
          >
            Add to Event
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddContext(true)}
            size="sm"
          >
            Add Context
          </Button>
        </div>
      </div>

      {/* Dialogs */}
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
    </div>
  );
} 