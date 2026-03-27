/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

interface TickerCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  prevPrice: number;
  change24h: number;
}

interface FearGreedData {
  value: number;
  classification: string;
}

const TICKER_COINS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
  "polkadot",
  "avalanche-2",
  "chainlink",
] as const;

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  binancecoin: "BNB",
  ripple: "XRP",
  cardano: "ADA",
  dogecoin: "DOGE",
  polkadot: "DOT",
  "avalanche-2": "AVAX",
  chainlink: "LINK",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function fearGreedColor(value: number): string {
  if (value <= 25) return "text-red-500";
  if (value <= 45) return "text-orange-500";
  if (value <= 55) return "text-yellow-500";
  if (value <= 75) return "text-lime-500";
  return "text-emerald-500";
}

function fearGreedBg(value: number): string {
  if (value <= 25) return "bg-red-500/10";
  if (value <= 45) return "bg-orange-500/10";
  if (value <= 55) return "bg-yellow-500/10";
  if (value <= 75) return "bg-lime-500/10";
  return "bg-emerald-500/10";
}

/* ------------------------------------------------------------------ */
/*  Ticker Skeleton                                                    */
/* ------------------------------------------------------------------ */

function TickerSkeleton() {
  return (
    <div className="h-[40px] overflow-hidden border-b border-border bg-(--color-surface)">
      <div className="flex h-full items-center gap-8 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-8 rounded bg-border animate-pulse" />
            <span className="h-3 w-14 rounded bg-border animate-pulse" />
            <span className="h-3 w-10 rounded bg-border animate-pulse" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Ticker Strip                                                 */
/* ------------------------------------------------------------------ */

export default function PriceTickerStrip() {
  const [coins, setCoins] = useState<TickerCoin[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const prevPricesRef = useRef<Map<string, number>>(new Map());

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`/api/prices?coins=${TICKER_COINS.join(",")}`);
      if (!res.ok) return;
      const data = await res.json();

      const prevPrices = prevPricesRef.current;
      const newFlashIds = new Set<string>();

      const parsed: TickerCoin[] = TICKER_COINS.map((id) => {
        const coin = data[id];
        const price = coin?.usd ?? 0;
        const prev = prevPrices.get(id) ?? price;

        if (prev !== price && prevPrices.size > 0) {
          newFlashIds.add(id);
        }
        prevPrices.set(id, price);

        return {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          symbol: COIN_SYMBOLS[id] || id.toUpperCase(),
          price,
          prevPrice: prev,
          change24h: coin?.usd_24h_change ?? 0,
        };
      }).filter((c) => c.price > 0);

      setCoins(parsed);
      setLoading(false);

      if (newFlashIds.size > 0) {
        setFlashIds(newFlashIds);
        setTimeout(() => setFlashIds(new Set()), 1500);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const fetchFearGreed = useCallback(async () => {
    try {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) return;
      const data = await res.json();
      if (data.current) {
        setFearGreed({
          value: data.current.value,
          classification: data.current.valueClassification,
        });
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchFearGreed();
    const priceInterval = setInterval(fetchPrices, 30_000);
    const fgInterval = setInterval(fetchFearGreed, 300_000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(fgInterval);
    };
  }, [fetchPrices, fetchFearGreed]);

  if (loading) return <TickerSkeleton />;
  if (coins.length === 0) return null;

  const tickerItems = [...coins, ...coins];

  return (
    <div
      className="h-[40px] overflow-hidden border-b border-border bg-(--color-surface)"
      role="region"
      aria-label="Live cryptocurrency prices"
      aria-live="polite"
    >
      <div className="flex h-full items-center">
        {/* Fear & Greed badge (left pinned) */}
        {fearGreed && (
          <Link
            href="/fear-greed"
            className={cn(
              "hidden md:flex items-center gap-1.5 px-3 h-full border-r border-border text-xs font-medium shrink-0 transition-colors hover:bg-surface-secondary",
              fearGreedBg(fearGreed.value),
            )}
            aria-label={`Fear and Greed Index: ${fearGreed.value} — ${fearGreed.classification}`}
          >
            <Activity className={cn("h-3.5 w-3.5", fearGreedColor(fearGreed.value))} aria-hidden="true" />
            <span className={cn("font-bold tabular-nums", fearGreedColor(fearGreed.value))}>
              {fearGreed.value}
            </span>
            <span className="text-text-tertiary hidden lg:inline">
              {fearGreed.classification}
            </span>
          </Link>
        )}

        {/* Scrolling ticker */}
        <div className="group relative flex-1 flex h-full items-center overflow-hidden">
          <div className="ticker-track flex items-center gap-8 whitespace-nowrap group-hover:[animation-play-state:paused]">
            {tickerItems.map((coin, i) => {
              const isPositive = coin.change24h >= 0;
              const isFlashing = flashIds.has(coin.id);
              const flashUp = isFlashing && coin.price > coin.prevPrice;
              const flashDown = isFlashing && coin.price < coin.prevPrice;

              return (
                <Link
                  key={`${coin.id}-${i}`}
                  href={`/coin/${coin.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-all hover:bg-surface-secondary",
                    flashUp && "ticker-flash-up",
                    flashDown && "ticker-flash-down",
                  )}
                >
                  <span className="font-semibold text-text-primary">
                    {coin.symbol}
                  </span>
                  <span className="text-text-secondary tabular-nums">
                    {formatPrice(coin.price)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums",
                      isPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span aria-hidden="true">{isPositive ? "▲" : "▼"}</span>
                    {Math.abs(coin.change24h).toFixed(2)}%
                    <span className="sr-only">
                      {coin.symbol} {formatPrice(coin.price)} {isPositive ? "up" : "down"} {Math.abs(coin.change24h).toFixed(2)} percent
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Marquee + flash animations */}
      <style jsx>{`
        .ticker-track {
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-flash-up {
          animation: flash-green 1.5s ease-out;
        }
        .ticker-flash-down {
          animation: flash-red 1.5s ease-out;
        }
        @keyframes flash-green {
          0%, 100% { background: transparent; }
          15% { background: rgba(16, 185, 129, 0.2); }
        }
        @keyframes flash-red {
          0%, 100% { background: transparent; }
          15% { background: rgba(239, 68, 68, 0.2); }
        }
      `}</style>
    </div>
  );
}
