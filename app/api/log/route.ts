import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.warn("🚫 No session or session error:", sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🧠 Parse & clean identity
    const raw = await req.json();
    delete raw.userId; // 💀 kill the ghost
    const identity = raw;

    console.log("📦 /api/log identity body:", identity);

    const userId = session.user.id;
    console.log("🧠 Session user ID:", userId);

    const upsertPayload = {
      ...identity,
      user_id: userId,
      last_seen: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from('user_identity_map')
      .upsert(upsertPayload);

    if (updateError) {
      console.error('❌ Failed to update identity:', updateError);
      return NextResponse.json({ error: 'Failed to update identity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Log API error:', error.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}