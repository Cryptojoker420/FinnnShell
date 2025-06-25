"use server";

import "server-only";

import {
  BotCard,
  BotMessage,
  SpinnerMessage,
} from "@/components/crypto/message";
import CryptoChart from "@/components/tradingview/crypto-chart";
import CryptoNews from "@/components/tradingview/crypto-news";
import CryptoPrice from "@/components/tradingview/crypto-price";
import ETFHeatmap from "@/components/tradingview/etf-heatmap";
import MarketHeatmap from "@/components/tradingview/market-heatmap";
import MemeOverview from "@/components/tradingview/market-overview";
import MarketScreener from "@/components/tradingview/market-screener";
import MarketTrending from "@/components/tradingview/market-trending";
import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { createAI, createStreamableValue, getMutableAIState } from "ai/rsc";
import { nanoid } from "nanoid";
import { parseToolCommand } from "@/lib/parseToolCommand";
import { AIState, MutableAIState, UIState } from "@/lib/types";
import { IdentityPayload } from "@/lib/identity";
import { z } from "zod";
import { supabase } from "@/lib/supabase-client";

const TOOL_COMPONENTS: { [key: string]: React.ComponentType<any> } = {
  'crypto-chart': CryptoChart,
  'crypto-price': CryptoPrice,
  'crypto-news': CryptoNews,
  'crypto-screener': MarketScreener, // Assuming this is the correct screener
  'market-heatmap': MarketHeatmap,
  'market-overview': MemeOverview,
  'market-trending': MarketTrending,
  'etf-heatmap': ETFHeatmap
};

const MODEL = "llama3.1-8B";
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_LLM_ENDPOINT = process.env.RUNPOD_LLM_ENDPOINT;

type ComparisonSymbolObject = {
  symbol: string;
  position: "SameScale";
};

const COMMAND_MAP: Record<string, string> = {
  chart: "crypto-chart",
  price: "crypto-price",
  news: "crypto-news",
  screener: "crypto-screener",
  heatmap: "market-heatmap",
  overview: "market-overview",
  trending: "market-trending",
  marketScreener: "market-screener",
  tape: "ticker-tape",
};

// === 🔥 Finn – direct model call ===
export async function finn({
  prompt,
  userApiKey,
  identity,
}: {
  prompt: string;
  userApiKey?: string;
  identity?: IdentityPayload;
}): Promise<string> {
  if (!RUNPOD_LLM_ENDPOINT) {
    throw new Error("RunPod endpoint missing.");
  }
  if (!RUNPOD_API_KEY) {
    throw new Error("RunPod API key missing.");
  }

  const requestBody: { input: any } = {
    input: {
      model: MODEL,
      prompt,
      ...identity,
    },
  };

  if (userApiKey) {
    requestBody.input.finn_key = userApiKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(RUNPOD_LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(errorData.message ?? "Unknown RunPod error");
    }

    const data = await response.json();
    return (
      data.text ??
      data.output ??
      data.choices?.[0]?.text ??
      data.message ??
      "[Error: No response text from Finn]"
    );
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("RunPod LLM request timed out.");
    }
    throw error;
  }
}

// === 🧠 Caption Builder ===
export async function FinnGenerateCaption(
  symbol: string,
  comparisonSymbols: ComparisonSymbolObject[],
  toolName: string,
  aiState: MutableAIState<AIState>,
  userApiKey?: string,
  identity?: IdentityPayload
): Promise<string> {
  const cryptoString = comparisonSymbols.length
    ? [symbol, ...comparisonSymbols.map((obj) => obj.symbol)].join(", ")
    : symbol;

  const captionSystemMessage = `You are a crypto market conversation bot. Keep responses BRIEF and insightful.`;

  const prompt = `Tool activated: **${toolName}** on ${cryptoString}.\n\n${captionSystemMessage}`;

  try {
    const response = await finn({ prompt, userApiKey, identity });
    return response.trim();
  } catch (error: any) {
    console.error("Caption generation failed:", error);
    throw new Error("Failed to generate caption.");
  }
}

