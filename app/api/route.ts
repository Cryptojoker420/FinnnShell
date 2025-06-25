import { createServerSupabaseClient } from "@/lib/supabase-admin";
import { logIdentity } from "@/lib/logIdentity";
import { formatAuthResponse } from "@/lib/formatAuthResponse";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient(); // ✅ no `req` passed
    const { email, password, identity } = await req.json();

    console.log("[auth/callback] request body:", { email, identity });

    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log("[auth/callback] supabase.signUp result:", { data, error });

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

    try {
      await logIdentity({
        userId: data.user.id,
        ...identity,
        origin: "email",
      });
    } catch (logErr: any) {
      console.error(
        "[auth/callback] logIdentity error for user",
        data.user.id,
        logErr,
      );
    }

    return formatAuthResponse({ success: true }, 200);
  } catch (err: any) {
    console.error("[auth/callback] unexpected error:", err);
    return formatAuthResponse(
      { success: false, error: err?.message || "Unexpected server error." },
      500,
    );
  }
}
