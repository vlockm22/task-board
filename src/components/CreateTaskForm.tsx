"use client"

import { useState } from "react"
import { supabase } from "../lib/supabase"

type Props = {
  onTaskCreated: () => void
}

export default function CreateTaskForm({ onTaskCreated }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return

    setLoading(true)
    const { data, error } = await supabase.from("tasks").insert({
      title,
      status: "todo",
      user_id: (await supabase.auth.getSession()).data.session?.user.id
    })

    setLoading(false)
    if (error) console.error(error)
    else {
      setTitle("")
      onTaskCreated() // notify parent to refresh tasks
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title"
        className="flex-1 border p-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
    </form>
  )
}