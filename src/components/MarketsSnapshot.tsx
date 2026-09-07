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
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  /** Real 7-day close series from the market endpoint, downsampled for the tile. */
  sparkline?: number[];
}

interface MarketGlobal {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
}

interface FearGreed {
  value: number;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** How many coins the snapshot strip shows, ranked by market cap. */
const COIN_COUNT = 8;

/** Points kept from the 7-day series when drawing a tile-sized sparkline. */
const SPARKLINE_POINTS = 24;

/* ------------------------------------------------------------------ */
/*  Upstream shapes                                                    */
/* ------------------------------------------------------------------ */

/** The CoinGecko-shaped rows `/api/market/coins?type=top` returns. */
interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  total_volume?: number;
  sparkline_in_7d?: { price?: number[] };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Parse a response body, or null when the request did not answer cleanly. */
async function readJson(res: Response): Promise<unknown | null> {
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Reduce the 7-day hourly series to the handful of points a 60x20 sparkline
 * can actually show. Returns undefined when there is no series, so the tile
 * renders without a chart rather than with an invented one.
 */
function downsample(series: number[] | undefined): number[] | undefined {
  if (!series || series.length < 2) return undefined;
  if (series.length <= SPARKLINE_POINTS) return series;
  const step = (series.length - 1) / (SPARKLINE_POINTS - 1);
  return Array.from({ length: SPARKLINE_POINTS }, (_, i) => series[Math.round(i * step)]);
}

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
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"marketCap" | "change">("marketCap");
  const t = useTranslations("marketsSnapshot");

  const fetchMarket = useCallback(async () => {
    // Three independent reads: a coin strip, the global aggregates, and the
    // sentiment index. Each renders on its own, so a slow or failing one never
    // blanks the others, and none of them is ever substituted with a
    // placeholder number.
    const [coinsResult, globalResult, fearGreedResult] = await Promise.allSettled([
      fetch(`/api/market/coins?type=top&limit=${COIN_COUNT}`).then(readJson),
      fetch("/api/v1/global").then(readJson),
      fetch("/api/fear-greed").then(readJson),
    ]);

    if (coinsResult.status === "fulfilled" && coinsResult.value) {
      const raw = (coinsResult.value as { coins?: MarketCoin[] }).coins ?? [];
      const parsed = raw
        .map((coin) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price ?? 0,
          change24h: coin.price_change_percentage_24h ?? 0,
          marketCap: coin.market_cap ?? undefined,
          volume24h: coin.total_volume ?? undefined,
          sparkline: downsample(coin.sparkline_in_7d?.price),
        }))
        .filter((coin) => coin.price > 0);

      if (parsed.length > 0) {
        setCoins(parsed);
        setLastUpdated(new Date());
      }
    }

    if (globalResult.status === "fulfilled" && globalResult.value) {
      const data = (globalResult.value as { data?: Record<string, number> }).data;
      // Total market cap is the one field the banner cannot be drawn without;
      // an aggregate of zero is a missing upstream field, never a real market.
      if (data && data.totalMarketCap > 0) {
        setGlobals({
          totalMarketCap: data.totalMarketCap,
          totalVolume24h: data.totalVolume24h,
          btcDominance: data.btcDominance,
        });
      }
    }

    if (fearGreedResult.status === "fulfilled" && fearGreedResult.value) {
      const current = (fearGreedResult.value as {
        current?: { value?: number; valueClassification?: string };
      }).current;
      if (typeof current?.value === "number") {
        setFearGreed({
          value: current.value,
          label: current.valueClassification ?? "",
        });
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 30_000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchMarket]);

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

        {/* Global stats banner: only drawn from data that actually arrived */}
        {(globals || fearGreed) && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {globals && (
              <>
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
              </>
            )}
            {fearGreed && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
                <FearGreedGauge value={fearGreed.value} label={fearGreed.label} />
              </div>
            )}
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
                    key={coin.id}
                    href={`/coin/${coin.id}`}
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
