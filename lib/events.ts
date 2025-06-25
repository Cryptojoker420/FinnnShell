import { supabaseAdmin } from './supabase-admin';
import type { Identity } from './identity';

export type EventType = 'login' | 'logout' | 'prompt' | 'error';

export interface Event {
  user_id: string;
  method: string;
  event_type: EventType;
  fingerprint?: string;
  user_agent?: string;
  timezone?: string;
  screen_resolution?: string;
  ip_address?: string | null;
  metadata?: Record<string, any>;
}

export interface IdentityWithIP extends Identity {
  ip_address?: string;
}

export async function logEvent(event: Event): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('login_events')
      .insert({
        ...event,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log event:', error);
      // Don't throw - we don't want event logging to break the app
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

export async function logLoginEvent(userId: string, identity: Identity): Promise<void> {
  await logEvent({
    user_id: userId,
    method: 'email',
    event_type: 'login',
    fingerprint: identity.fingerprint,
    user_agent: identity.user_agent,
    timezone: identity.timezone,
    screen_resolution: identity.screen_resolution,
    ip_address: identity.ip_address ?? null,
  });
}

export async function logPromptEvent(userId: string, identity: IdentityWithIP, prompt: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('user_prompt_logs')
      .insert({
        user_id: userId,
        prompt,
        email: identity.email,
        fingerprint: identity.fingerprint,
        platform: identity.origin,
        user_agent: identity.user_agent,
        ip_address: identity.ip_address,
        timestamp: new Date().toISOString(),
        clean_prompt: prompt.trim().slice(0, 500),
        memory_used: null,
      });

    if (error) {
      console.error('❌ Failed to log prompt event:', error);
    }
  } catch (err) {
    console.error('❌ Error in logPromptEvent:', err);
  }
}

async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
} 