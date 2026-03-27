/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import AdvancedChart from "@/components/AdvancedChart";
import ChartAnalysis from "@/components/ChartAnalysis";
import OrderBook from "@/components/OrderBook";
import TradingViewChart from "@/components/TradingViewChart";
import TradingViewTicker from "@/components/TradingViewTicker";
import TradingViewHeatmap from "@/components/TradingViewHeatmap";
import TradingViewMiniChart from "@/components/TradingViewMiniChart";
import {
  BarChart3,
  Signal,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Zap,
  Grid3x3,
} from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface TradingSignal {
  ticker: string;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  timeframe: "24h" | "1w" | "1m";
  reasoning: string;
  newsEvents?: string[];
  riskLevel?: "low" | "medium" | "high";
  catalysts?: string[];
}

// ---------- Coin ID → symbol map ---------------------------------------------

const COIN_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  ripple: "XRP",
  cardano: "ADA",
  dogecoin: "DOGE",
  "avalanche-2": "AVAX",
  binancecoin: "BNB",
};

// ---------- Signal helpers ---------------------------------------------------

function signalLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function signalColor(s: string): string {
  if (s === "strong_buy" || s === "buy") return "text-green-600 dark:text-green-400";
  if (s === "strong_sell" || s === "sell") return "text-red-600 dark:text-red-400";
  return "text-text-secondary";
}

function signalBg(s: string): string {
  if (s === "strong_buy" || s === "buy") return "bg-green-900/30 text-green-400";
  if (s === "strong_sell" || s === "sell") return "bg-red-900/30 text-red-400";
  return "bg-gray-800 text-gray-300";
}

