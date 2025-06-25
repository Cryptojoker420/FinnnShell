"use client";
import { getIdentityPayload } from "@/lib/identity";

export async function logout(userId: string) {
  const identity = await getIdentityPayload();

  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, identity }),
  });

  localStorage.clear();
}
