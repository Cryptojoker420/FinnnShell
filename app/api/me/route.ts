// app/api/me/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[/api/me] Failed to fetch session:", error.message);
      return NextResponse.json({ error: "Auth error" }, { status: 401 });
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    return NextResponse.json({ user: session.user });
  } catch (err: any) {
    console.error("[/api/me] 💥 Unexpected error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}