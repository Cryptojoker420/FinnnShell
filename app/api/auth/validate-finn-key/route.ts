import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { key: rawKey } = await req.json();
  const finnKey = rawKey?.trim();
  const expectedKey = process.env.FINN_KEY?.trim();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    console.error("❌ No session or bad token:", sessionError?.message);
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 }
    );
  }

  const user = session.user;

  const expectedBuf = Buffer.from(expectedKey || "", "utf8");
  const providedBuf = Buffer.from(finnKey, "utf8");

  if (
    !finnKey ||
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid FINN_KEY" },
      { status: 400 }
    );
  }

  const { error: upsertError } = await supabaseAdmin
    .from("user_settings")
    .upsert(
      { user_id: user.id, finn_key_verified: true },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("❌ Failed to update user_settings:", upsertError);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }

  // 🔁 Refresh user metadata so Supabase reissues cookie
  const { error: refreshError } = await supabase.auth.updateUser({
    data: {
      finn_key_last_verified: new Date().toISOString(),
    },
  });

  if (refreshError) {
    console.error("⚠️ Failed to refresh session cookie:", refreshError.message);
  }

  console.log("✅ FINN_KEY verified and session refreshed:", user.id);
  return NextResponse.json({ success: true });
}