/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  Brain,
  Target,
  ShieldAlert,
  Activity,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface CoinPrediction {
  coin: string;
  symbol: string;
  currentPrice: number;
  prediction7d: number;
  prediction30d: number;
  confidence: number; // 0-100
  direction: "up" | "down" | "neutral";
  reasoning?: string;
}

interface TradingSignal {
  ticker: string;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  timeframe: "24h" | "1w" | "1m";
  reasoning: string;
  newsEvents: string[];
  riskLevel: "low" | "medium" | "high";
  catalysts: string[];
}

interface SignalsResponse {
  signals: TradingSignal[];
  disclaimer: string;
}

interface PredictionHistory {
  date: string;
  coin: string;
  predicted: number;
  actual: number;
  accuracy: number;
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 70) return { label: "High", color: "text-green-600 dark:text-green-400" };
  if (confidence >= 40) return { label: "Medium", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Low", color: "text-red-600 dark:text-red-400" };
}

function getSignalBadge(signal: TradingSignal["signal"]): {
  label: string;
  className: string;
} {
  switch (signal) {
    case "strong_buy":
      return { label: "Strong Buy", className: "bg-green-600 text-white" };
    case "buy":
      return { label: "Buy", className: "bg-green-500/20 text-green-700 dark:text-green-300" };
    case "hold":
      return { label: "Hold", className: "bg-amber-500/20 text-amber-700 dark:text-amber-300" };
    case "sell":
      return { label: "Sell", className: "bg-red-500/20 text-red-700 dark:text-red-300" };
    case "strong_sell":
      return { label: "Strong Sell", className: "bg-red-600 text-white" };
  }
}

function getRiskBadge(risk: TradingSignal["riskLevel"]): {
  label: string;
  className: string;
} {
  switch (risk) {
    case "low":
      return { label: "Low Risk", className: "bg-green-500/10 text-green-700 dark:text-green-400" };
    case "medium":
      return { label: "Medium Risk", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
    case "high":
      return { label: "High Risk", className: "bg-red-500/10 text-red-700 dark:text-red-400" };
  }
}

// =============================================================================
// Confidence Gauge SVG
// =============================================================================

function ConfidenceGauge({ confidence }: { confidence: number }) {
  const radius = 40;
  const stroke = 8;
  const center = 50;
  const circumference = Math.PI * radius; // semi-circle
  const offset = circumference - (confidence / 100) * circumference;
  const { label, color } = getConfidenceLabel(confidence);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="60" viewBox="0 0 100 60" className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="text-lg font-bold fill-text-primary"
          fontSize="16"
        >
          {confidence}%
        </text>
      </svg>
      <span className={cn("text-xs font-semibold", color)}>{label} Confidence</span>
    </div>
  );
}

// =============================================================================
// Prediction Card (one per coin)
// =============================================================================

