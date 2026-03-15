'use client';

import { useEffect, useState } from 'react';
import { supabase, Session } from '../lib/supabase';

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function initGuest() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) console.error('Guest login error:', error);
        else setSession(data.session);
      } else {
        setSession(currentSession);
      }

      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
    }

    initGuest();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
