"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Flame,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Mover {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  image?: string;
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/*  MiniBar — visual bar for volume/market cap comparison              */
/* ------------------------------------------------------------------ */

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1 w-full rounded-full bg-border overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MoverCard                                                          */
/* ------------------------------------------------------------------ */

function MoverCard({ coin, rank, maxVolume }: { coin: Mover; rank: number; maxVolume: number }) {
  const isPositive = coin.change24h >= 0;

  return (
    <Link
      href={`/coin/${coin.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 bg-(--color-surface) hover:bg-surface-secondary transition-all duration-200"
    >
      <span className={cn(
        "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
        isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
      )}>
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{coin.symbol.toUpperCase()}</span>
          <span className="text-xs text-text-tertiary truncate hidden sm:inline">
            {coin.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-secondary tabular-nums">
            {formatPrice(coin.price)}
          </span>
          {coin.volume24h && (
            <span className="text-[10px] text-text-tertiary">
              Vol {formatCompact(coin.volume24h)}
            </span>
          )}
        </div>
        {coin.volume24h && (
          <div className="mt-1">
            <MiniBar
              value={coin.volume24h}
              max={maxVolume}
              color={isPositive ? "bg-emerald-500" : "bg-red-500"}
            />
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums",
            isPositive ? "text-emerald-500" : "text-red-500"
          )}
        >
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(coin.change24h).toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  MarketMovers — Top Gainers & Losers                                */
/* ------------------------------------------------------------------ */

export default function MarketMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovers = useCallback(async () => {
    try {
      const res = await fetch("/api/market/movers?limit=10");
      if (!res.ok) {
        // Fallback: use /api/market/coins and sort
        const fallback = await fetch("/api/market/coins?type=top&limit=100");
        if (!fallback.ok) return;
        const data = await fallback.json();
        const coins = (data.coins || data || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || "",
          name: (c.name as string) || "",
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          marketCap: (c.market_cap as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
          image: (c.image as string) || "",
        }));
        const sorted = [...coins].sort(
          (a: Mover, b: Mover) => b.change24h - a.change24h
        );
        setGainers(sorted.slice(0, 10));
        setLosers(sorted.slice(-10).reverse().map((c: Mover) => ({ ...c })));
        return;
      }
      const data = await res.json();
      setGainers(
        (data.gainers || []).slice(0, 10).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || "",
          name: (c.name as string) || "",
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
        }))
      );
      setLosers(
        (data.losers || []).slice(0, 10).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || "",
          name: (c.name as string) || "",
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
        }))
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 120_000);
    return () => clearInterval(interval);
  }, [fetchMovers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMovers();
  };

  const activeList = tab === "gainers" ? gainers : losers;
  const maxVolume = useMemo(
    () => Math.max(...activeList.map((c) => c.volume24h || 0), 1),
    [activeList]
  );

  return (
    <section className="border-b border-border">
      <div className="container-main py-8 lg:py-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold font-serif">Market Movers</h2>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTab("gainers")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  tab === "gainers"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "text-text-tertiary hover:bg-surface-secondary"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                Gainers
              </button>
              <button
                onClick={() => setTab("losers")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-border",
                  tab === "losers"
                    ? "bg-red-500/10 text-red-500"
                    : "text-text-tertiary hover:bg-surface-secondary"
                )}
              >
                <TrendingDown className="h-3 w-3" />
                Losers
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
            <Link
              href="/screener"
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Full Screener
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-lg border border-border bg-(--color-surface) animate-pulse"
              />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-8 w-8 text-text-tertiary mb-3 opacity-40" />
            <p className="text-sm text-text-tertiary">
              Market data temporarily unavailable
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {activeList.slice(0, 10).map((coin, i) => (
              <MoverCard key={coin.id} coin={coin} rank={i + 1} maxVolume={maxVolume} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
