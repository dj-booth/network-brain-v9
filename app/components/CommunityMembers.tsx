'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { PlusIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { CommunityMembershipStatus } from '@/lib/types';
import { MemberSelector } from './MemberSelector';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/ui/SortableItem';

interface CommunityMembersProps {
  communityId: string;
}

interface Member {
  id: string;
  name: string;
  image_url?: string;
  title?: string;
  company?: string;
  membership_status: CommunityMembershipStatus | null;
}

const statusOrder: CommunityMembershipStatus[] = [
  'prospect',
  'applied',
  'approved',
  'inactive'
];

const statusColors: Record<CommunityMembershipStatus, string> = {
  prospect: 'bg-gray-50',
  applied: 'bg-blue-50',
  approved: 'bg-green-50',
  inactive: 'bg-amber-50',
  nominated: 'bg-purple-50', // Add this to match the type even though we don't use it
} as const;

export function CommunityMembers({ communityId }: CommunityMembersProps) {
  const [groupedMembers, setGroupedMembers] = useState<Record<CommunityMembershipStatus, Member[]>>({} as Record<CommunityMembershipStatus, Member[]>);
  const [loading, setLoading] = useState(true);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          membership_status,
          person:person_id (
            id,
            name,
            image_url,
            title,
            company
          )
        `)
        .eq('community_id', communityId);

      if (error) throw error;

      const transformedMembers = data
        ?.map(item => {
          const safeItem = item as any;
          const personData = safeItem.person as Member | undefined;
          if (!personData) return null;
          return {
            ...personData,
            membership_status: safeItem.membership_status ?? null
          } as Member;
        })
        .filter((member): member is Member => member !== null) || [];

      const grouped = statusOrder.reduce((acc, status) => {
        acc[status] = [];
        return acc;
      }, {} as Record<CommunityMembershipStatus, Member[]>);

      transformedMembers.forEach(member => {
        const currentStatus = member.membership_status ?? 'prospect';
        if (grouped[currentStatus]) {
          grouped[currentStatus].push(member);
        } else {
          console.warn(`Member with unexpected status found: ${member.membership_status}`);
        }
      });

      setGroupedMembers(grouped);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching members:', error.message);
      toast.error('Failed to load community members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (personIds: string[], status: CommunityMembershipStatus) => {
    if (!personIds || personIds.length === 0) {
      toast.warning("No people selected to add.");
      return;
    }

    setIsAddingMembers(true);
    try {
      console.log('Adding community members:', { communityId, personIds, status });

      const membersToAdd = personIds.map(personId => ({
        community_id: communityId,
        person_id: personId,
        membership_status: status
      }));

      const { data, error } = await supabase
        .from('community_members')
        .insert(membersToAdd)
        .select();

      if (error) {
        console.error('Supabase error adding members:', error);
        if (error.code === '23505') {
           toast.error("Error adding members", {
             description: "One or more selected people are already members of this community."
           });
        } else {
           throw error;
        }
      } else if (data && data.length > 0) {
         console.log(`Successfully added/processed ${data.length} member(s):`, data);
         toast.success(`Added ${data.length} member(s) successfully`);
         fetchMembers();
      } else {
         console.log('No new members added or updated.');
      }

    } catch (err) {
      const error = err as Error;
      console.error('Error adding community members:', error);
      toast.error(`Failed to add members: ${error.message}`);
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleUpdateStatus = async (personId: string, newStatus: CommunityMembershipStatus) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ membership_status: newStatus })
        .eq('community_id', communityId)
        .eq('person_id', personId);

      if (error) throw error;

      toast.success("Updated member status successfully");
      
      // Update local state optimistically
      setGroupedMembers(prev => {
        const newGrouped = { ...prev };
        let movedMember: Member | undefined;
        
        // Find and remove the member from their old status group
        Object.values(newGrouped).forEach(members => {
          const index = members.findIndex(m => m.id === personId);
          if (index !== -1) {
            [movedMember] = members.splice(index, 1);
          }
        });

        // Add the member to their new status group
        if (movedMember) {
          movedMember.membership_status = newStatus;
          newGrouped[newStatus].push(movedMember);
        }

        return newGrouped;
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update member status");
      // Refresh the members list to ensure consistency
      fetchMembers();
    }
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeMember = Object.values(groupedMembers).flat().find(m => m.id === active.id);
    const overMember = Object.values(groupedMembers).flat().find(m => m.id === over.id);
    
    if (!activeMember || !overMember) return;
    
    const activeStatus = activeMember.membership_status;
    const overStatus = overMember.membership_status;
    
    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    // Update local state optimistically
    setGroupedMembers(prev => {
      const newGrouped = { ...prev };
      const member = { ...activeMember, membership_status: overStatus };
      
      // Remove from old status
      newGrouped[activeStatus] = newGrouped[activeStatus].filter(m => m.id !== member.id);
      
      // Add to new status
      newGrouped[overStatus] = [...newGrouped[overStatus], member];
      
      return newGrouped;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeMember = Object.values(groupedMembers).flat().find(m => m.id === active.id);
    const overMember = Object.values(groupedMembers).flat().find(m => m.id === over.id);
    
    if (!activeMember || !overMember) return;
    
    const activeStatus = activeMember.membership_status;
    const overStatus = overMember.membership_status;
    
    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    handleUpdateStatus(activeMember.id, overStatus);
  }

  const activeMember = activeId ? Object.values(groupedMembers).flat().find(m => m.id === activeId) : null;

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Members</h2>
          <Button onClick={() => setShowMemberSelector(true)} disabled={isAddingMembers}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {statusOrder.map((status) => (
          <div key={status} className={`rounded-lg ${statusColors[status]} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                <span className="text-sm text-gray-500">({groupedMembers[status]?.length || 0})</span>
              </div>
            </div>
            
            <SortableContext items={groupedMembers[status] || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {groupedMembers[status]?.map((member) => (
                  <SortableItem key={member.id} id={member.id}>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.image_url} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        {(member.title || member.company) && (
                          <div className="text-sm text-gray-500">
                            {member.title}{member.company ? ` • ${member.company}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeMember ? (
          <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-blue-500">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeMember.image_url} />
                <AvatarFallback>{activeMember.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900">{activeMember.name}</div>
                {(activeMember.title || activeMember.company) && (
                  <div className="text-sm text-gray-500">
                    {activeMember.title}{activeMember.company ? ` • ${activeMember.company}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {showMemberSelector && (
        <MemberSelector
          open={showMemberSelector}
          onOpenChange={setShowMemberSelector}
          onSelect={handleAddMember}
          communityId={communityId}
        />
      )}
    </DndContext>
  );
} 