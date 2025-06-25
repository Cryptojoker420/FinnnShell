// components/MessageDisplay.tsx
"use client";

import { BotMessage } from "@/components/crypto/message";

export default function MessageDisplay({ text }: { text: string }) {
  return <BotMessage content={text} />;
}
