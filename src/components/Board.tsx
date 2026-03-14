// src/components/Board.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import CreateTaskForm from "./CreateTaskForm"

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  DragOverEvent
} from "@dnd-kit/core"

import { CSS } from "@dnd-kit/utilities"

type Task = {
  id: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
  description?: string
  priority?: "low" | "normal" | "high"
}

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const columns: Task["status"][] = ["todo", "in_progress", "in_review", "done"]
  const [dragOver, setDragOver] = useState<{ column: Task["status"]; index: number } | null>(null)

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true })
    if (error) console.error(error)
    else setTasks(data as Task[])
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragStart = (event: DragStartEvent) => {
    const t = tasks.find((x) => x.id === event.active.id)
    if (t) setActiveTask(t)
  }

  const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event
    if (!over) return setDragOver(null)

    const overId = over.id as string

    // Determine which column and index we’re over
    if (columns.includes(overId as Task["status"])) {
        // Hovering over empty column → place at end
        setDragOver({ column: overId as Task["status"], index: tasks.filter(t => t.status === overId).length })
    } else {
        // Hovering over another task → insert before that task
        const overTask = tasks.find(t => t.id === overId)
        if (!overTask) return setDragOver(null)
        const columnTasks = tasks.filter(t => t.status === overTask.status && t.id !== active.id)
        const index = columnTasks.findIndex(t => t.id === overTask.id)
        setDragOver({ column: overTask.status, index })
    }
    }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return setActiveTask(null)

    const taskId = active.id as string
    const overId = over.id as string

    const activeTaskData = tasks.find(t => t.id === taskId)
    if (!activeTaskData) return setActiveTask(null)

    let newStatus: Task["status"]
    let newTasksOrder: Task[] = []

    if (columns.includes(overId as Task["status"])) {
        // Case 1: Dropped directly on column → move to end
        newStatus = overId as Task["status"]

        newTasksOrder = tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
        )

    } else {
        // Case 2: Dropped on another task → reorder in that column
        const overTask = tasks.find(t => t.id === overId)
        if (!overTask) return setActiveTask(null)

        newStatus = overTask.status

        // Remove active task from column
        const columnTasks = tasks
        .filter(t => t.status === newStatus && t.id !== taskId)

        // Insert at the dropped position
        const overIndex = columnTasks.findIndex(t => t.id === overId)
        columnTasks.splice(overIndex >= 0 ? overIndex : columnTasks.length, 0, {
        ...activeTaskData,
        status: newStatus,
        })

        // Merge other tasks
        const otherTasks = tasks.filter(t => t.status !== newStatus && t.id !== taskId)
        newTasksOrder = [...otherTasks, ...columnTasks]
    }

    // Update state
    setTasks(newTasksOrder)

    // Persist column change to Supabase
    if (activeTaskData.status !== newStatus) {
        const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
        if (error) console.error(error)
    }

    setActiveTask(null)
    }

  return (
    <div className="p-4">
      <CreateTaskForm onTaskCreated={fetchTasks} />

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        >
        <div className="flex gap-4 mt-4">
          {columns.map((status) => (
            <Column
              key={status}
              id={status}
              tasks={tasks.filter((t) => t.status === status)}
              activeId={activeTask?.id ?? null}
              dragOver={dragOver}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-(--bg-task) p-4 rounded-lg shadow-lg scale-105 cursor-grabbing">{activeTask.title}</div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// Droppable column
function Column({ id, tasks, activeId, dragOver }: { id: string; tasks: Task[]; activeId: string | null; dragOver: { column: Task["status"]; index: number } | null }) {
  const { setNodeRef } = useDroppable({ id })

  // Filter out the currently dragged card
  const visibleTasks = tasks.filter(t => t.id !== activeId)

  return (
    <div ref={setNodeRef} id={id} className="flex-1 bg-(--bg-column) p-4 rounded-lg shadow-sm min-h-48 flex flex-col">
      <h2 className="font-bold mb-2">{id.replace("_", " ").toUpperCase()}</h2>

      {visibleTasks.length > 0 ? visibleTasks.map((task, index) => (
        <div key={task.id}>
          {/* Render ghost placeholder if it should appear before this task */}
          {dragOver?.column === id && dragOver.index === index && activeId && (
            <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
          )}
          <SortableTask task={task} activeId={activeId} />
        </div>
      )) : (
        <div className="text-amber-400 italic min-h-12.5 flex items-center justify-center">
          {dragOver?.column === id && activeId && (
            <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
          )}
          Drop tasks here
        </div>
      )}

      {/* Render placeholder at end if dragging to empty space */}
      {dragOver?.column === id && dragOver.index >= visibleTasks.length && activeId && (
        <div className="h-16 mb-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-200 animate-pulse"></div>
      )}
    </div>
  )
}

// Draggable task
import { useSortable } from "@dnd-kit/sortable"
function SortableTask({ task, activeId }: { task: Task; activeId: string | null }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isDragging = task.id === activeId;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ 
        ...style, 
        visibility: isDragging ? "hidden" : "visible"
        }}
    className="bg-(--bg-task) p-4 mb-3 rounded-lg shadow-md cursor-grab hover:shadow-lg hover:scale-[1.02] transition-transform"
    >
      <h3 className="font-semibold text-(--text-primary) text-lg mb-1">{task.title}</h3>

      {task.description && (
        <p className="text-(--text-secondary) text-sm mb-2 line-clamp-3">
          {task.description}
        </p>
        )}

        {task.priority && (
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
            task.priority === "high" ? "bg-red-200 text-red-800" :
            task.priority === "normal" ? "bg-yellow-200 text-yellow-800" :
            "bg-green-200 text-green-800"
          }`}
        >
          {task.priority.toUpperCase()}
        </span>
      )}
    </div>
  )
}