// app/auth/callback/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getURL } from "@/lib/utils/getURL";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/";
  const origin = url.origin;

  if (!next.startsWith("/")) next = "/";

  if (!code) {
    console.error("[auth/callback] Missing code");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.session) {
      console.error("[auth/callback] Session exchange error:", error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const session = data.session;
    const user = session.user;

    // Log login server-side
    try {
      const baseUrl = getURL();
      await fetch(`${baseUrl}/api/log-twitter`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          origin: "twitter",
          identity: {
            email: user.email,
            metadata: user.user_metadata,
          },
        }),
      });
    } catch (logError: any) {
      console.error("[auth/callback] Failed to log login:", logError.message);
    }

    // Redirect using the dynamic URL
    const redirectUrl = `${getURL()}${next}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[auth/callback] Unexpected error:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}