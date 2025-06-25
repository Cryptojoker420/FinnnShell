import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const raw = await req.json();
    delete raw.userId; // 💀 still kill just in case
    const identity = raw;

    const response = NextResponse.json({ success: true });

    // Expire cookies
    response.cookies.set('sb-access-token', '', { maxAge: 0 });
    response.cookies.set('sb-refresh-token', '', { maxAge: 0 });

    // Use session ID if available
    const userId = session?.user?.id || raw.user_id;

    if (userId) {
      await supabaseAdmin.from('login_events').insert({
        user_id: userId,
        method: 'logout',
        event_type: 'logout',
        ...identity,
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}