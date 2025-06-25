"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

type CryptoNewsProps = {
  symbol?: string;
};

function CryptoNews({ symbol }: CryptoNewsProps) {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget if any
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      feedMode: symbol ? "symbol" : "all_symbols",
      ...(symbol ? { symbol } : {}),
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: theme,
      locale: "en",
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  return (
    <div style={{ height: "450px" }}>
      <div className="tradingview-widget-container" ref={container} key={theme}>
        <div className="tradingview-widget-container__widget" />
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/"
            rel="noreferrer noopener nofollow"
            target="_blank"
          >
            <span className="">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(CryptoNews);
