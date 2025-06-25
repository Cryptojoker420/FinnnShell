import { Separator } from "@/components/ui/separator";
import type { UIState } from "@/lib/types";
import type { Session } from "@/lib/types";
import CryptoChart from "@/components/tradingview/crypto-chart";
import CryptoNews from "@/components/tradingview/crypto-news";
import CryptoPrice from "@/components/tradingview/crypto-price";
import MarketHeatmap from "@/components/tradingview/market-heatmap";
import CryptoScreener from "@/components/tradingview/crypto-screener";
import MarketScreener from "@/components/tradingview/market-screener";
import MarketTrending from "@/components/tradingview/market-trending";
import { TickerTape } from "@/components/tradingview/ticker-tape";
import { BotCard } from "@/components/crypto/message";
import { COMMANDS } from '@/lib/commandRegistry';

const TOOL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "crypto-chart": CryptoChart as React.ComponentType<any>,
  "crypto-news": CryptoNews as React.ComponentType<any>,
  "crypto-price": CryptoPrice as React.ComponentType<any>,
  "market-heatmap": MarketHeatmap as React.ComponentType<any>,
  "crypto-screener": CryptoScreener as React.ComponentType<any>,
  "market-screener": MarketScreener as React.ComponentType<any>,
  "market-trending": MarketTrending as React.ComponentType<any>,
  "ticker-tape": TickerTape as React.ComponentType<any>,
};

export interface ChatListProps {
  messages: UIState;
  session?: Session;
  isShared: boolean;
}

export function ChatList({ messages, session, isShared }: ChatListProps) {
  if (!messages.length) return null;

  // Precompute lastIndex of market-heatmap to skip duplicates
  const lastHeatmapIndex = [...messages]
    .map((m, i) =>
      m.content &&
      typeof m.content === "object" &&
      m.content.type === "tool" &&
      m.content.tool === "market-heatmap"
        ? i
        : -1
    )
    .filter((i) => i !== -1)
    .pop();

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => {
        // Skip extra heatmaps
        if (
          message.content?.type === "tool" &&
          message.content.tool === "market-heatmap" &&
          index !== lastHeatmapIndex
        ) {
          return null;
        }

        // Prefer display if it exists (e.g., streamed render)
        if (message.display) {
          return (
            <div key={message.id}>
              {message.display as React.ReactNode}
              {index < messages.length - 1 && <Separator className="my-4" />}
            </div>
          );
        }

        // Fallback: render known tool cards
        if (message.content?.type === "tool") {
          const { tool, symbol, id } = message.content;
          const ToolComponent = TOOL_COMPONENTS[tool];
          if (ToolComponent) {
            return (
              <div key={id || message.id}>
                <BotCard>
                  <ToolComponent symbol={symbol} />
                </BotCard>
                {index < messages.length - 1 && <Separator className="my-4" />}
              </div>
            );
          }
        }

        // Catch-all fallback
        return (
          <div key={message.id}>
            <div className="text-muted-foreground italic">[message not renderable]</div>
            {index < messages.length - 1 && <Separator className="my-4" />}
          </div>
        );
      })}
    </div>
  );
}