// === ✉️ Main chat entrypoint ===
export async function submitUserMessage(
  content: string,
  userApiKey?: string,
  identity?: IdentityPayload,
  onToken?: (token: string) => void,
): Promise<{ id: string; display: React.ReactNode }> {
  const toolCmd = parseToolCommand(content);
  if (toolCmd) {
    if (toolCmd.tool === "crypto-chart") {
      return {
        id: toolCmd.id,
        display: <BotCard><CryptoChart symbol={toolCmd.symbol} /></BotCard>,
      };
    } else if (toolCmd.tool === "crypto-price") {
      return {
        id: toolCmd.id,
        display: <BotCard><CryptoPrice symbol={toolCmd.symbol ?? ""} /></BotCard>,
      };
    } else if (toolCmd.tool === "crypto-news") {
      return {
        id: toolCmd.id,
        display: <BotCard><CryptoNews /></BotCard>,
      };
    } else if (toolCmd.tool === "market-heatmap") {
      return {
        id: toolCmd.id,
        display: <BotCard><MarketHeatmap /></BotCard>,
      };
    }
    // ... add other tools as needed
  }

  const aiState = getMutableAIState() as MutableAIState<AIState>;

  const userMsg = {
    id: nanoid(),
    role: "user",
    content,
  };

  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages, userMsg],
  });

  const textStream = createStreamableValue<string>();
  let textNode: React.ReactNode = <SpinnerMessage />;
  const assistantId = nanoid();
  let full = "";

  try {
    // Direct call to RunPod API (server-side)
    const response = await finn({ 
      prompt: content, 
      userApiKey, 
      identity 
    });

    // Update the stream with the response
    full = response;
    textStream.update(full);
    if (onToken) onToken(response);

    // Mark the stream as complete
    textStream.done();

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: assistantId,
          role: "assistant",
          content: full,
        },
      ],
    });

    // Return the streamable value instead of calling .done()
    return { id: assistantId, display: <BotMessage content={textStream.value} /> };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    textStream.done();
    textNode = <div className="text-red-500">{msg}</div>;
    return { id: assistantId, display: textNode };
  }
}

export type Message = {
  content: string;
  role: "user" | "assistant" | "function";
  id: string;
};

// === 🎯 Finn Key Fetcher ===

export async function getUserFinnKey(): Promise<string | null> {
  const supabase = createServerActionClient({ cookies });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching user in getUserFinnKey:", error);
      return null;
    }

    return (user?.user_metadata?.finn_key as string) ?? null;
  } catch (err: any) {
    console.error("Unexpected error in getUserFinnKey:", err);
    return null;
  }
}

