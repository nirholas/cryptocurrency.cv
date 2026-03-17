"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface TradingViewHeatmapProps {
  dataSource?: "Crypto" | "Stock";
  blockSize?: "market_cap_calc" | "24h_vol_cmc";
  blockColor?: "change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.Y";
  grouping?: "no_group" | "sector";
  width?: string | number;
  height?: number;
  className?: string;
  colorTheme?: "dark" | "light";
}

export default function TradingViewHeatmap({
  dataSource = "Crypto",
  blockSize = "market_cap_calc",
  blockColor = "change",
  grouping = "no_group",
  width = "100%",
  height = 500,
  className,
  colorTheme,
}: TradingViewHeatmapProps) {
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
      "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource,
      blockSize,
      blockColor,
      grouping,
      locale: "en",
      symbolUrl: "",
      colorTheme: theme,
      hasTopBar: true,
      isDataSet498: dataSource === "Crypto",
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: typeof width === "number" ? width : "100%",
      height,
    });

    widgetDiv.appendChild(script);
    container.appendChild(widgetDiv);
  }, [dataSource, blockSize, blockColor, grouping, theme, width, height]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden rounded-xl border border-border", className)}
      style={{
        width: typeof width === "number" ? width : "100%",
        height,
      }}
    />
  );
}
