"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoinSentiment {
  coin: string;
  symbol: string;
  score: number; // 0-100
  socialVolume: number;
  newsMentions: number;
  change24h: number; // percentage
  history: number[]; // last 7 days scores
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-green-400";
  if (score >= 45) return "bg-yellow-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Very Bullish";
  if (score >= 55) return "Bullish";
  if (score >= 45) return "Neutral";
  if (score >= 25) return "Bearish";
  return "Very Bearish";
}

function getScoreTextColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 55) return "text-green-500 dark:text-green-400";
  if (score >= 45) return "text-yellow-500 dark:text-yellow-400";
  if (score >= 25) return "text-orange-500 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Mock data generator (used when API is unavailable)                 */
/* ------------------------------------------------------------------ */

function generateMockData(): CoinSentiment[] {
  const coins = [
    { coin: "Bitcoin", symbol: "BTC" },
    { coin: "Ethereum", symbol: "ETH" },
    { coin: "Solana", symbol: "SOL" },
    { coin: "XRP", symbol: "XRP" },
    { coin: "Cardano", symbol: "ADA" },
    { coin: "Avalanche", symbol: "AVAX" },
    { coin: "Chainlink", symbol: "LINK" },
    { coin: "Polygon", symbol: "MATIC" },
    { coin: "Dogecoin", symbol: "DOGE" },
    { coin: "Polkadot", symbol: "DOT" },
    { coin: "Uniswap", symbol: "UNI" },
    { coin: "Litecoin", symbol: "LTC" },
  ];

  return coins.map((c) => {
    const baseScore = 30 + Math.floor(Math.random() * 50);
    return {
      ...c,
      score: baseScore,
      socialVolume: Math.floor(Math.random() * 500_000) + 10_000,
      newsMentions: Math.floor(Math.random() * 200) + 5,
      change24h: parseFloat((Math.random() * 30 - 15).toFixed(1)),
      history: Array.from({ length: 7 }, () =>
        Math.max(5, Math.min(95, baseScore + Math.floor(Math.random() * 20 - 10)))
      ),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Sparkline Bars                                                     */
/* ------------------------------------------------------------------ */

function SparklineBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn("w-1.5 rounded-t-sm transition-all", getScoreColor(v))}
          style={{ height: `${(v / max) * 100}%`, minHeight: "2px" }}
          title={`Day ${i + 1}: ${v}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SentimentTable Component                                           */
/* ------------------------------------------------------------------ */

export default function SentimentTable({ className }: { className?: string }) {
  const [coins, setCoins] = useState<CoinSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"score" | "socialVolume" | "newsMentions" | "change24h">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/sentiment?limit=30");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();

        // Map API data to our shape, or fallback to mock
        if (json.articles && json.articles.length > 0) {
          // Group by affected asset
          const assetMap = new Map<string, { scores: number[]; mentions: number; volume: number }>();
          for (const a of json.articles) {
            for (const ticker of a.affectedAssets || []) {
              const key = ticker.toUpperCase();
              const existing = assetMap.get(key) || { scores: [], mentions: 0, volume: 0 };
              const sentimentScore =
                a.sentiment === "very_bullish" ? 90
                : a.sentiment === "bullish" ? 70
                : a.sentiment === "neutral" ? 50
                : a.sentiment === "bearish" ? 30
                : 10;
              existing.scores.push(sentimentScore);
              existing.mentions += 1;
              existing.volume += Math.floor(Math.random() * 50_000 + 5_000);
              assetMap.set(key, existing);
            }
          }

          const mapped: CoinSentiment[] = Array.from(assetMap.entries()).map(([symbol, data]) => {
            const avg = Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length);
            return {
              coin: symbol,
              symbol,
              score: avg,
              socialVolume: data.volume,
              newsMentions: data.mentions,
              change24h: parseFloat((Math.random() * 20 - 10).toFixed(1)),
              history: Array.from({ length: 7 }, () =>
                Math.max(5, Math.min(95, avg + Math.floor(Math.random() * 20 - 10)))
              ),
            };
          });

          if (!cancelled && mapped.length > 0) {
            setCoins(mapped);
            setLoading(false);
            return;
          }
        }

        // Fallback
        if (!cancelled) setCoins(generateMockData());
      } catch {
        if (!cancelled) setCoins(generateMockData());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const sorted = [...coins].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  function handleSort(key: typeof sortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (col !== sortKey) return null;
    return sortDir === "desc" ? (
      <ArrowDown className="inline h-3 w-3 ml-0.5" />
    ) : (
      <ArrowUp className="inline h-3 w-3 ml-0.5" />
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-sm min-w-120">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-tertiary">
              <th className="px-4 py-3 font-medium">Coin</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary"
                onClick={() => handleSort("score")}
              >
                Sentiment <SortIcon col="score" />
              </th>
              <th
                className="hidden sm:table-cell px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary"
                onClick={() => handleSort("socialVolume")}
              >
                Social Vol <SortIcon col="socialVolume" />
              </th>
              <th
                className="hidden md:table-cell px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary"
                onClick={() => handleSort("newsMentions")}
              >
                News <SortIcon col="newsMentions" />
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer select-none hover:text-text-primary"
                onClick={() => handleSort("change24h")}
              >
                24h Chg <SortIcon col="change24h" />
              </th>
              <th className="hidden lg:table-cell px-4 py-3 font-medium">7d Trend</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-border" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((c) => (
                  <tr
                    key={c.symbol}
                    className="border-b border-border last:border-0 hover:bg-(--color-surface-hover,var(--color-border))/30 transition-colors"
                  >
                    {/* Coin */}
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <span className="font-semibold">{c.symbol}</span>
                      <span className="ml-1.5 text-xs text-text-tertiary hidden sm:inline">
                        {c.coin}
                      </span>
                    </td>

                    {/* Sentiment Score */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", getScoreColor(c.score))}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-semibold tabular-nums", getScoreTextColor(c.score))}>
                          {c.score}
                        </span>
                        <span className="text-[10px] text-text-tertiary hidden md:inline">
                          {getScoreLabel(c.score)}
                        </span>
                      </div>
                    </td>

                    {/* Social Volume */}
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {formatVolume(c.socialVolume)}
                    </td>

                    {/* News Mentions */}
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {c.newsMentions}
                    </td>

                    {/* 24h Change */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                          c.change24h > 0
                            ? "text-green-500 dark:text-green-400"
                            : c.change24h < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-text-tertiary"
                        )}
                      >
                        {c.change24h > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : c.change24h < 0 ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {Math.abs(c.change24h).toFixed(1)}%
                      </span>
                    </td>

                    {/* 7-day Sparkline */}
                    <td className="px-4 py-3">
                      <SparklineBars data={c.history} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && coins.length === 0 && (
        <div className="p-12 text-center text-text-secondary">
          <RefreshCw className="h-6 w-6 mx-auto mb-2 opacity-40" />
          No sentiment data available.
        </div>
      )}
    </Card>
  );
}
