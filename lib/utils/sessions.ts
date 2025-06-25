// lib/utils/session.ts
"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function waitForUser(maxRetries = 6, delayMs = 300) {
  const supabase = createClientComponentClient();
  for (let i = 0; i < maxRetries; i++) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) return user;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  throw new Error("Session not yet initialized.");
}