export async function saveUserFinnKey(
  finnKey: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error ?? !user) {
    return {
      success: false,
      error: error?.message ?? "User not logged in.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { finn_key: finnKey },
  });

  if (updateError) {
    console.error("Error updating finn_key:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

// Streaming tool logic for all actions
function tools(userApiKey?: string, identity?: IdentityPayload) {
  return {
    showCryptoChart: {
      description:
        "Show a crypto chart of a given cryptocurrency. Optionally show 2 or more cryptos. Use this to show the chart to the user.",
      parameters: z.object({
        symbol: z
          .string()
          .describe("The name or symbol of the crypto. e.g. DOGE/SHIB/USD."),
        comparisonSymbols: z
          .array(
            z.object({
              symbol: z.string(),
              position: z.literal("SameScale"),
            }),
          )
          .default([])
          .describe(
            'Optional list of crypto symbols to compare. e.g. ["BTC", "ETH"]',
          ),
      }),
      generate: async function* ({
        symbol,
        comparisonSymbols,
      }: {
        symbol: string;
        comparisonSymbols: ComparisonSymbolObject[];
      }) {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showCryptoChart",
                  toolCallId,
                  args: { symbol, comparisonSymbols },
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showCryptoChart",
                  toolCallId,
                  result: { symbol, comparisonSymbols },
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          symbol,
          comparisonSymbols,
          "showCryptoChart",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <CryptoChart symbol={symbol} />
            {caption}
          </BotCard>
        );
      },
    },
    showCryptoPrice: {
      description:
        "Show the price of a given cryptocurrency. Use this to show the price and price history to the user.",
      parameters: z.object({
        symbol: z
          .string()
          .describe("The name or symbol of the crypto. e.g. DOGE/BTC/ETH."),
      }),
      generate: async function* ({ symbol }: { symbol: string }) {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showCryptoPrice",
                  toolCallId,
                  args: { symbol },
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showCryptoPrice",
                  toolCallId,
                  result: { symbol },
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          symbol,
          [],
          "showCryptoPrice",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <CryptoPrice symbol={symbol} />
            {caption}
          </BotCard>
        );
      },
    },
    showCryptoNews: {
      description:
        "This tool shows the latest news and events for a cryptocurrency.",
      parameters: z.object({
        symbol: z
          .string()
          .describe("The name or symbol of the crypto. e.g. DOGE/BTC/ETH."),
      }),
      generate: async function* ({ symbol }: { symbol: string }) {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showCryptoNews",
                  toolCallId,
                  args: { symbol },
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showCryptoNews",
                  toolCallId,
                  result: { symbol },
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          symbol,
          [],
          "showCryptoNews",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <CryptoNews />
            {caption}
          </BotCard>
        );
      },
    },
    showCryptoScreener: {
      description:
        "This tool shows a generic crypto screener which can be used to find new tokens based on financial or technical parameters.",
      parameters: z.object({}),
      generate: async function* () {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showCryptoScreener",
                  toolCallId,
                  args: {},
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showCryptoScreener",
                  toolCallId,
                  result: {},
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          "Generic",
          [],
          "showCryptoScreener",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <MarketScreener />
            {caption}
          </BotCard>
        );
      },
    },
    showMarketOverview: {
      description: `This tool shows an overview of today's crypto, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.`,
      parameters: z.object({}),
      generate: async function* () {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showMarketOverview",
                  toolCallId,
                  args: {},
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showMarketOverview",
                  toolCallId,
                  result: {},
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          "Generic",
          [],
          "showMarketOverview",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <MemeOverview />
            {caption}
          </BotCard>
        );
      },
    },
    showMarketHeatmap: {
      description: `This tool shows a heatmap of today's crypto market performance across sectors. It is preferred over showMarketOverview if asked specifically about the crypto market.`,
      parameters: z.object({}),
      generate: async function* () {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showMarketHeatmap",
                  toolCallId,
                  args: {},
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showMarketHeatmap",
                  toolCallId,
                  result: {},
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          "Generic",
          [],
          "showMarketHeatmap",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <MarketHeatmap />
            {caption}
          </BotCard>
        );
      },
    },
    showETFHeatmap: {
      description: `This tool shows a heatmap of today's ETF performance across sectors and asset classes. It is preferred over showMarketOverview if asked specifically about the ETF market.`,
      parameters: z.object({}),
      generate: async function* () {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showETFHeatmap",
                  toolCallId,
                  args: {},
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showETFHeatmap",
                  toolCallId,
                  result: {},
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          "Generic",
          [],
          "showETFHeatmap",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <ETFHeatmap />
            {caption}
          </BotCard>
        );
      },
    },
    showTrendingCrypto: {
      description: `This tool shows the daily top trending cryptocurrencies including the top five gaining, losing, and most active tokens based on today's performance`,
      parameters: z.object({}),
      generate: async function* () {
        yield (
          <BotCard>
            <></>
          </BotCard>
        );
        const toolCallId = nanoid();
        const aiState = getMutableAIState<
          typeof AI
        >() as MutableAIState<AIState>;
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolName: "showTrendingCrypto",
                  toolCallId,
                  args: {},
                },
              ],
            },
            {
              id: nanoid(),
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showTrendingCrypto",
                  toolCallId,
                  result: {},
                },
              ],
            },
          ],
        });
        const caption = await FinnGenerateCaption(
          "Generic",
          [],
          "showTrendingCrypto",
          aiState,
          userApiKey,
          identity,
        );
        return (
          <BotCard>
            <MarketTrending />
            {caption}
          </BotCard>
        );
      },
    },
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
});

export type { UIState } from "@/lib/types";