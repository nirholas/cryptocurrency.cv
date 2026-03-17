"use client";

import { useState, useEffect, useCallback } from "react";
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
/*  MoverRow — compact sidebar row                                     */
/* ------------------------------------------------------------------ */

function MoverRow({ coin, rank }: { coin: Mover; rank: number }) {
  const isPositive = coin.change24h >= 0;

  return (
    <Link
      href={`/coin/${coin.id}`}
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-surface-secondary transition-colors group"
    >
      {/* Rank */}
      <span className="text-xs font-bold text-text-tertiary w-4 text-right tabular-nums">
        {rank}
      </span>

      {/* Coin info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold truncate">{coin.symbol.toUpperCase()}</span>
          <span className="text-xs text-text-tertiary truncate">
            {formatPrice(coin.price)}
          </span>
        </div>
        {coin.volume24h ? (
          <span className="text-[10px] text-text-tertiary">
            Vol {formatCompact(coin.volume24h)}
          </span>
        ) : null}
      </div>

      {/* Change badge */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums px-1.5 py-0.5 rounded shrink-0",
          isPositive
            ? "text-emerald-500 bg-emerald-500/10"
            : "text-red-500 bg-red-500/10"
        )}
      >
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(coin.change24h).toFixed(2)}%
      </span>
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

  if (loading) {
    return (
      <div>
        <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-border flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Market Movers
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <span className="w-4 h-4 rounded bg-border" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-border" />
                <div className="h-2.5 w-14 rounded bg-border" />
              </div>
              <div className="h-5 w-14 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h3 className="text-base font-bold font-serif flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Market Movers
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-surface-secondary text-text-tertiary transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-3">
        <button
          onClick={() => setTab("gainers")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-border",
            tab === "losers"
              ? "bg-red-500/10 text-red-500"
              : "text-text-tertiary hover:bg-surface-secondary"
          )}
        >
          <TrendingDown className="h-3 w-3" />
          Losers
        </button>
      </div>

      {/* List */}
      {activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="h-6 w-6 text-text-tertiary mb-2 opacity-40" />
          <p className="text-xs text-text-tertiary">
            Market data temporarily unavailable
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {activeList.slice(0, 10).map((coin, i) => (
            <MoverRow key={coin.id} coin={coin} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Footer link */}
      <Link
        href="/screener"
        className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-border text-xs font-medium text-accent hover:text-accent-hover transition-colors"
      >
        Full Screener
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