function PredictionCard({ prediction }: { prediction: CoinPrediction }) {
  const pct7d = ((prediction.prediction7d - prediction.currentPrice) / prediction.currentPrice) * 100;
  const pct30d = ((prediction.prediction30d - prediction.currentPrice) / prediction.currentPrice) * 100;

  const directionIcon =
    prediction.direction === "up" ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : prediction.direction === "down" ? (
      <TrendingDown className="h-5 w-5 text-red-500" />
    ) : (
      <Minus className="h-5 w-5 text-amber-500" />
    );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {directionIcon}
            <CardTitle className="text-xl">{prediction.coin}</CardTitle>
            <span className="text-xs text-text-tertiary uppercase font-mono">
              {prediction.symbol}
            </span>
          </div>
          <Brain className="h-4 w-4 text-accent opacity-60" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Current Price
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {formatPrice(prediction.currentPrice)}
          </p>
        </div>

        {/* Predictions Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-secondary p-3">
            <p className="text-xs text-text-tertiary mb-1">7-Day Prediction</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatPrice(prediction.prediction7d)}
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                pct7d >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {formatPct(pct7d)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-secondary p-3">
            <p className="text-xs text-text-tertiary mb-1">30-Day Prediction</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatPrice(prediction.prediction30d)}
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                pct30d >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {formatPct(pct30d)}
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex justify-center pt-2">
          <ConfidenceGauge confidence={prediction.confidence} />
        </div>

        {/* Reasoning */}
        {prediction.reasoning && (
          <p className="text-xs text-text-secondary leading-relaxed border-t border-border pt-3">
            {prediction.reasoning}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Prediction Cards Grid (exported)
// =============================================================================

export default function PredictionCards() {
  const [predictions, setPredictions] = useState<CoinPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "multi-forecast",
          assets: ["BTC", "ETH", "SOL"],
          horizon: "1w",
        }),
      });

      if (!res.ok) {
        setPredictions([]);
        setError(
          "Forecasts are unavailable right now. The model could not be reached.",
        );
        return;
      }

      const data = await res.json();

      if (data.forecasts) {
        const coins: CoinPrediction[] = Object.entries(
          data.forecasts as Record<string, Record<string, unknown>>
        ).map(([symbol, forecast]) => {
          const f = forecast as Record<string, unknown>;
          const pricePrediction = (f.pricePrediction as Record<string, unknown>) ?? {};
          const currentPrice = (pricePrediction.currentPrice as number) ?? 0;
          const target7d = (pricePrediction.target7d as number) ?? currentPrice;
          const target30d = (pricePrediction.target30d as number) ?? currentPrice;
          const movePct = (f.expectedMovePct as number) ?? 0;
          const confidence = (f.confidence as number) ?? 50;

          return {
            coin: getCoinName(symbol),
            symbol,
            currentPrice,
            prediction7d: target7d || currentPrice * (1 + movePct / 100),
            prediction30d: target30d || currentPrice * (1 + (movePct * 2.5) / 100),
            confidence: Math.round(confidence * 100),
            direction: movePct > 1 ? "up" : movePct < -1 ? "down" : "neutral",
            reasoning:
              (f.reasoning as string) ??
              ((f.catalysts as Array<{ event: string }>) ?? [])
                .map((c) => c.event)
                .join(". ") ??
              undefined,
          };
        });
        // A forecast with no current price carries no information: it renders
        // every figure as $0.0000. Drop it rather than print a placebo number.
        const priced = coins.filter((coin) => coin.currentPrice > 0);
        setPredictions(priced);
        if (priced.length === 0) {
          setError("No forecast could be produced for these assets right now.");
        }
      } else {
        setPredictions([]);
        setError("No forecast could be produced for these assets right now.");
      }
    } catch {
      setPredictions([]);
      setError("Forecasts are unavailable right now. The model could not be reached.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="h-16 w-16 mx-auto rounded-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={fetchPredictions}
          className="mt-3 text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Try Again
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {predictions.map((prediction) => (
          <PredictionCard key={prediction.symbol} prediction={prediction} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong>Disclaimer:</strong> Not financial advice. AI-generated predictions for educational
          purposes only. Cryptocurrency markets are highly volatile. Always do your own research (DYOR)
          before making investment decisions.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Trading Signals Component (exported)
// =============================================================================

export function TradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch("/api/signals?limit=10&min_confidence=30");
        if (!res.ok) {
          setSignals([]);
          return;
        }
        const data: SignalsResponse = await res.json();
        setSignals(data.signals ?? []);
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary">No signals clear the confidence bar right now.</p>
        <p className="text-text-tertiary text-sm mt-1">
          Signals appear when the model finds a setup it can stand behind. Check back
          after the next market move.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((signal, idx) => {
        const badge = getSignalBadge(signal.signal);
        const risk = getRiskBadge(signal.riskLevel);
        return (
          <div
            key={`${signal.ticker}-${idx}`}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-secondary transition-colors"
          >
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono font-bold text-text-primary w-12">
                {signal.ticker}
              </span>
              <span
                className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", badge.className)}
              >
                {badge.label}
              </span>
              <span
                className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", risk.className)}
              >
                {risk.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary line-clamp-1">
                {signal.reasoning}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {signal.confidence}%
              </span>
              <Badge variant="default" className="text-xs">
                {signal.timeframe}
              </Badge>
            </div>
          </div>
        );
      })}

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mt-4">
        <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong>Disclaimer:</strong> These signals are AI-generated based on news sentiment analysis.
          They are not financial advice. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Prediction History Table (exported)
// =============================================================================

export function PredictionHistoryTable() {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/predictions/history?limit=10");
        if (!res.ok) {
          setHistory([]);
          return;
        }
        const data = await res.json();
        setHistory(data.history ?? []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              {["Date", "Coin", "Predicted", "Actual", "Accuracy"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border">
                {[1, 2, 3, 4, 5].map((j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full" aria-label="Prediction history">
        <thead>
          <tr className="border-b border-border bg-surface-secondary">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Coin
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Predicted
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Actual
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center">
                <p className="text-text-secondary">No scored forecasts yet.</p>
                <p className="text-text-tertiary text-sm mt-1">
                  A forecast lands here once its horizon closes and the outcome can be
                  measured against it.
                </p>
              </td>
            </tr>
          )}
          {history.map((row, idx) => {
            const accuracyColor =
              row.accuracy >= 90
                ? "text-green-600 dark:text-green-400"
                : row.accuracy >= 70
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400";
            return (
              <tr
                key={`${row.coin}-${row.date}-${idx}`}
                className="border-b border-border hover:bg-surface-secondary transition-colors"
              >
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {row.date}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-primary">
                  {row.coin}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-text-primary">
                  {formatPrice(row.predicted)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono text-text-primary">
                  {formatPrice(row.actual)}
                </td>
                <td className={cn("px-4 py-3 text-sm text-right font-semibold", accuracyColor)}>
                  {row.accuracy.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getCoinName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
  };
  return names[symbol] ?? symbol;
}



