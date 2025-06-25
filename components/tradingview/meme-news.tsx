"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

export function MemeNews() {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: "market",
      isTransparent: false,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: theme,
      locale: "en",
      market: "crypto",
    });

    container.current.appendChild(script);

    return () => {
      container.current?.replaceChildren();
    };
  }, [theme]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container" ref={container} key={theme}>
        <div className="tradingview-widget-container__widget" />
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

export default memo(MemeNews);
