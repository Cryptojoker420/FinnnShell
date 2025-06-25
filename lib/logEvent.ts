import { supabaseAdmin } from "@/lib/supabase-admin";

export async function logEvent(event: {
  user_id: string | null;
  method: string;
  event_type: string;
  fingerprint: string;
  ip_address?: string;
  user_agent: string;
  timezone?: string;
  screen_resolution?: string;
}) {
  await supabaseAdmin.from("login_events").insert([event]);
}
