'use client';

import { useEffect, useState } from 'react';
import { Task, TaskStatus, TeamMember } from '../types';
import { supabase } from '../lib/supabase';

import CreateTaskForm from './CreateTaskForm';
import TeamMemberForm from './TeamMemberForm';
import Column from './Column';

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<Record<string, TeamMember[]>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragOver, setDragOver] = useState<{ column: TaskStatus; index: number } | null>(null);

  const columns: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

  // --- Fetch functions ---
  const fetchTeam = async () => {
    const { data, error } = await supabase.from('team_members').select('*');
    if (error) console.error(error);
    else setTeam(data);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    else setTasks(data as Task[]);
  };

  const fetchAssignees = async () => {
    const { data, error } = await supabase.from('task_assignees').select('*');
    if (error) return console.error(error);

    const map: Record<string, TeamMember[]> = {};
    data.forEach(a => {
      const member = team.find(t => t.id === a.member_id);
      if (!member) return;
      if (!map[a.task_id]) map[a.task_id] = [];
      map[a.task_id].push(member);
    });
    setTaskAssignees(map);
  };

  useEffect(() => {
    fetchTasks();
    fetchTeam();
  }, []);

  useEffect(() => {
    if (team.length > 0) fetchAssignees();
  }, [team]);

  // --- DnD sensors ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const t = tasks.find(x => x.id === event.active.id);
    if (t) setActiveTask(t);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return setDragOver(null);
    const overId = over.id as string;

    if (columns.includes(overId as TaskStatus)) {
      setDragOver({
        column: overId as TaskStatus,
        index: tasks.filter(t => t.status === overId).length,
      });
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return setDragOver(null);
      const columnTasks = tasks.filter(t => t.status === overTask.status && t.id !== active.id);
      const index = columnTasks.findIndex(t => t.id === overTask.id);
      setDragOver({ column: overTask.status, index });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return setActiveTask(null);

    const taskId = active.id as string;
    const overId = over.id as string;

    const activeTaskData = tasks.find(t => t.id === taskId);
    if (!activeTaskData) return setActiveTask(null);

    let newStatus: TaskStatus;
    let newTasksOrder: Task[] = [];

    if (columns.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
      newTasksOrder = tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t));
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return setActiveTask(null);
      newStatus = overTask.status;

      const columnTasks = tasks.filter(t => t.status === newStatus && t.id !== taskId);
      const overIndex = columnTasks.findIndex(t => t.id === overId);
      columnTasks.splice(overIndex >= 0 ? overIndex : columnTasks.length, 0, {
        ...activeTaskData,
        status: newStatus,
      });
      const otherTasks = tasks.filter(t => t.status !== newStatus && t.id !== taskId);
      newTasksOrder = [...otherTasks, ...columnTasks];
    }

    setTasks(newTasksOrder);

    if (activeTaskData.status !== newStatus) {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) console.error(error);
    }

    setActiveTask(null);
  };

  // --- Handle assignee updates (sync with Supabase) ---
  const handleAssigneesChange = async (taskId: string, assignees: TeamMember[]) => {
    setTaskAssignees(prev => ({ ...prev, [taskId]: assignees }));

    // Persist to Supabase
    const { data: existing } = await supabase.from('task_assignees').select('*').eq('task_id', taskId);
    const existingIds = existing?.map(e => e.member_id) ?? [];

    // Delete removed
    const toDelete = existingIds.filter(id => !assignees.some(a => a.id === id));
    if (toDelete.length > 0) {
      await supabase.from('task_assignees').delete().eq('task_id', taskId).in('member_id', toDelete);
    }

    // Insert new
    const toInsert = assignees.filter(a => !existingIds.includes(a.id));
    if (toInsert.length > 0) {
      await supabase.from('task_assignees').insert(toInsert.map(a => ({ task_id: taskId, member_id: a.id })));
    }
  };

  return (
    <div className="p-4">
      <TeamMemberForm onTeamUpdated={fetchTeam} />
      <CreateTaskForm onTaskCreated={fetchTasks} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 mt-4">
          {columns.map(status => (
            <Column
              key={status}
              id={status}
              tasks={tasks
                .filter(t => t.status === status)
                .map(t => ({ ...t, assignees: taskAssignees[t.id] ?? [] }))}
              activeId={activeTask?.id ?? null}
              dragOver={dragOver}
              team={team}
              onAssigneesChange={handleAssigneesChange}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-(--bg-task) p-4 rounded-lg shadow-lg scale-105 cursor-grabbing">
              {activeTask.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}