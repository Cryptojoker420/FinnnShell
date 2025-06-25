// ai.server.ts
"use server";

import { submitUserMessage } from "@/lib/chat/actions";
import type { AIState, UIState } from "@/lib/types";
import { createAI } from "ai/rsc";
import { nanoid } from "@/lib/utils";

// 🔁 Static chat session (used in layout, shared across all users)
const staticChatId = `statix-${Math.random().toString(36).slice(2, 8)}`;

// ✅ Static export for persistent usage in <AI> provider (e.g., _app or layout)
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialAIState: {
    chatId: staticChatId,
    messages: [],
  },
  initialUIState: [],
});

// ✅ Optional dynamic export if you want per-session AI (used inside handlers or per-user flows)
export async function initAI() {
  const chatId = await nanoid();

  const ai = createAI<AIState, UIState>({
    actions: {
      submitUserMessage,
    },
    initialAIState: {
      chatId,
      messages: [],
    },
    initialUIState: [],
  });

  return ai;
}
