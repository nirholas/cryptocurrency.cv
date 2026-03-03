"use client";

import { useEffect, useRef, useState } from "react";

const BASE_URL = "https://cryptocurrency.cv";

export default function ChartWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [interval, setInterval] = useState("D");
  const [_height, setHeight] = useState("100%");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("symbol") || "BINANCE:BTCUSDT";
    const t = params.get("theme") || "dark";
    const i = params.get("interval") || "D";
    const h = params.get("height") || "100%";

    setSymbol(s.toUpperCase());
    setTheme(t === "light" ? "light" : "dark");
    setInterval(i);
    setHeight(h);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";
    widgetDiv.appendChild(innerDiv);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      withdateranges: true,
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);
  }, [symbol, theme, interval]);

  const bg = theme === "dark" ? "#0a0a0a" : "#ffffff";
  const fg = theme === "dark" ? "#e5e5e5" : "#171717";
  const border = theme === "dark" ? "#262626" : "#e5e7eb";
  const accent = theme === "dark" ? "#2962ff" : "#2962ff";

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: bg,
        color: fg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "6px 12px",
          borderTop: `1px solid ${border}`,
          fontSize: 10,
          color: theme === "dark" ? "#a3a3a3" : "#737373",
        }}
      >
        <span>Powered by</span>
        <a
          href={BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: accent,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Crypto Vision News
        </a>
        <span>×</span>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: accent,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          TradingView
        </a>
      </div>
    </div>
  );
}
