/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  sparkline?: number[];
}

interface MarketGlobal {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  activeCurrencies: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
] as const;

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000)
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1)
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString("en-US")}`;
}

function getFearGreedColor(index: number): string {
  if (index <= 25) return "text-red-500";
  if (index <= 45) return "text-orange-500";
  if (index <= 55) return "text-yellow-500";
  if (index <= 75) return "text-green-500";
  return "text-emerald-500";
}

function getFearGreedBg(index: number): string {
  if (index <= 25) return "from-red-500/10 to-red-500/5";
  if (index <= 45) return "from-orange-500/10 to-orange-500/5";
  if (index <= 55) return "from-yellow-500/10 to-yellow-500/5";
  if (index <= 75) return "from-green-500/10 to-green-500/5";
  return "from-emerald-500/10 to-emerald-500/5";
}

/* ------------------------------------------------------------------ */
/*  MiniSparkline                                                      */
/* ------------------------------------------------------------------ */

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  LiveDashboard                                                      */
/* ------------------------------------------------------------------ */

export default function LiveDashboard() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [global, setGlobal] = useState<MarketGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const ids = COINS.map((c) => c.id).join(",");
      const [priceRes, globalRes] = await Promise.allSettled([
        fetch(`/api/prices?coins=${ids}`).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/market/global").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (priceRes.status === "fulfilled" && priceRes.value) {
        const d = priceRes.value;
        const parsed: CoinData[] = COINS.map((c) => {
          const p = d[c.id] || d[c.symbol.toLowerCase()] || {};
          return {
            symbol: c.symbol,
            name: c.name,
            price: p.usd ?? p.price ?? 0,
            change24h: p.usd_24h_change ?? p.change24h ?? p.percent_change_24h ?? 0,
            marketCap: p.usd_market_cap ?? p.market_cap ?? 0,
            volume24h: p.usd_24h_vol ?? p.volume ?? 0,
            sparkline: p.sparkline_in_7d?.price ?? p.sparkline ?? [],
          };
        }).filter((c) => c.price > 0);
        setCoins(parsed);
      }

      if (globalRes.status === "fulfilled" && globalRes.value) {
        const g = globalRes.value;
        const gd = g.data || g;
        setGlobal({
          totalMarketCap: gd.total_market_cap?.usd ?? gd.totalMarketCap ?? 0,
          totalVolume24h: gd.total_volume?.usd ?? gd.totalVolume24h ?? 0,
          btcDominance: gd.market_cap_percentage?.btc ?? gd.btcDominance ?? 0,
          fearGreedIndex: gd.fear_greed_index ?? gd.fearGreedIndex ?? 50,
          fearGreedLabel: gd.fear_greed_label ?? gd.fearGreedLabel ?? "Neutral",
          activeCurrencies: gd.active_cryptocurrencies ?? gd.activeCurrencies ?? 0,
        });
      }

      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <section className="border-border border-b">
        <div className="container-main py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-border animate-pulse rounded-xl border bg-gradient-to-br from-white/50 to-white/0 p-5 dark:from-white/5 dark:to-white/0"
              >
                <div className="bg-border mb-3 h-4 w-20 rounded" />
                <div className="bg-border mb-2 h-7 w-28 rounded" />
                <div className="bg-border h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-border border-b">
      <div className="container-main py-6 lg:py-8">
        {/* Global Stats Bar */}
        {global && (
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Globe className="text-text-secondary h-4 w-4" />
              <span className="text-text-secondary text-xs">Market Cap</span>
              <span className="text-text-primary text-sm font-semibold">
                {formatCompact(global.totalMarketCap)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="text-text-secondary h-4 w-4" />
              <span className="text-text-secondary text-xs">24h Vol</span>
              <span className="text-text-primary text-sm font-semibold">
                {formatCompact(global.totalVolume24h)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-xs">BTC Dom</span>
              <span className="text-text-primary text-sm font-semibold">
                {global.btcDominance.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-xs">Fear & Greed</span>
              <span className={cn("text-sm font-bold", getFearGreedColor(global.fearGreedIndex))}>
                {global.fearGreedIndex}
              </span>
              <span className="text-text-tertiary text-xs">{global.fearGreedLabel}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {lastUpdated && (
                <span className="text-text-tertiary text-[10px]">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchData}
                className="text-text-tertiary hover:text-accent rounded p-1 transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Coin Price Cards + Fear & Greed */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Fear & Greed Card */}
          {global && (
            <Link
              href="/fear-greed"
              className={cn(
                "group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md",
                "border-border bg-gradient-to-br",
                getFearGreedBg(global.fearGreedIndex),
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Zap className={cn("h-4 w-4", getFearGreedColor(global.fearGreedIndex))} />
                <span className="text-text-secondary text-xs font-medium">Fear & Greed</span>
              </div>
              <div className={cn("text-3xl font-bold", getFearGreedColor(global.fearGreedIndex))}>
                {global.fearGreedIndex}
              </div>
              <div className="text-text-secondary mt-1 text-sm">{global.fearGreedLabel}</div>
              {/* Gauge bar */}
              <div className="bg-border mt-3 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    global.fearGreedIndex <= 25
                      ? "bg-red-500"
                      : global.fearGreedIndex <= 45
                        ? "bg-orange-500"
                        : global.fearGreedIndex <= 55
                          ? "bg-yellow-500"
                          : global.fearGreedIndex <= 75
                            ? "bg-green-500"
                            : "bg-emerald-500",
                  )}
                  style={{ width: `${global.fearGreedIndex}%` }}
                />
              </div>
            </Link>
          )}

          {/* Coin Cards */}
          {coins.slice(0, global ? 3 : 4).map((coin) => (
            <Link
              key={coin.symbol}
              href={`/coin/${coin.symbol.toLowerCase()}`}
              className="border-border group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white/50 to-white/0 p-5 transition-all hover:shadow-md dark:from-white/5 dark:to-white/0"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-text-secondary text-xs font-medium">{coin.name}</span>
                <span className="text-text-tertiary text-[10px] font-medium">{coin.symbol}</span>
              </div>
              <div className="text-text-primary text-xl font-bold">{formatPrice(coin.price)}</div>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    coin.change24h >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                  )}
                >
                  {coin.change24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {coin.change24h >= 0 ? "+" : ""}
                  {coin.change24h.toFixed(2)}%
                </span>
                {coin.sparkline && coin.sparkline.length > 1 && (
                  <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Secondary row — more coins */}
        {coins.length > 3 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {coins.slice(global ? 3 : 4).map((coin) => (
              <Link
                key={coin.symbol}
                href={`/coin/${coin.symbol.toLowerCase()}`}
                className="border-border flex items-center justify-between rounded-lg border px-4 py-3 transition-all hover:shadow-sm"
              >
                <div>
                  <span className="text-text-primary text-sm font-semibold">{coin.symbol}</span>
                  <div className="text-text-primary text-sm">{formatPrice(coin.price)}</div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    coin.change24h >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {coin.change24h >= 0 ? "+" : ""}
                  {coin.change24h.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
