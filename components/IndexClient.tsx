"use client";

import { Chat } from "@/components/chat";
import { useEffect, useState } from "react";

export default function IndexClientPage({
  missingKeys,
}: {
  missingKeys: string[];
}) {
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    const loadChatId = async () => {
      const { nanoid } = await import("nanoid");
      const cached = localStorage.getItem("chatId");
      const id = cached || nanoid();
      localStorage.setItem("chatId", id);
      setChatId(id);
    };

    loadChatId();
  }, []);

  if (!chatId) return null;

  return <Chat id={chatId} missingKeys={missingKeys} />;
}
