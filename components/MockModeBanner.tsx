"use client";

export function MockModeBanner() {
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== "true") {
    return null;
  }
  return (
    <div className="bg-yellow-200 text-yellow-900 px-4 py-2 text-center text-sm font-medium border-b border-yellow-400">
      🧪 Mock Mode Active – No GPU / LLM Loaded
    </div>
  );
}
