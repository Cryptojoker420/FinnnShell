'use client';

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { PromptForm } from "@/components/prompt-form";
import { ButtonScrollToBottom } from "@/components/button-scroll-to-bottom";
import { FooterText } from "@/components/footer";
import { streamChatResponse } from "@/lib/chat/client";
import { UserMessage, BotMessage } from "./crypto/message";
import { parseToolCommand } from "@/lib/parseToolCommand";
import { BotCard } from "@/components/crypto/message";
import CryptoChart from "@/components/tradingview/crypto-chart";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { COMMANDS } from '@/lib/commandRegistry';

export interface ChatPanelProps {
  id?: string;
  input: string;
  setInput: (value: string) => void;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  exampleMessages: ExampleMessage[];
}

type Message = {
  id: string;
  display?: React.ReactNode;
  content?: any;
};

type ExampleMessage = {
  heading: string;
  subheading: string;
  message: string;
};

const exampleMessages: ExampleMessage[] = [
  { heading: 'Summon a live chart', subheading: 'for $DOGE', message: 'Show me a crypto chart for $DOGE' },
  { heading: 'Reveal market events', subheading: 'all markets', message: 'What are the top stories?' },
  { heading: 'Summon the crypto heat map', subheading: 'Meme volatility visualized', message: 'Show me the crypto heat map' },
  { heading: 'Show me a screener', subheading: 'for meme coins only', message: 'Show me a crypto screener for meme coins' }
];

export function ChatPanel({
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  messages,
  setMessages
}: ChatPanelProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [useMonologue, setUseMonologue] = useState(true);
  const [botText, setBotText] = useState("");
  const [randExamples, setRandExamples] = useState<ExampleMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    setRandExamples([...exampleMessages].sort(() => 0.5 - Math.random()));
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 80;
      setUserScrolledUp(!atBottom);
      setShowScrollButton(!atBottom);
    }
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, botText, userScrolledUp]);

  async function handleSubmitMessage(userText: string): Promise<void> {
    if (!userText.trim()) return;
    const toolCmd = parseToolCommand(userText);
    if (toolCmd) {
      const cmd = COMMANDS.find(c => c.name === toolCmd.tool);
      if (cmd) {
        setMessages((msgs) => [
          ...msgs,
          {
            id: nanoid(),
            display: <UserMessage>{userText}</UserMessage>,
          },
          {
            id: toolCmd.id,
            display: (
              <BotCard>
                <ErrorBoundary fallback={({ error, resetErrorBoundary }) => (
                  <div className="text-red-600 font-mono">
                    Tool error: {error.message}
                    <button onClick={resetErrorBoundary} className="ml-2 underline">Retry</button>
                  </div>
                )}>
                  {cmd.render({ symbol: toolCmd.symbol })}
                </ErrorBoundary>
              </BotCard>
            ),
          },
        ]);
        setInput("");
        setIsStreaming(false);
        setBotText("");
        return;
      }
    }
    setMessages((msgs) => [
      ...msgs,
      {
        id: nanoid(),
        display: <UserMessage>{userText}</UserMessage>,
      },
      {
        id: nanoid(),
        display: <BotMessage content="" />,
      },
    ]);
    setInput("");
    setIsStreaming(true);
    setBotText("");
    try {
      await streamChatResponse(
        userText,
        (token: string) => {
          setBotText((prev) => prev + token);
        },
        (error: string) => {
          setMessages((msgs) => [
            ...msgs,
            {
              id: nanoid(),
              display: (
                <div className="text-red-600 font-mono">
                  {error.includes("Access denied")
                    ? "⚠️ Access denied. Please verify your account."
                    : `Error: ${error}`}
                </div>
              ),
            },
          ]);
        },
        (toolMsg) => {
          setMessages((msgs) => [
            ...msgs,
            {
              id: toolMsg.id,
              content: {
                type: 'tool',
                tool: toolMsg.tool,
                symbol: toolMsg.symbol,
              },
            },
          ]);
        },
        {
          model: 'CryptoJoker69/0xFinn.exe',
          max_tokens: 420,
          temperature: 0.8,
          top_p: 0.88,
          repetition_penalty: 1.1,
          useMonologue,
        }
      );
    } catch (error) {
      setMessages((msgs) => [
        ...msgs,
        {
          id: nanoid(),
          display: (
            <div className="text-red-600 font-mono">
              An error occurred while processing your request.
            </div>
          ),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  useEffect(() => {
    if (!botText) return;
    setMessages((msgs) => {
      const updated = msgs.map((m, i) =>
        i === msgs.length - 1 && (m.display as React.ReactElement)?.type === BotMessage
          ? { ...m, display: <BotMessage content={botText} /> }
          : m
      );
      return updated;
    });
  }, [botText, setMessages]);

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 to-muted/30 dark:from-background/10 dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <div className="flex items-center justify-center py-2">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={useMonologue}
            onChange={(e) => setUseMonologue(e.target.checked)}
          />
          Use Monologue
        </label>
      </div>
      <ButtonScrollToBottom
        isAtBottom={!userScrolledUp}
        scrollToBottom={() => {
          containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth',
          });
          setUserScrolledUp(false);
          setShowScrollButton(false);
        }}
      />
      <div ref={containerRef} className="mx-auto sm:max-w-2xl sm:px-4 overflow-y-auto max-h-[60vh]">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            randExamples.map((example, index) => {
              const tool =
                example.heading === 'Summon a live chart' ? 'crypto-chart' :
                example.heading === 'Reveal market events' ? 'crypto-news' :
                example.heading === 'Summon the crypto heat map' ? 'market-heatmap' :
                example.heading === 'Show me a screener' ? 'crypto-screener' :
                null;

              const symbol =
                example.heading === 'Summon a live chart' ? 'DOGE' :
                undefined;

              if (!tool) return null;

              return (
                <div
                  key={example.heading}
                  className={`cursor-pointer border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-all duration-300 ease-in-out ${
                    index >= 2 ? 'hidden md:block' : ''
                  } ${index >= 4 ? 'hidden xl:block' : ''}`}
                  onClick={() => {
                    setMessages(msgs => [
                      ...msgs,
                      {
                        id: nanoid(),
                        content: {
                          type: 'tool',
                          tool,
                          symbol,
                        },
                      },
                    ]);
                  }}
                >
                  <div className="text-sm font-semibold">{example.heading}</div>
                  <div className="text-sm text-zinc-600">{example.subheading}</div>
                </div>
              );
            })}
        </div>
        <div className="flex h-10 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            <FooterText />
          </div>
        </div>
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            input={input}
            setInput={setInput}
            onSubmit={handleSubmitMessage}
            isLoading={isStreaming}
            examples={randExamples}
          />
        </div>
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && (
        <button
          className="fixed bottom-24 right-8 z-50 bg-primary text-white px-4 py-2 rounded shadow-lg animate-bounce"
          onClick={() => {
            containerRef.current?.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth',
            });
            setUserScrolledUp(false);
            setShowScrollButton(false);
          }}
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}