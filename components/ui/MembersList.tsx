'use client';

import React, { useState } from 'react';
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
import { SortableItem } from './SortableItem';

type MemberStatus = 'Prospect' | 'Applied' | 'Approved' | 'Inactive';

interface Member {
  id: string;
  name: string;
  title: string;
  company: string;
  status: MemberStatus;
}

interface MembersListProps {
  initialMembers: Member[];
  onStatusChange: (memberId: string, newStatus: MemberStatus) => void;
}

export function MembersList({ initialMembers, onStatusChange }: MembersListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor));

  const membersByStatus = {
    Prospect: members.filter(m => m.status === 'Prospect'),
    Applied: members.filter(m => m.status === 'Applied'),
    Approved: members.filter(m => m.status === 'Approved'),
    Inactive: members.filter(m => m.status === 'Inactive'),
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = members.find(m => m.id === active.id)?.status;
    const overContainer = members.find(m => m.id === over.id)?.status;
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setMembers(members.map(member => {
      if (member.id === active.id) {
        return { ...member, status: overContainer };
      }
      return member;
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = members.find(m => m.id === active.id)?.status;
    const overContainer = members.find(m => m.id === over.id)?.status;
    
    if (activeContainer !== overContainer) {
      onStatusChange(active.id as string, overContainer as MemberStatus);
    }
  }

  const activeMember = activeId ? members.find(m => m.id === activeId) : null;

  const statusColors = {
    Prospect: 'bg-gray-100',
    Applied: 'bg-blue-50',
    Approved: 'bg-green-50',
    Inactive: 'bg-amber-50',
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {(Object.entries(membersByStatus) as [MemberStatus, Member[]][]).map(([status, statusMembers]) => (
          <div key={status} className={`rounded-lg ${statusColors[status]} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">{status}</h3>
                <span className="text-sm text-gray-500">({statusMembers.length})</span>
              </div>
            </div>
            <SortableContext items={statusMembers} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {statusMembers.map((member) => (
                  <SortableItem key={member.id} id={member.id}>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.title} • {member.company}</div>
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
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div>
                <div className="font-medium text-gray-900">{activeMember.name}</div>
                <div className="text-sm text-gray-500">{activeMember.title} • {activeMember.company}</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 