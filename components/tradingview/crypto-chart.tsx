"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

type CryptoChartProps = {
  symbol?: string;
};

function CryptoChart({ symbol = "BINANCE:DOGEUSDT" }: CryptoChartProps) {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Render] CryptoChart', { symbol });
    }
  }, [symbol]);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing widget
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `CRYPTO:${symbol}USD`,
      interval: "D",
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  return (
    <div style={{ height: "500px" }}>
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: "100%", width: "100%" }}
        key={theme}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "calc(100% - 32px)", width: "100%" }}
        />
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noreferrer noopener nofollow"
            target="_blank"
          >
            <span className="blue-text">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CryptoChart);
