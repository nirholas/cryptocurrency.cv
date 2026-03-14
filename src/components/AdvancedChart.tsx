"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType, type CandlestickData, type LineData, type HistogramData, type Time, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui";
import { CandlestickChart, LineChart as LineChartIcon, ChevronDown } from "lucide-react";

// ---------- Types ------------------------------------------------------------

type ChartType = "candlestick" | "line";

interface OHLCCandle {
  0: number; // timestamp
  1: number; // open
  2: number; // high
  3: number; // low
  4: number; // close
}

const COINS = [
  { id: "bitcoin", label: "Bitcoin (BTC)" },
  { id: "ethereum", label: "Ethereum (ETH)" },
  { id: "solana", label: "Solana (SOL)" },
  { id: "ripple", label: "XRP (XRP)" },
  { id: "cardano", label: "Cardano (ADA)" },
  { id: "dogecoin", label: "Dogecoin (DOGE)" },
  { id: "avalanche-2", label: "Avalanche (AVAX)" },
  { id: "binancecoin", label: "BNB (BNB)" },
] as const;

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 1825 },
] as const;

// ---------- Theme helpers ----------------------------------------------------

function getLightTheme() {
  return {
    layout: {
      background: { type: ColorType.Solid as const, color: "#ffffff" },
      textColor: "#0f172a",
    },
    grid: {
      vertLines: { color: "#e2e8f0" },
      horzLines: { color: "#e2e8f0" },
    },
    crosshair: {
      vertLine: { color: "#94a3b8", width: 1 as const, style: 3 as const },
      horzLine: { color: "#94a3b8", width: 1 as const, style: 3 as const },
    },
    rightPriceScale: {
      borderColor: "#e2e8f0",
    },
    timeScale: {
      borderColor: "#e2e8f0",
    },
  };
}

function getDarkTheme() {
  return {
    layout: {
      background: { type: ColorType.Solid as const, color: "#0a0a0a" },
      textColor: "#f5f5f5",
    },
    grid: {
      vertLines: { color: "#262626" },
      horzLines: { color: "#262626" },
    },
    crosshair: {
      vertLine: { color: "#737373", width: 1 as const, style: 3 as const },
      horzLine: { color: "#737373", width: 1 as const, style: 3 as const },
    },
    rightPriceScale: {
      borderColor: "#262626",
    },
    timeScale: {
      borderColor: "#262626",
    },
  };
}

function getMidnightTheme() {
  return {
    layout: {
      background: { type: ColorType.Solid as const, color: "#0d1117" },
      textColor: "#c9d1d9",
    },
    grid: {
      vertLines: { color: "#21262d" },
      horzLines: { color: "#21262d" },
    },
    crosshair: {
      vertLine: { color: "#6e7681", width: 1 as const, style: 3 as const },
      horzLine: { color: "#6e7681", width: 1 as const, style: 3 as const },
    },
    rightPriceScale: {
      borderColor: "#30363d",
    },
    timeScale: {
      borderColor: "#30363d",
    },
  };
}

// ---------- Component --------------------------------------------------------

