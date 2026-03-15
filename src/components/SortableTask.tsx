import { Task, TeamMember } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';
import TaskAssignees from './TaskAssignees';

type Props = {
  task: Task & { assignees: TeamMember[] };
  activeId: string | null;
  team: TeamMember[];
  onAssigneesChange: (taskId: string, assignees: TeamMember[]) => void;
};

export default function SortableTask({ task, activeId, team, onAssigneesChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const [showDetail, setShowDetail] = useState(false);

  const isDragging = task.id === activeId;
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{ ...style, visibility: isDragging ? 'hidden' : 'visible' }}
        className="bg-(--bg-task) p-4 mb-3 rounded-lg shadow-md cursor-grab hover:shadow-lg hover:scale-[1.02] transition-transform"
      >
        <div className="cursor-pointer" onClick={() => !isDragging && setShowDetail(true)}>
          <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
          {task.description && <p className="text-gray-600 text-sm mb-2 line-clamp-3">{task.description}</p>}
        </div>

        {task.priority && (
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full font-semibold mb-2 ${
              task.priority === 'high'
                ? 'bg-red-200 text-red-800'
                : task.priority === 'normal'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-green-200 text-green-800'
            }`}
          >
            {task.priority.toUpperCase()}
          </span>
        )}

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