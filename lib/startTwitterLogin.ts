"use client";
import { createClient } from "./supabase-client";
import { getURL } from "@/lib/utils/getURL";

export async function startTwitterLogin() {
  const supabase = createClient();

  // Use dynamic URL from environment or fallback
  const redirectTo = `${getURL()}/auth/callback`;

  console.log("Starting Twitter login with redirect:", redirectTo);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo,
        queryParams: {
          // Add any additional Twitter OAuth parameters if needed
        },
      },
    });

    if (error) {
      console.error("[startTwitterLogin] Supabase OAuth error:", error);
      throw error;
    }

    if (!data?.url) {
      console.error("[startTwitterLogin] No OAuth URL returned from Supabase");
      throw new Error("No OAuth URL returned from Supabase");
    }

    console.log("Twitter OAuth URL generated:", data.url);
    return { data, error: null };
  } catch (error) {
    console.error("[startTwitterLogin] OAuth error:", error);
    return { data: null, error };
  }
}
