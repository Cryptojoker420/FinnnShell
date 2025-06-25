import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Logs or updates a user's identity in user_identity_map.
 * Accepts either userId (camelCase) or user_id (snake_case).
 */
export async function logIdentity(identity: any) {
  if (!identity || typeof identity !== "object") {
    throw new Error("Invalid or missing identity object");
  }

  const user_id = identity.ussid || identity.user_id || identity.userId;
  if (!user_id) throw new Error("Missing user_id");

  const fields = { ...identity };
  delete fields.ussid;
  delete fields.user_id;
  delete fields.userId;

  const { error } = await supabaseAdmin
    .from("user_identity_map")
    .upsert({ user_id, ...fields }, { onConflict: "user_id" });

  if (error) {
    console.error("[logIdentity] Upsert error:", error);
    throw new Error("Failed to log identity");
  }
}
