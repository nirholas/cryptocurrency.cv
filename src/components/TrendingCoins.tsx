"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  price?: number;
  change24h?: number;
  marketCapRank?: number;
  thumb?: string;
  score?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

/* ------------------------------------------------------------------ */
/*  TrendingCoins — Sidebar widget showing trending crypto             */
/* ------------------------------------------------------------------ */

export default function TrendingCoins() {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/trending");
      if (!res.ok) return;
      const data = await res.json();

      // CoinGecko trending format
      const items = data.coins || data.trending || data || [];
      const parsed: TrendingCoin[] = items.slice(0, 10).map((c: Record<string, unknown>, i: number) => {
        const item = (c.item || c) as Record<string, unknown>;
        return {
          id: (item.id as string) || `coin-${i}`,
          name: (item.name as string) || "",
          symbol: (item.symbol as string) || "",
          price: (item.price as number) || ((item.data as Record<string, unknown>)?.price as number) || 0,
          change24h: (item.price_change_percentage_24h as number) ||
            (item.change24h as number) ||
            ((item.data as Record<string, unknown>)?.price_change_percentage_24h as Record<string, number>)?.usd ||
            0,
          marketCapRank: (item.market_cap_rank as number) || 0,
          thumb: (item.thumb as string) || (item.small as string) || "",
          score: (item.score as number) ?? i,
        };
      });

      setCoins(parsed.filter((c) => c.name));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchTrending]);

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)] flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <span className="w-6 h-6 rounded-full bg-[var(--color-border)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
                <div className="h-2.5 w-14 rounded bg-[var(--color-border)]" />
              </div>
              <div className="h-3 w-12 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div>
        <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)] flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending
        </h3>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Trending data unavailable
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)] flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        Trending Coins
      </h3>

      <div className="space-y-1">
        {coins.slice(0, 8).map((coin, i) => {
          const isPositive = (coin.change24h ?? 0) >= 0;

          return (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors group"
            >
              {/* Rank */}
              <span className="text-xs font-bold text-[var(--color-text-tertiary)] w-4 text-right tabular-nums">
                {i + 1}
              </span>

              {/* Coin info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">
                    {coin.symbol.toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] truncate hidden sm:inline">
                    {coin.name}
                  </span>
                </div>
                {coin.price ? (
                  <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                    {formatPrice(coin.price)}
                  </span>
                ) : null}
              </div>

              {/* Change badge */}
              {coin.change24h !== undefined && coin.change24h !== 0 ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums px-1.5 py-0.5 rounded",
                    isPositive
                      ? "text-emerald-500 bg-emerald-500/10"
                      : "text-red-500 bg-red-500/10"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(coin.change24h).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  <Search className="h-3 w-3" />
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href="/screener"
        className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-[var(--color-border)] text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
      >
        View Full Screener
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