function SignalIcon({ signal }: { signal: string }) {
  if (signal === "strong_buy" || signal === "buy") return <TrendingUp className="h-4 w-4" />;
  if (signal === "strong_sell" || signal === "sell") return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

function riskBadgeColor(risk: string): string {
  if (risk === "high") return "bg-red-900/30 text-red-400";
  if (risk === "medium") return "bg-yellow-900/30 text-yellow-400";
  return "bg-green-900/30 text-green-400";
}

// ---------- Component --------------------------------------------------------

export default function TradingPageClient() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [chartMode, setChartMode] = useState<"tradingview" | "lightweight">("tradingview");
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [signalsError, setSignalsError] = useState<string | null>(null);

  const orderBookSymbol = COIN_SYMBOL_MAP[coinId] || "BTC";

  // ---- Fetch signals --------------------------------------------------------

  const fetchSignals = useCallback(async () => {
    setSignalsLoading(true);
    setSignalsError(null);

    try {
      const res = await fetch("/api/signals?limit=20");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load signals");
      }

      const json = await res.json();
      const list: TradingSignal[] = json.signals || json.data?.signals || [];
      setSignals(list);
    } catch (err) {
      setSignalsError(err instanceof Error ? err.message : "Signals unavailable");
    } finally {
      setSignalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-text-primary sm:text-4xl">
          Trading &amp; Charts
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Advanced charting, AI analysis, live order book, and trading signals
        </p>
      </div>

      {/* TradingView Ticker Tape */}
      <div className="rounded-xl border border-border bg-(--color-surface) overflow-hidden">
        <TradingViewTicker />
      </div>

      {/* Chart Mode Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-secondary p-1 border border-border">
          <button
            onClick={() => setChartMode("tradingview")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              chartMode === "tradingview"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            TradingView
          </button>
          <button
            onClick={() => setChartMode("lightweight")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              chartMode === "lightweight"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Lightweight Chart
          </button>
        </div>
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
          Chart Engine
        </span>
      </div>

      {/* Main layout: Chart + Order Book sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Chart + Analysis */}
        <div className="space-y-6 min-w-0">
          {/* Chart — TradingView or Lightweight */}
          {chartMode === "tradingview" ? (
            <TradingViewChart
              initialSymbol={
                coinId === "bitcoin" ? "BINANCE:BTCUSDT" :
                coinId === "ethereum" ? "BINANCE:ETHUSDT" :
                coinId === "solana" ? "BINANCE:SOLUSDT" :
                coinId === "ripple" ? "BINANCE:XRPUSDT" :
                coinId === "cardano" ? "BINANCE:ADAUSDT" :
                coinId === "dogecoin" ? "BINANCE:DOGEUSDT" :
                coinId === "avalanche-2" ? "BINANCE:AVAXUSDT" :
                coinId === "binancecoin" ? "BINANCE:BNBUSDT" :
                "BINANCE:BTCUSDT"
              }
              height={560}
            />
          ) : (
            <AdvancedChart
              initialCoinId={coinId}
              onCoinChange={(id) => setCoinId(id)}
            />
          )}

          {/* AI Chart Analysis */}
          <section>
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-4">
              AI Chart Analysis
            </h2>
            <ChartAnalysis coinId={coinId} timeframe="1d" />
          </section>
        </div>

        {/* Right: Order Book sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <OrderBook coinId={orderBookSymbol} maxLevels={15} />
          </div>
        </aside>
      </div>

      {/* Mobile Order Book (shown below chart on small screens) */}
      <div className="lg:hidden">
        <OrderBook coinId={orderBookSymbol} maxLevels={10} />
      </div>

      {/* TradingView Mini Charts Grid */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Quick Charts
          </h2>
          <Grid3x3 className="h-5 w-5 text-accent" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TradingViewMiniChart symbol="BINANCE:BTCUSDT" height={200} dateRange="1M" />
          <TradingViewMiniChart symbol="BINANCE:ETHUSDT" height={200} dateRange="1M" />
          <TradingViewMiniChart symbol="BINANCE:SOLUSDT" height={200} dateRange="1M" />
          <TradingViewMiniChart symbol="BINANCE:XRPUSDT" height={200} dateRange="1M" />
        </div>
      </section>

      {/* TradingView Crypto Heatmap */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Crypto Heatmap
          </h2>
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <TradingViewHeatmap height={500} />
      </section>

      {/* Trading Signals Feed */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Trading Signals
          </h2>
          <Zap className="h-5 w-5 text-accent" />
        </div>

        {signalsLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-5 w-20" />
                  <Skeleton className="mb-1 h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {signalsError && (
          <div className="rounded-lg border border-border bg-surface-secondary p-6 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-text-tertiary" />
            <p className="text-sm text-text-secondary">{signalsError}</p>
          </div>
        )}

        {!signalsLoading && !signalsError && signals.length === 0 && (
          <div className="rounded-lg border border-border bg-surface-secondary p-6 text-center">
            <Signal className="mx-auto mb-2 h-6 w-6 text-text-tertiary" />
            <p className="text-sm text-text-secondary">
              No trading signals available at the moment.
            </p>
          </div>
        )}

        {!signalsLoading && signals.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map((sig, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">
                        {sig.ticker}
                      </span>
                      <Badge className={cn("text-[10px]", signalBg(sig.signal))}>
                        <SignalIcon signal={sig.signal} />
                        <span className="ml-1">{signalLabel(sig.signal)}</span>
                      </Badge>
                    </div>

                    {sig.riskLevel && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          riskBadgeColor(sig.riskLevel)
                        )}
                      >
                        {sig.riskLevel} risk
                      </span>
                    )}
                  </div>

                  {/* Confidence bar */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                      Confidence
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          sig.confidence >= 70
                            ? "bg-green-500"
                            : sig.confidence >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        )}
                        style={{ width: `${sig.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary">
                      {sig.confidence}%
                    </span>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                    {sig.reasoning}
                  </p>

                  {/* Footer: timeframe */}
                  <div className="flex items-center gap-1.5 text-text-tertiary">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider">
                      {sig.timeframe}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-3">
          <p className="text-[10px] text-text-tertiary">
            ⚠️ Trading signals are AI-generated from news analysis and are for informational
            purposes only. They do not constitute financial advice. Always do your own research
            (DYOR) before making any trading decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
