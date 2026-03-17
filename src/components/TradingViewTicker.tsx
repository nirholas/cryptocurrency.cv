"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface TradingViewTickerProps {
  symbols?: { proName: string; title: string }[];
  className?: string;
  displayMode?: "adaptive" | "regular" | "compact";
  colorTheme?: "dark" | "light";
}

const DEFAULT_SYMBOLS = [
  { proName: "BINANCE:BTCUSDT", title: "BTC/USDT" },
  { proName: "BINANCE:ETHUSDT", title: "ETH/USDT" },
  { proName: "BINANCE:SOLUSDT", title: "SOL/USDT" },
  { proName: "BINANCE:XRPUSDT", title: "XRP/USDT" },
  { proName: "BINANCE:BNBUSDT", title: "BNB/USDT" },
  { proName: "BINANCE:DOGEUSDT", title: "DOGE/USDT" },
  { proName: "BINANCE:ADAUSDT", title: "ADA/USDT" },
  { proName: "BINANCE:AVAXUSDT", title: "AVAX/USDT" },
];

export default function TradingViewTicker({
  symbols = DEFAULT_SYMBOLS,
  className,
  displayMode = "adaptive",
  colorTheme,
}: TradingViewTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = colorTheme || (resolvedTheme === "dark" || resolvedTheme === "midnight" ? "dark" : "light");

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    widgetDiv.appendChild(innerDiv);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode,
      colorTheme: theme,
      locale: "en",
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);
  }, [symbols, theme, displayMode]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden", className)}
    />
  );
}
