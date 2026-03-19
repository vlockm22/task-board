import { Task, TeamMember } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';
import TaskAssignees from './TaskAssignees';
import { supabase } from '../lib/supabase';

type Props = {
  task: Task & { assignees: TeamMember[] };
  activeId: string | null;
  team: TeamMember[];
  onAssigneesChange: (taskId: string, assignees: TeamMember[]) => void;
  onDelete?: (taskId: string) => void;
  onPriorityChange?: (taskId: string, newPriority: Task['priority']) => void;
};

export default function SortableTask({
  task,
  activeId,
  team,
  onAssigneesChange,
  onDelete,
  onPriorityChange,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const [showDetail, setShowDetail] = useState(false);

  const isDragging = task.id === activeId;
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    if (!task.id) return;

    // Update UI immediately
    onPriorityChange?.(task.id, newPriority);

    // Persist to Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ priority: newPriority })
      .eq('id', task.id);
    if (error) console.error('Error updating task priority:', error);
  };
  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{ ...style, visibility: isDragging ? 'hidden' : 'visible' }}
        className="relative bg-(--bg-task) p-4 mb-3 rounded-lg shadow-md cursor-grab hover:shadow-lg hover:scale-[1.02] transition-transform"
      >
        <div className="absolute top-2 right-2">
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent modal from opening
              onDelete?.(task.id);
            }}
            className="text-gray-400 hover:text-red-600"
            title="Delete task"
          >
            ✕
          </button>
        </div>
        <div className="cursor-pointer" onClick={() => !isDragging && setShowDetail(true)}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 wrap-break-word">{task.title}</h3>
          {task.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-3">{task.description}</p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, marginRight: '8px' }}>Priority:</span>

          {[
            {
              value: 'low',
              label: 'Low',
              activeBg: '#16a34a',
              activeText: '#ffffff',
              border: '#15803d',
            },
            {
              value: 'normal',
              label: 'Normal',
              activeBg: '#eab308',
              activeText: '#111827',
              border: '#ca8a04',
            },
            {
              value: 'high',
              label: 'High',
              activeBg: '#dc2626',
              activeText: '#ffffff',
              border: '#b91c1c',
            },
          ].map(p => {
            const active = task.priority === p.value;

            return (
              <button
                key={p.value}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handlePriorityChange(p.value as Task['priority']);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: `1px solid ${active ? p.border : 'rgba(255,255,255,0.18)'}`,
                  backgroundColor: active ? p.activeBg : 'rgba(255,255,255,0.08)',
                  color: active ? p.activeText : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor: 'pointer',
                  boxShadow: active ? '0 1px 6px rgba(0,0,0,0.18)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Pass taskId + assignees to TaskAssignees */}
        <TaskAssignees
          taskId={task.id}
          team={team}
          assignees={task.assignees}
          onChange={newAssignees => onAssigneesChange(task.id, newAssignees)}
        />
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          team={team}
          assignees={task.assignees}
          onClose={() => setShowDetail(false)}
          onAssigneesChange={newAssignees => onAssigneesChange(task.id, newAssignees)}
        />
      )}
    </>
  );
}
