import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export interface ServerIdentity {
  userId: string;
  email?: string;
}

export async function getServerIdentity(): Promise<ServerIdentity> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('No active session');
  }

  return {
    userId: session.user.id,
    email: session.user.email,
  };
} 