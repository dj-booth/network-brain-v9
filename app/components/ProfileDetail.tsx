import { Contact, ProfileFields } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PencilIcon, CheckIcon, PlusCircleIcon, RefreshCw, Trash2, Search } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CommunitySelector } from './CommunitySelector';
import { Timeline } from './Timeline';
import { toast } from 'sonner';
import { AddContextDialog } from './AddContextDialog';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import styles from './ProfileDetail.module.css';
import { EventSelector, ResponseStatus } from './EventSelector';

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
  const [isEnriching, setIsEnriching] = useState(false);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [showAddContext, setShowAddContext] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);
  const [communityMemberships, setCommunityMemberships] = useState<CommunityMembershipInfo[]>([]);
  const [showEventSelector, setShowEventSelector] = useState(false);

  // Update editedContact when contact changes
  useEffect(() => {
    setEditedContact({
      ...contact,
      skills: contact.skills || [],
      interests: contact.interests || [],
    });
    setIsEditing(false); // Reset editing state when switching profiles
    setTimelineRefreshTrigger(prev => prev + 1); // Refresh timeline for new contact
  }, [contact]);

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

  const handleAddToEvent = async (eventId: string, status: ResponseStatus) => {
    if (!contact.id || !eventId) {
      toast.error("Invalid request", {
        description: "Missing required information to add to event."
      });
      return;
    }

    try {
      console.log('Starting event attendance check with:', {
        eventId,
        personId: contact.id,
        status
      });

      // First verify the event exists
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error verifying event:', {
          error: eventError,
          eventId
        });
        throw new Error('Event not found or no longer exists');
      }

      console.log('Event verified:', eventData);

      // Direct insert approach - if it fails due to duplicate, we'll handle it
      const { data: insertData, error: insertError } = await supabase
        .from('event_attendees')
        .upsert(
          {
            event_id: eventId,
            person_id: contact.id,
            response_status: status
          },
          {
            onConflict: 'event_id,person_id',
            ignoreDuplicates: false
          }
        );

      if (insertError) {
        console.error('Error in event_attendees operation:', {
          error: insertError,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });

        // Handle specific error cases
        if (insertError.code === '23505') { // Unique violation
          throw new Error('Already added to this event');
        } else if (insertError.code === '23503') { // Foreign key violation
          throw new Error('Event or person not found');
        } else if (insertError.code === '23514') { // Check violation
          throw new Error('Invalid response status');
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }

      console.log('Successfully handled event attendance:', insertData);
      
      refreshTimeline();
      toast.success("Added to event", {
        description: "Successfully added to the event."
      });
    } catch (error) {
      console.error('Final error in handleAddToEvent:', error);
      toast.error("Error adding to event", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      // Get all timeline data for this person
      const { data: timelineData, error: timelineError } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('person_id', contact.id)
        .order('created_at', { ascending: false });

      if (timelineError) throw timelineError;

      const response = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personId: contact.id,
          timelineData: timelineData || [] // Include timeline data for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate profile');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate profile');
      }

      refreshTimeline();
      toast.success('Profile generated successfully', {
        description: 'AI has analyzed existing information and updated the profile.'
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

  const handleEnrich = async () => {
    try {
      setIsEnriching(true);
      const response = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personId: contact.id,
          systemPromptKey: 'enrich_profile'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to enrich profile');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to enrich profile');
      }

      refreshTimeline();
      toast.success('Profile enriched successfully', {
        description: 'AI has researched and added new information to the profile.'
      });
      router.refresh();
    } catch (error) {
      console.error('Error enriching profile:', error);
      toast.error('Failed to enrich profile', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('people')
        .update({ deleted: true })
        .eq('id', contact.id);

      if (error) throw error;

      toast.success("Profile deleted", {
        description: "The profile has been successfully deleted."
      });
      
      // Redirect to home page
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error("Error deleting profile", {
        description: "Please try again."
      });
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
    <div className={styles.profileContainer}>
      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Scrollable Content */}
        <div className={styles.scrollableContent}>
          {/* Profile Details Section */}
          <div className={styles.profileDetailsSection}>
            {/* Sticky Profile Summary */}
            <div className={styles.stickyProfileSummary}>
              <div className={styles.profileHeader}>
                <div className={styles.profileInfo}>
                  <div className={styles.profileImage}>
                    <Image
                      src={contact.imageUrl}
                      alt={contact.name}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                  {/* Name, Title, Company, Tags */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold truncate">
                      {isEditing ? (
                        <Input
                          value={editedContact.name || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            name: e.target.value
                          })}
                          placeholder="Name"
                          className="text-2xl font-bold"
                        />
                      ) : (
                        contact.name
                      )}
                    </h1>
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <Input
                          value={editedContact.title || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            title: e.target.value
                          })}
                          placeholder="Title"
                          className="text-muted-foreground"
                        />
                        <Input
                          value={editedContact.company || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            company: e.target.value
                          })}
                          placeholder="Company"
                          className="text-muted-foreground"
                        />
                        <Input
                          value={editedContact.email || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            email: e.target.value
                          })}
                          placeholder="Email"
                          className="text-muted-foreground"
                        />
                        <Input
                          value={editedContact.linkedinUrl || ''}
                          onChange={(e) => setEditedContact({
                            ...editedContact,
                            linkedinUrl: e.target.value
                          })}
                          placeholder="LinkedIn URL"
                          className="text-blue-600"
                        />
                      </div>
                    ) : (
                      <>
                        {contact.title && (
                          <p className="text-muted-foreground mt-1">{contact.title}</p>
                        )}
                        {contact.company && (
                          <p className="text-muted-foreground">{contact.company}</p>
                        )}
                        {/* Show LinkedIn logo below company name, far left, only in view mode */}
                        {contact.linkedinUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                            <a
                              href={contact.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <img
                                src="/linkedin.png"
                                alt="LinkedIn"
                                style={{ width: 28, height: 28, marginRight: 8 }}
                              />
                            </a>
                          </div>
                        )}
                        {contact.email && (
                          <p className="text-muted-foreground mt-1">{contact.email}</p>
                        )}
                      </>
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
                {/* Edit button moved to the right */}
                <div className="flex-shrink-0">
                  {isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSave} 
                      disabled={isSaving}
                    >
                      {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className={styles.profileFields}>
              {/* About Section */}
              <div className={styles.fieldGroup}>
                <h2 className={styles.sectionTitle}>About</h2>
                <div className={styles.fieldContent}>
                  {isEditing ? (
                    <Textarea
                      value={editedContact.detailedSummary || ''}
                      onChange={(e) => setEditedContact({
                        ...editedContact,
                        detailedSummary: e.target.value
                      })}
                      placeholder="Tell us about this person..."
                      className="min-h-[150px] w-full p-3"
                    />
                  ) : (
                    editedContact.detailedSummary
                      ? (
                          <div>
                            {editedContact.detailedSummary
                              .split(/\n{2,}|\r?\n/)
                              .filter(Boolean)
                              .map((para, idx) => (
                                <p key={idx} style={{ marginBottom: '1em' }}>{para}</p>
                              ))}
                          </div>
                        )
                      : 'No information provided'
                  )}
                </div>
              </div>

              {/* Looking to Connect With Section */}
              <div className={styles.fieldGroup}>
                <h2 className={styles.sectionTitle}>Looking to Connect With</h2>
                <div className={styles.fieldContent}>
                  {isEditing ? (
                    <div className="space-y-4">
                      {!editedContact.introsSought?.length && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Add details about who this person would like to connect with.
                        </div>
                      )}
                      {(editedContact.introsSought || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title || ''}
                              onChange={(e) => {
                                const newIntros = [...(editedContact.introsSought || [])];
                                newIntros[idx] = { ...newIntros[idx], title: e.target.value };
                                setEditedContact({
                                  ...editedContact,
                                  introsSought: newIntros
                                });
                              }}
                              placeholder="Connection type (e.g., 'Technical founders')"
                              className="font-medium"
                            />
                            <Textarea
                              value={item.description || ''}
                              onChange={(e) => {
                                const newIntros = [...(editedContact.introsSought || [])];
                                newIntros[idx] = { ...newIntros[idx], description: e.target.value };
                                setEditedContact({
                                  ...editedContact,
                                  introsSought: newIntros
                                });
                              }}
                              placeholder="Describe the type of connections they're looking for..."
                              className="min-h-[100px]"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newIntros = [...(editedContact.introsSought || [])];
                              newIntros.splice(idx, 1);
                              setEditedContact({
                                ...editedContact,
                                introsSought: newIntros
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedContact({
                            ...editedContact,
                            introsSought: [
                              ...(editedContact.introsSought || []),
                              { title: '', description: '' }
                            ]
                          });
                        }}
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-2" />
                        Add Connection Type
                      </Button>
                    </div>
                  ) : (
                    Array.isArray(editedContact.introsSought) && editedContact.introsSought.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {editedContact.introsSought.map((item: any, idx: number) => (
                          <li key={idx}>
                            {item.title && <span className="font-medium">{item.title}: </span>}
                            {item.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No specific connection preferences specified'
                    )
                  )}
                </div>
              </div>

              {/* Ways to Help Section */}
              <div className={styles.fieldGroup}>
                <h2 className={styles.sectionTitle}>Ways to Help</h2>
                <div className={styles.fieldContent}>
                  {isEditing ? (
                    <div className="space-y-4">
                      {!editedContact.reasonsToIntroduce?.length && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Add ways others can help or reasons to introduce this person.
                        </div>
                      )}
                      {(editedContact.reasonsToIntroduce || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title || ''}
                              onChange={(e) => {
                                const newReasons = [...(editedContact.reasonsToIntroduce || [])];
                                newReasons[idx] = { ...newReasons[idx], title: e.target.value };
                                setEditedContact({
                                  ...editedContact,
                                  reasonsToIntroduce: newReasons
                                });
                              }}
                              placeholder="Reason title (e.g., 'Expertise')"
                              className="font-medium"
                            />
                            <Textarea
                              value={item.description || ''}
                              onChange={(e) => {
                                const newReasons = [...(editedContact.reasonsToIntroduce || [])];
                                newReasons[idx] = { ...newReasons[idx], description: e.target.value };
                                setEditedContact({
                                  ...editedContact,
                                  reasonsToIntroduce: newReasons
                                });
                              }}
                              placeholder="Describe how they can help..."
                              className="min-h-[100px]"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newReasons = [...(editedContact.reasonsToIntroduce || [])];
                              newReasons.splice(idx, 1);
                              setEditedContact({
                                ...editedContact,
                                reasonsToIntroduce: newReasons
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditedContact({
                            ...editedContact,
                            reasonsToIntroduce: [
                              ...(editedContact.reasonsToIntroduce || []),
                              { title: '', description: '' }
                            ]
                          });
                        }}
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-2" />
                        Add Way to Help
                      </Button>
                    </div>
                  ) : (
                    Array.isArray(editedContact.reasonsToIntroduce) && editedContact.reasonsToIntroduce.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {editedContact.reasonsToIntroduce.map((item: any, idx: number) => (
                          <li key={idx}>
                            {item.title && <span className="font-medium">{item.title}: </span>}
                            {item.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No information provided'
                    )
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              <div className={styles.timeline}>
                <h2 className={styles.sectionTitle}>Timeline</h2>
                <Timeline personId={contact.id} refreshTrigger={timelineRefreshTrigger} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className={styles.stickySidebar}>
          <div className="flex flex-col h-full">
            <div className="space-y-3">
              <Button 
                className={styles.actionButton}
                variant="default"
                onClick={() => setShowCommunitySelector(true)}
              >
                Add to Community
              </Button>
              
              <Button 
                className={styles.actionButton}
                variant="default"
                onClick={() => router.push(`/introductions?personId=${contact.id}`)}
              >
                Suggest Intros
              </Button>
              
              <Button 
                className={styles.actionButton}
                variant="outline"
                onClick={() => setShowEventSelector(true)}
              >
                Add to Event
              </Button>

              <Button 
                className={styles.actionButton}
                variant="outline"
                onClick={() => setShowAddContext(true)}
              >
                Add Context
              </Button>

              {/* Visual separator between user and AI actions */}
              <div className="h-px bg-border my-3" />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Re-generate Profile
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleEnrich}
                disabled={isEnriching}
              >
                <Search className={`mr-2 h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
                Enrich Profile
              </Button>
            </div>

            {/* Delete button at bottom */}
            <div className="mt-auto pt-6 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.actionButton}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Profile
              </Button>
            </div>
          </div>
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

      <EventSelector
        open={showEventSelector}
        onOpenChange={setShowEventSelector}
        onSelect={handleAddToEvent}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will hide the profile from view but preserve the data. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 