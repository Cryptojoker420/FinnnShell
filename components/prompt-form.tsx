"use client";

import * as React from "react";
import Textarea from "react-textarea-autosize";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import InputPredict from 'react-inline-predict';

import { useActions, useUIState } from "ai/rsc";
import { UserMessage } from "./crypto/message";
import { type AI } from "@/lib/chat/actions";
import { Button } from "@/components/ui/button";
import { IconArrowDown, IconPlus } from "@/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { IdentityPayload } from "@/lib/identity";
import { COMMANDS, ToolCommand } from '@/lib/commandRegistry';

export function PromptForm({
  input,
  setInput,
  finnKey,
  identity,
  disabled,
  isLoading,
  examples,
  onSubmit,
}: {
  input: string;
  setInput: (value: string) => void;
  finnKey?: string;
  identity?: IdentityPayload;
  disabled?: boolean;
  isLoading?: boolean;
  examples?: { heading: string; subheading: string; message: string }[];
  onSubmit?: (input: string) => void | Promise<void>;
}) {
  const router = useRouter();
  const { formRef } = useEnterSubmit();
  const { submitUserMessage } = useActions();
  const [_, setMessages] = useUIState<typeof AI>();

  const placeholderText = disabled
    ? finnKey === null
      ? "Please enter your FINN_KEY to chat."
      : "Loading access key..."
    : "Send a message.";

  const handleSubmit = async () => {
    if (disabled || !input.trim()) return;
    const value = input.trim();
    setInput("");
    if (onSubmit) {
      await onSubmit(value);
      return;
    }
    setMessages((msgs) => [
      ...msgs,
      {
        id: nanoid(),
        display: <UserMessage>{value}</UserMessage>,
      },
    ]);
    try {
      const responseMessage = await submitUserMessage(value, finnKey, identity);
      setMessages((msgs) => [...msgs, responseMessage]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          id: nanoid(),
          display: (
            <div className="text-red-600 font-mono">
              Error: Failed to send message. Please try again.
            </div>
          ),
        },
      ]);
    }
  };

  return (
    <form ref={formRef as React.RefObject<HTMLFormElement>} onSubmit={(e) => e.preventDefault()}>
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => router.push("/")}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <div className="relative w-full">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholderText}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm pl-10 relative z-10"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            name="message"
            rows={1}
            disabled={disabled}
            style={{ background: 'transparent', color: 'inherit' }}
          />
        </div>
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={input === "" || disabled}
                onClick={handleSubmit}
              >
                <div className="rotate-180">
                  <IconArrowDown />
                </div>
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  );
}