'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { PlusIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

interface CommunityMembersProps {
  communityId: string;
}

interface Member {
  id: string;
  name: string;
  image_url?: string;
  title?: string;
  company?: string;
}

export function CommunityMembers({ communityId }: CommunityMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
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

      // Transform the data to match our Member interface
      const transformedMembers = data
        ?.map(item => (item as any).person as Member | null)
        .filter((member): member is Member => 
          member !== null && 
          typeof member.id === 'string' && 
          typeof member.name === 'string'
        ) || [];

      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load community members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    // This will be implemented when we add the member selector dialog
    toast.info('Add member functionality coming soon');
  };

  if (loading) {
    return <div>Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Members ({members.length})</h3>
        <Button onClick={handleAddMember} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No members yet. Add some members to get started!
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.image_url} alt={member.name} />
                <AvatarFallback>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                {(member.title || member.company) && (
                  <p className="text-sm text-muted-foreground truncate">
                    {[member.title, member.company].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 