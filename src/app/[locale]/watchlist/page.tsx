"use client";

import { useState, useEffect, useCallback } from "react";
import { useWatchlist, type WatchlistCoin } from "@/components/watchlist";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { Trash2, ChevronUp, ChevronDown, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

// ---------------------------------------------------------------------------
// Mini Sparkline (same as MarketTable)
// ---------------------------------------------------------------------------

function MiniSparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120;
  const h = 32;

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isUp = prices[prices.length - 1] >= prices[0];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="inline-block"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WatchlistPage() {
  const { coins, removeCoin, reorderCoins } = useWatchlist();
  const [marketData, setMarketData] = useState<Record<string, CoinMarketData>>({});
  const [loading, setLoading] = useState(true);

  // Fetch market data for watchlisted coins
  const fetchMarketData = useCallback(async () => {
    if (coins.length === 0) {
      setMarketData({});
      setLoading(false);
      return;
    }

    try {
      // Fetch from /api/market/coins endpoint — top coins have the data we need
      const res = await fetch("/api/market/coins?type=top&limit=250");
      if (!res.ok) throw new Error("Failed to fetch market data");

      const data = await res.json();
      const coinsList: CoinMarketData[] = data.coins ?? [];

      // Build a lookup by coin id
      const lookup: Record<string, CoinMarketData> = {};
      for (const coin of coinsList) {
        if (coins.some((wc) => wc.id === coin.id)) {
          lookup[coin.id] = coin;
        }
      }

      setMarketData(lookup);
    } catch {
      /* silently fail — show coins without price data */
    } finally {
      setLoading(false);
    }
  }, [coins]);

  useEffect(() => {
    fetchMarketData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchMarketData, 120_000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Move a coin up or down in the list
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...coins];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    reorderCoins(next);
  };

  const moveDown = (index: number) => {
    if (index === coins.length - 1) return;
    const next = [...coins];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    reorderCoins(next);
  };

  return (
    <>
      <Header />
      <main className="container-main py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              Watchlist
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              {coins.length} coin{coins.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </div>

        {coins.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface)]">
              <Star className="h-10 w-10 text-[var(--color-text-tertiary)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
              Start tracking your favorite cryptocurrencies by adding them to
              your watchlist. Star any coin from the Markets page to get started.
            </p>
            <Link href="/markets">
              <Button variant="primary">
                <TrendingUp className="mr-2 h-4 w-4" />
                Browse Markets
              </Button>
            </Link>
          </div>
        ) : loading ? (
          /* Loading skeleton */
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Coin</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Price</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">24h %</th>
                  <th className="hidden md:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d %</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Market Cap</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Volume (24h)</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d Chart</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin) => (
                  <tr key={coin.id} className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-16" /></td>
                    <td className="hidden md:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-16" /></td>
                    <td className="hidden lg:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-24" /></td>
                    <td className="hidden lg:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-24" /></td>
                    <td className="hidden xl:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-[120px]" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Data table */
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Coin</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Price</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">24h %</th>
                  <th className="hidden md:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d %</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Market Cap</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Volume (24h)</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d Chart</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {coins.map((coin, index) => {
                  const data = marketData[coin.id];
                  const pct24 = data ? formatPercent(data.price_change_percentage_24h) : null;
                  const pct7d = data ? formatPercent(data.price_change_percentage_7d_in_currency) : null;

                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-secondary)]"
                    >
                      {/* Coin name + icon */}
                      <td className="px-4 py-3">
                        <Link href={`/coin/${coin.id}`} className="flex items-center gap-2 hover:underline">
                          {data?.image && (
                            <img
                              src={data.image}
                              alt={coin.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                              loading="lazy"
                            />
                          )}
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {coin.name}
                          </span>
                          <span className="uppercase text-[var(--color-text-tertiary)] text-xs">
                            {coin.symbol}
                          </span>
                        </Link>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right font-mono text-[var(--color-text-primary)]">
                        {data ? formatCurrency(data.current_price) : "—"}
                      </td>

                      {/* 24h % */}
                      <td className={cn("px-4 py-3 text-right font-mono", pct24?.className)}>
                        {pct24?.text ?? "—"}
                      </td>

                      {/* 7d % */}
                      <td className={cn("hidden md:table-cell px-4 py-3 text-right font-mono", pct7d?.className)}>
                        {pct7d?.text ?? "—"}
                      </td>

                      {/* Market Cap */}
                      <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                        {data ? formatLargeNumber(data.market_cap, { prefix: "$" }) : "—"}
                      </td>

                      {/* Volume */}
                      <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                        {data ? formatLargeNumber(data.total_volume, { prefix: "$" }) : "—"}
                      </td>

                      {/* Sparkline */}
                      <td className="hidden xl:table-cell px-4 py-3 text-right">
                        {data?.sparkline_in_7d?.price && (
                          <MiniSparkline prices={data.sparkline_in_7d.price} />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
                            aria-label={`Move ${coin.name} up`}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(index)}
                            disabled={index === coins.length - 1}
                            className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
                            aria-label={`Move ${coin.name} down`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCoin(coin.id)}
                            className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-[var(--color-surface)] transition-colors"
                            aria-label={`Remove ${coin.name} from watchlist`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
