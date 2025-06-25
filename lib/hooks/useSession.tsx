"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase-client"; // ✅ browser client
import { getIdentityPayload, type IdentityPayload } from "@/lib/identity";
import type { Session } from "@supabase/auth-helpers-nextjs";

interface SessionContextValue {
  session: Session | null;
  identity: IdentityPayload | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<IdentityPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Hydrate session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        const payload = await getIdentityPayload();
        setIdentity(payload);
      }
      setLoading(false);
    });

    // Listen to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const payload = await getIdentityPayload();
        setIdentity(payload);
      } else {
        setIdentity(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, identity, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

/** ✅ Hook to access session + identity */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}