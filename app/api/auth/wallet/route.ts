import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { address, message, signature } = await req.json();

  // 1. Verify the signature
  let isValid = false;
  try {
    isValid = await verifyMessage({
      address,
      message,
      signature,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Signature verification failed.' }, { status: 400 });
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // 2. (Optional) Check/issue a nonce to prevent replay attacks
  //    You can store a nonce in your DB and require it in the message.

  // 3. Create or fetch the user in your DB
  //    For example, upsert by wallet address
  const { data: user, error } = await supabase
    .from('users')
    .upsert({ wallet_address: address }, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }

  // 4. Create a Supabase session (or your own session/JWT)
  //    If using Supabase Auth, you may need to use a custom JWT or magic link.
  //    For now, just return success and user info.
  return NextResponse.json({ success: true, user });
}
