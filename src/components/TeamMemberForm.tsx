'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  onTeamUpdated: () => void;
};

export default function TeamMemberForm({ onTeamUpdated }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4f46e5'); // default color

  const addMember = async () => {
    if (!name) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('team_members').insert({
      name,
      color,
      user_id: user.id,
    });

    if (error) console.error('Add member error:', error);
    else {
      setName('');
      onTeamUpdated();
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Member name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border rounded px-2 py-1 flex-1"
      />
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
        className="w-12 h-8 p-0 border-none"
      />
      <button
        onClick={addMember}
        className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
      >
        Add
      </button>
    </div>
  );
}
