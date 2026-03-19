'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Comment = {
  id: string;
  task_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

export default function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    else setComments(data as Comment[]);
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // Get current user (works for anon/guest if you created a session)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      console.error('Error getting user:', userErr);
    }

    // If you require a user to be present, check and bail
    if (!user) {
      console.error('No user signed in. Comments require an authenticated user.');
      alert('You must be signed in to comment.');
      return;
    }

    // Insert using snake_case column names and include user_id
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          task_id: taskId,
          user_name: user.user_metadata?.full_name || user.email || 'Guest',
          content: newComment.trim(),
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      // Log every property of the error object so we don't get an empty {}
      console.error('Add comment error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert('Error adding comment — check console for details.');
      return;
    }

    setComments(prev => [...prev, ...(data as Comment[])]);
    setNewComment('');
  };

  return (
    <div className="mt-2 p-2 border-t  max-h-64 overflow-y-auto">
      <h4 className="font-semibold mb-2">Comments</h4>
      <div className="space-y-2">
        {comments.map(comment => (
          <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
            <span className="font-bold text-sm">{comment.user_name}</span>
            <span className="text-xs ml-2">{new Date(comment.created_at).toLocaleString()}</span>
            <p className="text-sm">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="flex mt-2 gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 border rounded"
        />
        <button onClick={handleAddComment} className="px-3 py-1 bg-blue-500 hover:bg-blue-600">
          Add
        </button>
      </div>
    </div>
  );
}