export default function AdvancedChart({
  initialCoinId = "bitcoin",
  onCoinChange,
}: {
  initialCoinId?: string;
  onCoinChange?: (coinId: string) => void;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const [coinId, setCoinId] = useState(initialCoinId);
  const [days, setDays] = useState(30);
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || resolvedTheme === "midnight";

  // ---- Create chart ---------------------------------------------------------

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const theme = resolvedTheme === "midnight" ? getMidnightTheme() : isDark ? getDarkTheme() : getLightTheme();

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      ...theme,
      timeScale: {
        ...theme.timeScale,
        timeVisible: days <= 7,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Update theme ---------------------------------------------------------

  useEffect(() => {
    if (!chartRef.current) return;
    const theme = isDark ? getDarkTheme() : getLightTheme();
    chartRef.current.applyOptions(theme);
  }, [isDark]);

  // ---- Fetch & render data --------------------------------------------------

  const fetchAndRender = useCallback(async () => {
    if (!chartRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/ohlc?coinId=${encodeURIComponent(coinId)}&days=${days}`
      );
      if (!res.ok) throw new Error("Failed to load chart data");
      const json = await res.json();
      const candles: OHLCCandle[] = Array.isArray(json) ? json : json.data ?? [];

      if (candles.length === 0) {
        setError("No data available");
        setLoading(false);
        return;
      }

      const chart = chartRef.current;

      // Remove existing series
      if (candleSeriesRef.current) {
        chart.removeSeries(candleSeriesRef.current);
        candleSeriesRef.current = null;
      }
      if (lineSeriesRef.current) {
        chart.removeSeries(lineSeriesRef.current);
        lineSeriesRef.current = null;
      }
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      // Prepare data
      const sortedCandles = [...candles].sort((a, b) => a[0] - b[0]);

      if (chartType === "candlestick") {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderDownColor: "#ef4444",
          borderUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          wickUpColor: "#22c55e",
        });

        const candleData: CandlestickData[] = sortedCandles.map((c) => ({
          time: (Math.floor(c[0] / 1000)) as Time,
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
        }));

        candleSeries.setData(candleData);
        candleSeriesRef.current = candleSeries;
      } else {
        const lineSeries = chart.addSeries(LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
        });

        const lineData: LineData[] = sortedCandles.map((c) => ({
          time: (Math.floor(c[0] / 1000)) as Time,
          value: c[4], // close price
        }));

        lineSeries.setData(lineData);
        lineSeriesRef.current = lineSeries;
      }

      // Volume bars
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const volumeData: HistogramData[] = sortedCandles.map((c) => {
        const isBullish = c[4] >= c[1];
        return {
          time: (Math.floor(c[0] / 1000)) as Time,
          value: Math.abs(c[4] - c[1]) * 1000, // simulated volume from price range
          color: isBullish ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        };
      });

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;

      // Update time scale
      chart.applyOptions({
        timeScale: {
          timeVisible: days <= 7,
          secondsVisible: false,
        },
      });

      chart.timeScale().fitContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chart error");
    } finally {
      setLoading(false);
    }
  }, [coinId, days, chartType]);

  useEffect(() => {
    fetchAndRender();
  }, [fetchAndRender]);

  // ---- Coin change handler --------------------------------------------------

  const handleCoinChange = (id: string) => {
    setCoinId(id);
    setCoinDropdownOpen(false);
    onCoinChange?.(id);
  };

  const selectedCoin = COINS.find((c) => c.id === coinId) ?? COINS[0];

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="rounded-xl border border-border bg-(--color-surface) overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        {/* Coin selector */}
        <div className="relative">
          <button
            onClick={() => setCoinDropdownOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
              "text-sm font-medium text-text-primary",
              "hover:border-border-hover transition-colors",
              "bg-surface-secondary"
            )}
          >
            {selectedCoin.label}
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </button>

          {coinDropdownOpen && (
            <div
              className={cn(
                "absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border border-border",
                "bg-(--color-surface) shadow-lg overflow-hidden"
              )}
            >
              {COINS.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleCoinChange(coin.id)}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm",
                    "hover:bg-surface-secondary transition-colors",
                    coin.id === coinId
                      ? "text-accent font-medium"
                      : "text-text-primary"
                  )}
                >
                  {coin.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chart type toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-surface-secondary p-0.5">
          <button
            onClick={() => setChartType("candlestick")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              chartType === "candlestick"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            )}
            title="Candlestick"
          >
            <CandlestickChart className="h-3.5 w-3.5" />
            Candles
          </button>
          <button
            onClick={() => setChartType("line")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              chartType === "line"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            )}
            title="Line"
          >
            <LineChartIcon className="h-3.5 w-3.5" />
            Line
          </button>
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setDays(range.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                days === range.days
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: "70vh" }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--color-surface)/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-text-secondary">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={fetchAndRender}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
