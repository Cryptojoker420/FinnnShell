'use client';

import { ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Providers } from '@/components/providers';

export default function RootClient({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  const supabase = createClientComponentClient();

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      <Providers>{children}</Providers>
    </SessionContextProvider>
  );
}