'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useUIState, useAIState } from 'ai/rsc';
import { ChatList } from '@/components/chat-list';
import { ChatPanel } from '@/components/chat-panel';
import { EmptyScreen } from '@/components/empty-screen';
import { MissingApiKeyBanner } from '@/components/missing-api-key-banner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorDisplay } from '@/components/ui/error-display';
import type { Session } from '@/lib/types';
import { useSession } from '@/lib/hooks/useSession';
import { useIdentity } from '@/lib/hooks/useIdentity';
import { getUserFinnKey } from '@/lib/chat/actions';
import CryptoChart from "@/components/tradingview/crypto-chart";
import CryptoNews from "@/components/tradingview/crypto-news";
import MarketHeatmap from "@/components/tradingview/market-heatmap";
import CryptoScreener from "@/components/tradingview/crypto-screener";

interface ChatProps extends React.ComponentProps<'div'> {
  id?: string;
  session?: Session;
  className?: string;
  missingKeys: string[];
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter();
  const path = usePathname();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useUIState();
  const [aiState] = useAIState();
  const [_, setNewChatId] = useLocalStorage('newChatId', id);
  const { session: currentSession } = useSession();
  const { identity } = useIdentity();
  const [finnKey, setFinnKey] = useState<string | null>(null);
  const [loadingFinnKey, setLoadingFinnKey] = useState(true);

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor();

  useEffect(() => {
    if (session?.user) {
      if (!path.includes('chat') && messages.length === 1) {
        window.history.replaceState({}, '', `/chat/${id}`);
      }
    }
  }, [id, path, session?.user, messages]);

  useEffect(() => {
    if (aiState.messages?.length === 2) {
      router.refresh();
    }
  }, [aiState.messages, router]);

  useEffect(() => {
    setNewChatId(id);
  }, [id, setNewChatId]);

  useEffect(() => {
    missingKeys.forEach((key) => {
      toast.error(`Missing ${key} environment variable!`);
    });
  }, [missingKeys]);

  useEffect(() => {
    async function loadFinnKey() {
      if (currentSession?.user) {
        try {
          const key = await getUserFinnKey();
          setFinnKey(key);
        } catch (error) {
          console.error('Failed to load FINN_KEY:', error);
        } finally {
          setLoadingFinnKey(false);
        }
      }
    }
    loadFinnKey();
  }, [currentSession?.user]);

  const exampleMessages = [
    { heading: "Summon a live chart", subheading: "for $DOGE", message: "Show me a stock chart for $DOGE" },
    { heading: "Reveal market events", subheading: "all markets", message: "What are the top stories?" },
    { heading: "Summon the crypto heat map", subheading: "Meme volatility visualized", message: "Show me the crypto heat map" },
    { heading: "Show me a screener", subheading: "for meme coins only", message: "Show me a crypto screener for meme coins" },
  ];

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      {messages.length ? (
        <MissingApiKeyBanner missingKeys={missingKeys} />
      ) : null}

      <div
        className={cn(
          messages.length ? 'pb-[200px] pt-4 md:pt-6' : 'pb-[200px] pt-0',
          className
        )}
        ref={messagesRef}
      >
        {messages.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>

      <ErrorBoundary
        fallback={({
          error,
          resetErrorBoundary,
        }: {
          error: Error;
          resetErrorBoundary: () => void;
        }) => (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setInput('');
              resetErrorBoundary();
            }}
          />
        )}
      >
        <ChatPanel
          id={id}
          input={input}
          setInput={setInput}
          messages={messages}
          setMessages={setMessages}
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
          exampleMessages={exampleMessages}
        />
      </ErrorBoundary>
    </div>
  );
}