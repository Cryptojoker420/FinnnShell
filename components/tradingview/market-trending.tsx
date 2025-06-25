"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

export function MarketTrending() {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "BINANCE:DOGEUSDT", title: "Dogecoin 🚀" },
        { proName: "BINANCE:SHIBUSDT", title: "Shiba Inu 🐕" },
        { proName: "BINANCE:FLOKIUSDT", title: "Floki 🪓" },
        { proName: "BINANCE:WOJAKUSDT", title: "Wojak 😭" },
        { proName: "BINANCE:PEPEUSDT", title: "Pepe 🐸" },
        { proName: "BINANCE:SNAILUSDT", title: "Snail 🐌" },
        { proName: "BINANCE:WIFUSDT", title: "dogwifhat 🧢" },
        { proName: "BINANCE:MEWUSDT", title: "Mew 🐱" },
        { proName: "BINANCE:TRUMPUSDT", title: "Trump 🇺🇸" },
        { proName: "BINANCE:LADYSUSDT", title: "MILADY 👸" },
        { proName: "BINANCE:BRETTUSDT", title: "Brett 🐸" },
        {
          proName: "BINANCE:HARRYUSDT",
          title: "HarryPotterObamaSonic10Inu 🧙",
        },
        { proName: "BINANCE:BONKUSDT", title: "Bonk 🦴" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: theme,
      locale: "en",
    });

    container.current.appendChild(script);

    return () => {
      container.current?.replaceChildren();
    };
  }, [theme]);

  return (
    <div style={{ height: "500px" }}>
      <div
        className="tradingview-widget-container"
        ref={container}
        key={theme}
        style={{ height: "100%", width: "100%" }}
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
            <span className="">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(MarketTrending);
