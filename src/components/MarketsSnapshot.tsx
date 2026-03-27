/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  BarChart2,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoinPrice {
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
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
] as const;

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/*  MiniSparkline — tiny SVG sparkline for each coin card              */
/* ------------------------------------------------------------------ */

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  FearGreedGauge — semi-circle gauge                                 */
/* ------------------------------------------------------------------ */

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180 - 90; // -90 to 90
  const gaugeColor =
    clampedValue <= 25 ? "#ef4444" :
    clampedValue <= 45 ? "#f97316" :
    clampedValue <= 55 ? "#eab308" :
    clampedValue <= 75 ? "#84cc16" :
    "#22c55e";

  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="48" viewBox="0 0 80 48">
        {/* Background arc */}
        <path
          d="M 8 44 A 32 32 0 0 1 72 44"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 8 44 A 32 32 0 0 1 72 44"
          fill="none"
          stroke={gaugeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(clampedValue / 100) * 100.5} 100.5`}
        />
        {/* Needle */}
        <line
          x1="40"
          y1="44"
          x2={40 + 24 * Math.cos((angle * Math.PI) / 180)}
          y2={44 - 24 * Math.abs(Math.sin((angle * Math.PI) / 180))}
          stroke="var(--color-text-primary)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx="40" cy="44" r="3" fill="var(--color-text-primary)" />
      </svg>
      <span className="text-lg font-bold mt-1" style={{ color: gaugeColor }}>
        {clampedValue}
      </span>
      <span className="text-[11px] text-text-secondary capitalize">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function MarketsSnapshot() {
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [globals, setGlobals] = useState<MarketGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"marketCap" | "change">("marketCap");
  const t = useTranslations("marketsSnapshot");

  const fetchPrices = useCallback(async () => {
    try {
      const ids = COINS.map((c) => c.id).join(",");
      const res = await fetch(`/api/prices?coins=${ids}`);
      if (!res.ok) return;
      const data = await res.json();

      const parsed: CoinPrice[] = COINS.map((coin) => {
        const d = data[coin.id];
        // Generate a synthetic sparkline from the change for visual effect
        const sparkline: number[] = [];
        const base = d?.usd ?? 100;
        const change = d?.usd_24h_change ?? 0;
        for (let i = 0; i < 12; i++) {
          const progress = i / 11;
          const noise = (Math.sin(i * 2.5 + base * 0.01) * 0.5 + 0.5) * Math.abs(change) * 0.3;
          sparkline.push(base * (1 - (change / 100) * (1 - progress)) + noise);
        }
        return {
          symbol: coin.symbol,
          name: coin.name,
          price: d?.usd ?? 0,
          change24h: d?.usd_24h_change ?? 0,
          marketCap: d?.usd_market_cap ?? 0,
          volume24h: d?.usd_24h_vol ?? 0,
          sparkline,
        };
      }).filter((c) => c.price > 0);

      setCoins(parsed);
      setLastUpdated(new Date());

      // Compute globals
      const totalCap = parsed.reduce((s, c) => s + (c.marketCap ?? 0), 0);
      const totalVol = parsed.reduce((s, c) => s + (c.volume24h ?? 0), 0);
      const btcCoin = parsed.find((c) => c.symbol === "BTC");
      const btcDom = totalCap > 0 && btcCoin?.marketCap ? (btcCoin.marketCap / totalCap) * 100 : 0;

      // Derive Fear & Greed from market changes
      const avgChange = parsed.reduce((s, c) => s + c.change24h, 0) / (parsed.length || 1);
      const fgi = Math.max(0, Math.min(100, Math.round(50 + avgChange * 5)));
      const fgiLabel = fgi <= 25 ? "Extreme Fear" : fgi <= 45 ? "Fear" : fgi <= 55 ? "Neutral" : fgi <= 75 ? "Greed" : "Extreme Greed";

      setGlobals({
        totalMarketCap: totalCap,
        totalVolume24h: totalVol,
        btcDominance: btcDom,
        fearGreedIndex: fgi,
        fearGreedLabel: fgiLabel,
        activeCurrencies: parsed.length,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Sort coins
  const sortedCoins = useMemo(() => {
    const sorted = [...coins];
    if (sortBy === "change") {
      sorted.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    } else {
      sorted.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
    }
    return sorted;
  }, [coins, sortBy]);

  // Count gainers and losers
  const gainers = coins.filter((c) => c.change24h > 0).length;
  const losers = coins.filter((c) => c.change24h < 0).length;

  return (
    <section className="border-b border-border bg-surface-secondary">
      <div className="container-main py-6 lg:py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-serif">{t("markets")}</h2>
            {!loading && (
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {gainers}
                </span>
                <span className="text-text-tertiary">/</span>
                <span className="flex items-center gap-1 text-red-500 font-medium">
                  <TrendingDown className="h-3 w-3" />
                  {losers}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort toggle */}
            <div className="flex items-center rounded-md border border-border bg-(--color-surface) text-xs overflow-hidden">
              <button
                onClick={() => setSortBy("marketCap")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors cursor-pointer",
                  sortBy === "marketCap"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {t("marketCap")}
              </button>
              <button
                onClick={() => setSortBy("change")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors cursor-pointer",
                  sortBy === "change"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {t("topMovers")}
              </button>
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <span className="hidden lg:flex items-center gap-1 text-[11px] text-text-tertiary">
                <RefreshCw className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            <Link
              href="/markets"
              className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              {t("viewAll")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Global stats banner */}
        {globals && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
              <BarChart2 className="h-4 w-4 text-accent shrink-0" />
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{t("marketCap")}</p>
                <p className="text-sm font-bold">{formatCompact(globals.totalMarketCap)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
              <Activity className="h-4 w-4 text-accent shrink-0" />
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{t("volume24h")}</p>
                <p className="text-sm font-bold">{formatCompact(globals.totalVolume24h)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
              <Zap className="h-4 w-4 text-[#f7931a] shrink-0" />
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{t("btcDominance")}</p>
                <p className="text-sm font-bold">{globals.btcDominance.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
              <FearGreedGauge value={globals.fearGreedIndex} label={globals.fearGreedLabel} />
            </div>
          </div>
        )}

        {/* Coin cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-(--color-surface) p-3 animate-pulse"
                >
                  <div className="h-4 w-10 bg-border rounded mb-2" />
                  <div className="h-5 w-16 bg-border rounded mb-1" />
                  <div className="h-3 w-12 bg-border rounded" />
                </div>
              ))
            : sortedCoins.map((coin) => {
                const isPositive = coin.change24h >= 0;
                return (
                  <Link
                    key={coin.symbol}
                    href={`/coin/${coin.symbol.toLowerCase()}`}
                    className={cn(
                      "group rounded-lg border bg-(--color-surface) p-3 transition-all",
                      "hover:shadow-md hover:border-accent",
                      isPositive ? "border-emerald-500/20" : "border-red-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-text-primary">
                        {coin.symbol}
                      </span>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-text-primary leading-tight">
                      {formatPrice(coin.price)}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 gap-1">
                      <span
                        className={cn(
                          "text-[11px] font-mono font-semibold",
                          isPositive ? "text-emerald-500" : "text-red-500"
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {coin.change24h.toFixed(2)}%
                      </span>
                      {coin.sparkline && (
                        <MiniSparkline data={coin.sparkline} positive={isPositive} />
                      )}
                    </div>
                    {/* Volume on hover */}
                    {coin.volume24h != null && coin.volume24h > 0 && (
                      <div className="hidden group-hover:block mt-1.5 pt-1.5 border-t border-border text-[10px] text-text-tertiary">
                        Vol: {formatCompact(coin.volume24h)}
                      </div>
                    )}
                  </Link>
                );
              })}
        </div>

        {/* Data attribution */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-text-tertiary">
          <span>{t("dataAttribution")}</span>
          {lastUpdated && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" />
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
