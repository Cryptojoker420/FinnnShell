import { NextResponse } from "next/server";
import type { IdentityPayload } from "./identity";

/**
 * Formats authentication API responses to a consistent schema.
 */
export function formatAuthResponse(
  data: {
    success: boolean;
    finnKey?: string;
    identity?: IdentityPayload;
    error?: string;
  },
  status: number = 200,
) {
  return NextResponse.json(data, { status });
}
