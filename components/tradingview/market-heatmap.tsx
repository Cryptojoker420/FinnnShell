"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null); // ✅ Typed

  useEffect(() => {
    if (!container.current) return;

    // Clean up previous widget if any
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "dataSource": "Crypto",
        "blockSize": "market_cap_calc",
        "blockColor": "24h_close_change|5",
        "locale": "en",
        "symbolUrl": "",
        "colorTheme": "${theme}",
        "hasTopBar": true,
        "isDataSetEnabled": true,
        "isZoomEnabled": true,
        "hasSymbolTooltip": true,
        "isMonoSize": false,
        "width": "100%",
        "height": "100%"
      }`;
    container.current.appendChild(script);

    // Cleanup on unmount or theme change
    return () => {
      if (container.current) container.current.innerHTML = "";
    };
  }, [theme]);

  return (
    <div className="tradingview-widget-container" ref={container} key={theme}>
      <div className="tradingview-widget-container__widget" />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);