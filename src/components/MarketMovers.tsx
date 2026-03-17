'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw, Flame, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

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
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1)
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatCompact(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString('en-US')}`;
}

/* ------------------------------------------------------------------ */
/*  MoverRow — compact sidebar row                                     */
/* ------------------------------------------------------------------ */

function MoverRow({ coin, rank }: { coin: Mover; rank: number }) {
  const isPositive = coin.change24h >= 0;

  return (
    <Link
      href={`/coin/${coin.id}`}
      className="hover:bg-surface-secondary group -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
    >
      {/* Rank */}
      <span className="text-text-tertiary w-4 text-right text-xs font-bold tabular-nums">
        {rank}
      </span>

      {/* Coin info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{coin.symbol.toUpperCase()}</span>
          <span className="text-text-tertiary truncate text-xs">{formatPrice(coin.price)}</span>
        </div>
        {coin.volume24h ? (
          <span className="text-text-tertiary text-[10px]">
            Vol {formatCompact(coin.volume24h)}
          </span>
        ) : null}
      </div>

      {/* Change badge */}
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
          isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500',
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
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovers = useCallback(async () => {
    try {
      const res = await fetch('/api/market/movers?limit=10');
      if (!res.ok) {
        // Fallback: use /api/market/coins and sort
        const fallback = await fetch('/api/market/coins?type=top&limit=100');
        if (!fallback.ok) return;
        const data = await fallback.json();
        const coins = (data.coins || data || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || '',
          name: (c.name as string) || '',
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          marketCap: (c.market_cap as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
          image: (c.image as string) || '',
        }));
        const sorted = [...coins].sort((a: Mover, b: Mover) => b.change24h - a.change24h);
        setGainers(sorted.slice(0, 10));
        setLosers(
          sorted
            .slice(-10)
            .reverse()
            .map((c: Mover) => ({ ...c })),
        );
        return;
      }
      const data = await res.json();
      setGainers(
        (data.gainers || []).slice(0, 10).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || '',
          name: (c.name as string) || '',
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
        })),
      );
      setLosers(
        (data.losers || []).slice(0, 10).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          symbol: (c.symbol as string) || '',
          name: (c.name as string) || '',
          price: (c.current_price as number) || (c.price as number) || 0,
          change24h: (c.price_change_percentage_24h as number) || (c.change24h as number) || 0,
          volume24h: (c.total_volume as number) || (c.volume24h as number) || 0,
        })),
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

  const activeList = tab === 'gainers' ? gainers : losers;

  if (loading) {
    return (
      <div>
        <h3 className="border-border mb-4 flex items-center gap-2 border-b pb-2 font-serif text-base font-bold">
          <Flame className="h-4 w-4 text-orange-500" />
          Market Movers
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <span className="bg-border h-4 w-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-border h-3 w-20 rounded" />
                <div className="bg-border h-2.5 w-14 rounded" />
              </div>
              <div className="bg-border h-5 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="border-border mb-4 flex items-center justify-between border-b pb-2">
        <h3 className="flex items-center gap-2 font-serif text-base font-bold">
          <Flame className="h-4 w-4 text-orange-500" />
          Market Movers
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="hover:bg-surface-secondary text-text-tertiary cursor-pointer rounded p-1 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-border mb-3 flex overflow-hidden rounded-lg border">
        <button
          onClick={() => setTab('gainers')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            tab === 'gainers'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'text-text-tertiary hover:bg-surface-secondary',
          )}
        >
          <TrendingUp className="h-3 w-3" />
          Gainers
        </button>
        <button
          onClick={() => setTab('losers')}
          className={cn(
            'border-border flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-l px-3 py-1.5 text-xs font-medium transition-colors',
            tab === 'losers'
              ? 'bg-red-500/10 text-red-500'
              : 'text-text-tertiary hover:bg-surface-secondary',
          )}
        >
          <TrendingDown className="h-3 w-3" />
          Losers
        </button>
      </div>

      {/* List */}
      {activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="text-text-tertiary mb-2 h-6 w-6 opacity-40" />
          <p className="text-text-tertiary text-xs">Market data temporarily unavailable</p>
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
        className="border-border text-accent hover:text-accent-hover mt-4 flex items-center justify-center gap-1 border-t pt-3 text-xs font-medium transition-colors"
      >
        Full Screener
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
