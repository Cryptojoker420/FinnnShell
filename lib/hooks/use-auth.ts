'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getIdentity, type Identity } from '@/lib/identity';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

        // Get identity
        const userIdentity = await getIdentity();
        setIdentity(userIdentity);

        // Log identity if we have a session
        if (initialSession?.user) {
          await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userIdentity),
          });
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        const userIdentity = await getIdentity();
        setIdentity(userIdentity);

        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userIdentity),
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (session?.user && identity) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(identity),
        });
      }

      await supabase.auth.signOut();
      setSession(null);
      setIdentity(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as Error);
    }
  };

  return {
    session,
    loading,
    error,
    identity,
    isAuthenticated: !!session,
    signOut,
  };
}