"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useRef, memo } from "react";

function MemeOverview() {
  const { theme = "dark" } = useTheme();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      symbolsGroups: [
        {
          name: "Meme Coins",
          originalName: "Meme Coins",
          symbols: [
            { name: "BINANCE:DOGEUSDT", displayName: "Dogecoin 🚀" },
            { name: "BINANCE:SHIBUSDT", displayName: "Shiba Inu 🐕" },
            { name: "BINANCE:FLOKIUSDT", displayName: "Floki 🪓" },
            { name: "BINANCE:WOJAKUSDT", displayName: "Wojak 😭" },
            { name: "BINANCE:PEPEUSDT", displayName: "Pepe 🐸" },
            { name: "BINANCE:SNAILUSDT", displayName: "Snail 🐌" },
            { name: "BINANCE:WIFUSDT", displayName: "dogwifhat 🧢" },
            { name: "BINANCE:MEWUSDT", displayName: "Mew 🐱" },
            { name: "BINANCE:TRUMPUSDT", displayName: "Trump 🇺🇸" },
            { name: "BINANCE:LADYSUSDT", displayName: "mILADY 👸" },
            { name: "BINANCE:BRETTUSDT", displayName: "Brett 🐸" },
            {
              name: "BINANCE:HARRYUSDT",
              displayName: "HarryPotterObamaSonic10Inu 🧙",
            },
            { name: "BINANCE:BONKUSDT", displayName: "Bonk 🦴" },
          ],
        },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      colorTheme: theme,
      locale: "en",
    });

    container.current.appendChild(script);

    return () => {
      container.current?.replaceChildren();
    };
  }, [theme]);

  return (
    <div style={{ height: "300px" }}>
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
            <span className="">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(MemeOverview);
