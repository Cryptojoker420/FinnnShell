import React from 'react';
import CryptoChart from '@/components/tradingview/crypto-chart';
import CryptoPrice from '@/components/tradingview/crypto-price';
import CryptoNews from '@/components/tradingview/crypto-news';
import CryptoScreener from '@/components/tradingview/crypto-screener';
import MarketHeatmap from '@/components/tradingview/market-heatmap';
import MarketOverview from '@/components/tradingview/market-overview';
import MarketTrending from '@/components/tradingview/market-trending';
import MarketScreener from '@/components/tradingview/market-screener';
import { TickerTape } from '@/components/tradingview/ticker-tape';

export type ToolCommand = {
  name: string;
  aliases: string[];
  requiresSymbol: boolean;
  description: string;
  render: (args: { symbol?: string }) => React.ReactNode;
};

export const COMMANDS: ToolCommand[] = [
  {
    name: 'crypto-chart',
    aliases: ['chart'],
    requiresSymbol: true,
    description: '/chart $SYMBOL — Show a crypto price chart for a symbol (e.g., /chart $BTC)',
    render: ({ symbol }) => <CryptoChart symbol={symbol} />,
  },
  {
    name: 'crypto-price',
    aliases: ['price'],
    requiresSymbol: true,
    description: '/price $SYMBOL — Show the current price for a symbol (e.g., /price $ETH)',
    render: ({ symbol }) => <CryptoPrice symbol={symbol!} />,
  },
  {
    name: 'crypto-news',
    aliases: ['news'],
    requiresSymbol: false,
    description: '/news or /news $SYMBOL — Show latest crypto news (overall or for a symbol, e.g., /news $DOGE)',
    render: ({ symbol }) => <CryptoNews symbol={symbol} />,
  },
  {
    name: 'crypto-screener',
    aliases: ['screener'],
    requiresSymbol: false,
    description: '/screener — Show a crypto market screener for meme coins',
    render: () => <CryptoScreener />,
  },
  {
    name: 'market-heatmap',
    aliases: ['heatmap'],
    requiresSymbol: false,
    description: '/heatmap — Show the crypto market heatmap',
    render: () => <MarketHeatmap />,
  },
  {
    name: 'market-overview',
    aliases: ['overview'],
    requiresSymbol: false,
    description: '/overview — Show an overview of the crypto market',
    render: () => <MarketOverview />,
  },
  {
    name: 'market-trending',
    aliases: ['trending'],
    requiresSymbol: false,
    description: '/trending — Show trending crypto assets',
    render: () => <MarketTrending />,
  },
  {
    name: 'market-screener',
    aliases: ['marketScreener'],
    requiresSymbol: false,
    description: '/marketScreener — Show a full crypto market screener',
    render: () => <MarketScreener />,
  },
  {
    name: 'ticker-tape',
    aliases: ['tape'],
    requiresSymbol: false,
    description: '/tape — Show a ticker tape of major crypto prices',
    render: () => <TickerTape />,
  }
]; 