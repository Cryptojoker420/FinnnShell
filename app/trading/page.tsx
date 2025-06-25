export const dynamic = 'force-dynamic';
import { TickerTape } from "@/components/tradingview/ticker-tape";

export default function TradingPage() {
  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">📊 Memetic Market Pulse</h1>
      <TickerTape />
    </main>
  );
}