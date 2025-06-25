// /app/api/log-twitter/route.ts
import { logIdentity } from "@/lib/logIdentity";
import { logEvent } from "@/lib/logEvent";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, identity, origin } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    await logIdentity({ userId, ...identity, origin });

    await logEvent({
      user_id: userId,
      method: origin,
      event_type: "login_success",
      fingerprint: identity?.fingerprint || "",
      user_agent: identity?.user_agent || "",
      timezone: identity?.timezone,
      screen_resolution: identity?.screen_resolution,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[log-twitter] error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
