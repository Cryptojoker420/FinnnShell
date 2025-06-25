import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { logLoginEvent } from '@/lib/events';
import { type Identity } from '@/lib/identity';

export async function POST(req: Request) {
  try {
    const { email, password, identity } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !session?.user) {
      return NextResponse.json(
        { success: false, error: error?.message || 'No session created' },
        { status: 401 }
      );
    }

    await logLoginEvent(session.user.id, identity as Identity);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}