"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

function CryptoMarketScreener() {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any previous widget
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      colorTheme: theme,
      locale: "en",
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [theme]);

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

export default memo(CryptoMarketScreener);
