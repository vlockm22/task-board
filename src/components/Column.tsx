import { Task, TeamMember } from '../types';
import SortableTask from './SortableTask';
import { useDroppable } from '@dnd-kit/core';

type ColumnProps = {
  id: string;
  tasks: (Task & { assignees?: TeamMember[] })[];
  activeId: string | null;
  dragOver: { column: Task['status']; index: number } | null;
  team: TeamMember[];
  onAssigneesChange: (taskId: string, assignees: TeamMember[]) => void;
  onDelete?: (taskId: string) => void;
  onPriorityChange?: (taskId: string, newPriority: Task['priority']) => void;
};

export default function Column({
  id,
  tasks,
  activeId,
  dragOver,
  team,
  onAssigneesChange,
  onDelete,
  onPriorityChange,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const visibleTasks = tasks.filter(t => t.id !== activeId);

  return (
    <div
      ref={setNodeRef}
      id={id}
      className="flex-1 bg-(--bg-column) p-4 rounded-xl shadow-sm min-h-48 
      flex flex-col transition-all max-w-75"
    >
      <h2 className="font-bold mb-4 subheading flex justify-center">
        {id.replace('_', ' ').toUpperCase()}
      </h2>

      {visibleTasks.length > 0 ? (
        visibleTasks.map((task, index) => (
          <div key={task.id}>
            {dragOver?.column === id && dragOver.index === index && activeId && (
              <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
            )}

            {/* Always pass assignees array (default to []) */}
            <SortableTask
              task={{ ...task, assignees: task.assignees ?? [] }}
              activeId={activeId}
              team={team}
              onAssigneesChange={onAssigneesChange}
              onDelete={taskId => onDelete?.(taskId)}
              onPriorityChange={onPriorityChange}
            />
          </div>
        ))
      ) : (
        <div className="text-amber-400 italic rounded-lg border-2 border-dashed min-h-12.5 flex items-center justify-center">
          {dragOver?.column === id && activeId && (
            <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
          )}
          Drop tasks here
        </div>
      )}

      {dragOver?.column === id && dragOver.index >= visibleTasks.length && activeId && (
        <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
      )}
    </div>
  );
}
