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
} from "@dnd-kit/core"

import { CSS } from "@dnd-kit/utilities"

type Task = {
  id: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
}

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const columns: Task["status"][] = ["todo", "in_progress", "in_review", "done"]

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const overId = over.id as string

    // Determine destination column
    const destColumn: Task["status"] | null = columns.includes(overId as Task["status"])
      ? (overId as Task["status"])
      : tasks.find((t) => t.id === overId)?.status || null

    if (!destColumn || destColumn === task.status) {
      setActiveTask(null)
      return
    }

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: destColumn } : t))
    )

    // Persist change
    const { error } = await supabase.from("tasks").update({ status: destColumn }).eq("id", taskId)
    if (error) console.error("Supabase update error:", error)

    setActiveTask(null)
  }

  return (
    <div className="p-4">
      <CreateTaskForm onTaskCreated={fetchTasks} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 mt-4">
          {columns.map((status) => (
            <Column
              key={status}
              id={status}
              tasks={tasks.filter((t) => t.status === status)}
              activeId={activeTask?.id ?? null}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-white p-2 rounded shadow cursor-grabbing">{activeTask.title}</div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// Droppable column
function Column({ id, tasks, activeId }: { id: string; tasks: Task[]; activeId: string | null }) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div ref={setNodeRef} id={id} className="flex-1 bg-gray-100 p-4 rounded shadow min-h-[300px]">
      <h2 className="font-bold mb-2">{id.replace("_", " ").toUpperCase()}</h2>
      {tasks.length > 0 ? (
        tasks.map((task) => <SortableTask key={task.id} task={task} activeId={activeId} />)
      ) : (
        <div className="text-gray-400 italic min-h-[50px] flex items-center justify-center">
          Drop tasks here
        </div>
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
    className="bg-white p-2 mb-2 rounded shadow cursor-grab"
    >
      {task.title}
    </div>
  )
}