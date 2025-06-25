"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef } from "react";

export function TickerTape() {
  const { resolvedTheme } = useTheme(); // Always returns "light" or "dark"
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerEl = container.current;
    if (!containerEl) return;

    // Clear existing widget to prevent duplicate injection
    containerEl.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;

    // Delay script execution until DOM is fully stable
    setTimeout(() => {
      script.innerHTML = JSON.stringify({
        symbols: [
          { description: "BTC", proName: "CRYPTO:BTCUSD" },
          { description: "DOGE", proName: "CRYPTO:DOGEUSD" },
          { description: "ETH", proName: "CRYPTO:ETHUSD" },
          { description: "SHIBA", proName: "CRYPTO:SHIBUSD" },
          { description: "FLOKI", proName: "CRYPTO:FLOKIUSD" },
          { description: "WIF", proName: "CRYPTO:WIFUSD" },
          { description: "PEPE", proName: "CRYPTO:PEPEUSD" },
          { description: "WOJAK", proName: "CRYPTO:WOJAKUSD" },
        ],
        showSymbolLogo: true,
        isTransparent: false,
        displayMode: "adaptive",
        colorTheme: resolvedTheme === "dark" ? "dark" : "light",
        locale: "en",
      });

      containerEl.appendChild(script);
    }, 0); // Allow DOM to stabilize before TradingView tries to mount

    return () => {
      containerEl.innerHTML = "";
    };
  }, [resolvedTheme]);

  return (
    <div
      key={resolvedTheme} // Force full remount on theme change
      className="tradingview-widget-container mb-2 md:min-h-20 min-h-28"
      ref={container}
    >
      <div className="tradingview-widget-container__widget" />
      <div className="tradingview-widget-copyright flex justify-end mr-2">
        <a
          href="https://www.tradingview.com/"
          rel="noreferrer noopener nofollow"
          target="_blank"
          className="justify-end text-right"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}