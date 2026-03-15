export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export type Task = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  assignees?: TeamMember[];
};

export type TeamMember = {
  id: string;
  name: string;
  color?: string;
};
