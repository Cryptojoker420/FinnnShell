import type { ReactNode } from "react";

/** Core structure of user/tool/assistant messages */
export type ToolCallContent = {
  type: "tool-call";
  toolName: string;
  toolCallId: string;
  args: Record<string, any>;
};

export type ToolResultContent = {
  type: "tool-result";
  toolName: string;
  toolCallId: string;
  result: Record<string, any>;
};

export type ToolCall = {
  type: "tool-call";
  toolName: string;
  toolCallId: string;
  args: Record<string, any>;
};

export type ToolResult = {
  type: "tool-result";
  toolName: string;
  toolCallId: string;
  result: Record<string, any>;
};

export type AIMessage = {
  id: string;
  role: string;
  content: string | (ToolCall | ToolResult)[];
};

export type AIState = {
  chatId: string;
  messages: AIMessage[];
};

export type StreamContent =
  | string
  | ToolCallContent
  | ToolResultContent
  | (ToolCallContent | ToolResultContent)[];

/** Custom message object */
export type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: StreamContent;
  name?: string;
};

/** Chat metadata */
export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: Message[];
  sharePath?: string;
}

/** Async result container for server actions */
export type ServerActionResult<Result> = Promise<
  | Result
  | {
    error: string;
  }
>;

/** Basic session object */
export interface Session {
  user: {
    id: string;
    email: string;
  };
}

/** Generic auth result */
export interface AuthResult {
  type: string;
  message: string;
}

/** User database schema */
export interface User extends Record<string, any> {
  id: string;
  email: string;
  password: string;
  salt: string;
}

/** Streamed UI output format */
export type UIState = {
  id: string;
  display?: ReactNode;
  content?: any;
}[];

export interface MutableAIState<T = AIState> {
  update: (newState: T) => void;
  done: (newState: T) => void;
  get: () => T;
}
