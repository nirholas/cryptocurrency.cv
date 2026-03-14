"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookOpen, RefreshCw } from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface OrderLevel {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookData {
  bids: OrderLevel[];
  asks: OrderLevel[];
  spread?: number;
  spreadPercent?: number;
  symbol?: string;
  timestamp?: number;
}

// ---------- Helpers ----------------------------------------------------------

function formatPrice(n: number): string {
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toPrecision(4);
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(4);
}

// ---------- Component --------------------------------------------------------

export default function OrderBook({
  coinId = "BTC",
  maxLevels = 15,
}: {
  coinId?: string;
  maxLevels?: number;
}) {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const symbol = coinId.toUpperCase().replace(/COIN$/i, "");

  // ---- Fetch order book -----------------------------------------------------

  const fetchOrderBook = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/orderbook?symbol=${encodeURIComponent(symbol)}&view=aggregated`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load order book");
      }

      const json = await res.json();

      // Normalize the response
      const rawBids: Array<Record<string, number>> = json.bids || json.data?.bids || [];
      const rawAsks: Array<Record<string, number>> = json.asks || json.data?.asks || [];

      const normalizeLevels = (
        list: Array<Record<string, number> | number[]>
      ): OrderLevel[] => {
        let cumTotal = 0;
        return list.slice(0, maxLevels).map((entry) => {
          let price: number, amount: number;
          if (Array.isArray(entry)) {
            price = entry[0];
            amount = entry[1];
          } else {
            price = entry.price ?? entry.p ?? 0;
            amount = entry.amount ?? entry.quantity ?? entry.q ?? entry.size ?? 0;
          }
          cumTotal += amount;
          return { price, amount, total: cumTotal };
        });
      };

      const bids = normalizeLevels(rawBids);
      const asks = normalizeLevels(rawAsks);

      const spread =
        asks.length > 0 && bids.length > 0
          ? asks[0].price - bids[0].price
          : json.spread ?? 0;

      const midPrice =
        asks.length > 0 && bids.length > 0
          ? (asks[0].price + bids[0].price) / 2
          : 0;

      setData({
        bids,
        asks,
        spread: json.spread ?? spread,
        spreadPercent: json.spreadPercent ?? (midPrice > 0 ? (spread / midPrice) * 100 : 0),
        symbol: json.symbol ?? symbol,
        timestamp: json.timestamp ?? Date.now(),
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order book unavailable");
    } finally {
      setLoading(false);
    }
  }, [symbol, maxLevels]);

  // ---- Auto-refresh every 5 seconds -----------------------------------------

  useEffect(() => {
    fetchOrderBook();
    intervalRef.current = setInterval(fetchOrderBook, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrderBook]);

  // ---- Compute max total for bar widths -------------------------------------

  const maxBidTotal = data?.bids.reduce((max, l) => Math.max(max, l.total), 0) ?? 1;
  const maxAskTotal = data?.asks.reduce((max, l) => Math.max(max, l.total), 0) ?? 1;

  // ---- Render ---------------------------------------------------------------

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-accent" />
            Order Book
            <span className="text-xs font-normal text-text-tertiary">
              {symbol}/USD
            </span>
          </CardTitle>
          <button
            onClick={fetchOrderBook}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Spread */}
        {data && typeof data.spread === "number" && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-tertiary">Spread:</span>
            <span className="text-xs font-medium text-text-primary">
              ${formatPrice(data.spread)}
            </span>
            {typeof data.spreadPercent === "number" && (
              <span className="text-[10px] text-text-tertiary">
                ({data.spreadPercent.toFixed(3)}%)
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !data && (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-3 gap-1 px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
              <span>Price</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Total</span>
            </div>

            {/* Asks (reversed so lowest ask is at bottom, closest to spread) */}
            <div className="space-y-px">
              {[...data.asks].reverse().map((level, i) => {
                const barWidth = (level.total / maxAskTotal) * 100;
                return (
                  <div
                    key={`ask-${i}`}
                    className="relative grid grid-cols-3 gap-1 rounded px-1 py-0.5 text-xs"
                  >
                    {/* Background bar - right aligned */}
                    <div
                      className="absolute inset-y-0 right-0 rounded bg-red-500/10 dark:bg-red-500/15 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 font-mono text-red-600 dark:text-red-400">
                      {formatPrice(level.price)}
                    </span>
                    <span className="relative z-10 text-center font-mono text-text-secondary">
                      {formatAmount(level.amount)}
                    </span>
                    <span className="relative z-10 text-right font-mono text-text-tertiary">
                      {formatAmount(level.total)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Spread divider */}
            <div className="my-1 flex items-center justify-center gap-2 border-y border-border py-1">
              <span className="text-[10px] font-medium text-text-tertiary">
                SPREAD
              </span>
              {typeof data.spread === "number" && (
                <span className="text-xs font-bold text-text-primary">
                  ${formatPrice(data.spread)}
                </span>
              )}
            </div>

            {/* Bids */}
            <div className="space-y-px">
              {data.bids.map((level, i) => {
                const barWidth = (level.total / maxBidTotal) * 100;
                return (
                  <div
                    key={`bid-${i}`}
                    className="relative grid grid-cols-3 gap-1 rounded px-1 py-0.5 text-xs"
                  >
                    {/* Background bar - left aligned */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-green-500/10 dark:bg-green-500/15 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 font-mono text-green-600 dark:text-green-400">
                      {formatPrice(level.price)}
                    </span>
                    <span className="relative z-10 text-center font-mono text-text-secondary">
                      {formatAmount(level.amount)}
                    </span>
                    <span className="relative z-10 text-right font-mono text-text-tertiary">
                      {formatAmount(level.total)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Last update */}
            {lastUpdate && (
              <div className="mt-2 text-center text-[10px] text-text-tertiary">
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
