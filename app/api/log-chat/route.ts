import { supabaseAdmin } from "@/lib/supabase-admin";
// /app/api/log-chat/route.ts
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { error } = await supabaseAdmin
      .from("chat_logs")
      .insert([{ ...body }]);

    if (error) {
      console.error("[Chat log insert error]", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[API LOG-CHAT ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}
