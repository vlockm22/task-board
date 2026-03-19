import { Task, TeamMember } from '../types';
import TaskAssignees from './TaskAssignees';
import TaskComments from './TaskComments';
import { createPortal } from 'react-dom';

type Props = {
  task: Task & { assignees: TeamMember[] };
  team: TeamMember[];
  assignees: TeamMember[];
  onClose: () => void;
  onAssigneesChange: (newAssignees: TeamMember[]) => void;
};

export default function TaskDetailModal({
  task,
  team,
  assignees,
  onClose,
  onAssigneesChange,
}: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">{task.title}</h2>
        {task.description && <p className="mb-4 text-gray-700">{task.description}</p>}

        {task.priority && (
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full font-semibold mb-4 ${
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

        <div className="mb-4">
          <h4 className="font-semibold mb-1">Assignees</h4>
          <TaskAssignees
            taskId={task.id}
            team={team}
            assignees={assignees}
            onChange={onAssigneesChange}
          />
        </div>

        <TaskComments taskId={task.id} />
      </div>
    </div>,
    document.body,
  );
}
