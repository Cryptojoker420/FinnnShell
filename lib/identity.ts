import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface Identity {
  userId: string;
  email?: string;
  wallet_address?: string;
  twitter_handle?: string;
  user_agent: string;
  fingerprint: string;
  timezone: string;
  screen_resolution: string;
  ussid?: string;
  origin: string;
  last_seen: string;
  ip_address?: string | null;
}

export interface IdentityPayload {
  userId: string | null;
  email: string | null;
  wallet_address: string | null;
  twitter_handle: string | null;
  fingerprint: string;
  user_agent: string;
  origin: string;
  ussid: string;
  last_seen: string;
  last_prompt: string | null;
  total_prompts: number;
  timezone: string;
  screen_resolution: string;
  ip_address: string | null;
}

// 🔐 Get Supabase + browser-based identity (requires active session)
export async function getIdentity(): Promise<Identity> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('No active session');
  }

  const fingerprint = await getFingerprint();
  localStorage.setItem('fp', fingerprint); // cache for payload use

  const ussid = session.user.id + '-' + Date.now();
  localStorage.setItem('ussid', ussid); // cache it too

  return {
    userId: session.user.id,
    email: session.user.email,
    user_agent: navigator.userAgent,
    fingerprint,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    ussid,
    origin: window.location.origin,
    last_seen: new Date().toISOString(),
    ip_address: localStorage.getItem('ip_address') ?? undefined,
  };
}

// 🧠 Get stored identity metadata (used for prompt logging / guest fallback)
export async function getIdentityPayload(): Promise<IdentityPayload> {
  const fingerprint = localStorage.getItem('fp') ?? '';
  const email = localStorage.getItem('email') ?? null;
  const wallet = localStorage.getItem('wallet') ?? null;
  const twitter = localStorage.getItem('twitter') ?? null;
  const userId = localStorage.getItem('userId') ?? localStorage.getItem('user_id') ?? null;

  const ussid = localStorage.getItem('ussid') ?? crypto.randomUUID();
  localStorage.setItem('ussid', ussid);

  return {
    userId,
    email,
    wallet_address: wallet,
    twitter_handle: twitter,
    fingerprint,
    user_agent: navigator.userAgent,
    origin: window.location.origin,
    ussid,
    last_seen: new Date().toISOString(),
    last_prompt: localStorage.getItem('last_prompt') ?? null,
    total_prompts: parseInt(localStorage.getItem('total_prompts') ?? '0'),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    ip_address: localStorage.getItem('ip_address') ?? null,
  };
}

// 🔑 Uses FingerprintJS to get device/browser fingerprint
async function getFingerprint(): Promise<string> {
  const fpAgent = await FingerprintJS.load();
  const result = await fpAgent.get();
  return result.visitorId;
}

// ⬆️ Upsert identity into Supabase (optional helper)
export async function updateIdentity(identity: Partial<Identity>): Promise<void> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('No active session');
  }

  const { error } = await supabase
    .from('user_identity_map')
    .upsert({
      user_id: session.user.id,
      ...identity,
      last_seen: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to update identity:', error);
    throw error;
  }
}