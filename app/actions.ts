"use server";

import { redirect } from "next/navigation";

export async function refreshHistory(path: string) {
  redirect(path);
}

export async function getMissingKeys() {
  const keysRequired = ["RUNPOD_LLM_ENDPOINT", "FINN_KEY", "RUNPOD_API_KEY"];
  return keysRequired.filter((key) => !process.env[key]);
}
