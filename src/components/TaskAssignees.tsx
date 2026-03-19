'use client';

import { TeamMember } from '../types';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

type Props = {
  taskId: string;
  team: TeamMember[];
  assignees: TeamMember[]; // controlled from parent
  onChange?: (assignees: TeamMember[]) => void;
};

export default function TaskAssignees({ taskId, team, assignees, onChange }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const toggleAssign = async (member: TeamMember) => {
    const isAssigned = assignees.some(a => a.id === member.id);
    let newAssignees: TeamMember[];

    if (isAssigned) {
      newAssignees = assignees.filter(a => a.id !== member.id);

      // remove from Supabase
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)
        .eq('member_id', member.id);
      if (error) console.error('Error unassigning member:', error);
    } else {
      newAssignees = [...assignees, member];

      // add to Supabase
      const { error } = await supabase
        .from('task_assignees')
        .insert({ task_id: taskId, member_id: member.id });
      if (error) console.error('Error assigning member:', error);
    }

    // update parent state immediately
    onChange?.(newAssignees);
  };

  return (
    <div className="flex -space-x-2 mt-2 flex-wrap">
      {team.map(member => {
        const isAssigned = assignees.some(a => a.id === member.id);
        const initials = member.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();

        return (
          <div
            key={member.id}
            onClick={e => {
              e.stopPropagation(); // prevent modal
              toggleAssign(member);
            }}
            onMouseEnter={() => setHovered(member.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              relative w-6 h-6 rounded-full cursor-pointer border-2 flex items-center justify-center text-xs font-bold
              transition-all duration-150
              ${isAssigned ? 'border-white opacity-100 scale-105' : 'border-transparent opacity-40 hover:opacity-70 hover:scale-105'}
            `}
            style={{ backgroundColor: member.color ?? '#888' }}
            title={member.name}
          >
            {initials}

            {/* Tooltip */}
            {hovered === member.id && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap z-10">
                {isAssigned ? 'Assigned' : 'Click to assign'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
