import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { formatAuthResponse } from "@/lib/formatAuthResponse";
import { logIdentity } from "@/lib/logIdentity";
import { logEvent } from "@/lib/logEvent";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { email, password, identity } = await req.json();

    console.log("[api/auth/signup] request body:", {
      email,
      hasPassword: !!password,
      identity: identity ?? "[identity missing]",
    });

    // Basic validation
    if (!email || !password) {
      return formatAuthResponse(
        { success: false, error: "Email and password are required" },
        400,
      );
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });

    console.log("[api/auth/signup] supabase.signUp result:", { data, error });

    if (error) {
      return formatAuthResponse(
        { success: false, error: error.message || "Signup error occurred." },
        400,
      );
    }

    if (!data?.user) {
      return formatAuthResponse(
        { success: false, error: "Signup failed. No user object returned." },
        400,
      );
    }

    // Automatically sign in the new user
    const { error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signinError) {
      console.error("[api/auth/signup] Auto sign-in error:", signinError);
    }

    // Insert user into user_settings table
    const { error: settingsInsertError } = await supabase
      .from("user_settings")
      .insert({
        user_id: data.user.id,
        finn_key_verified: false,
      });

    if (settingsInsertError) {
      console.error("❌ Failed to insert user_settings:", settingsInsertError);
    } else {
      console.log("✅ user_settings row inserted.");
    }

    // Log identity fingerprint
    try {
      await logIdentity({
        userId: data.user.id,
        ...(identity ?? {}),
        origin: "email",
      });
    } catch (logErr: any) {
      console.error(
        "[api/auth/signup] logIdentity error for user",
        data.user.id,
        logErr,
      );
    }

    // Log signup event
    try {
      await logEvent({
        user_id: data.user.id,
        method: "email",
        event_type: "signup",
        fingerprint: identity?.fingerprint ?? "",
        user_agent: identity?.user_agent ?? "",
        timezone: identity?.timezone,
        screen_resolution: identity?.screen_resolution,
      });
    } catch (eventErr: any) {
      console.error(
        "[api/auth/signup] logEvent error for user",
        data.user.id,
        eventErr,
      );
    }

    return formatAuthResponse({ success: true }, 200);
  } catch (err: any) {
    console.error("[api/auth/signup] Unexpected error:", err);
    return formatAuthResponse(
      { success: false, error: err?.message || "Unexpected server error." },
      500,
    );
  }
}