"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  coin: string;
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  spreadPercent: number;
  estimatedProfit: number;
  volume24h?: number;
  updatedAt?: string;
}

type SortKey =
  | "coin"
  | "buyPrice"
  | "sellPrice"
  | "spreadPercent"
  | "estimatedProfit";
type SortDir = "asc" | "desc";

const MIN_SPREAD_OPTIONS = [
  { value: 0, label: "All" },
  { value: 0.5, label: "≥ 0.5%" },
  { value: 1, label: "≥ 1%" },
  { value: 2, label: "≥ 2%" },
  { value: 5, label: "≥ 5%" },
];

function spreadColorIntensity(spread: number): string {
  if (spread >= 5) return "bg-green-500/20 text-green-400";
  if (spread >= 2) return "bg-green-500/15 text-green-500 dark:text-green-400";
  if (spread >= 1) return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (spread >= 0.5)
    return "bg-green-500/5 text-green-700 dark:text-green-300";
  return "text-[var(--color-text-secondary)]";
}

export default function ArbitrageTable() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("spreadPercent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [minSpread, setMinSpread] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/arbitrage?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch arbitrage data");
      const data = await res.json();

      const items: ArbitrageOpportunity[] = (
        data.opportunities || data.data || data || []
      ).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any, idx: number) => ({
          id: item.id || `arb-${idx}`,
          symbol: item.symbol || item.pair || "BTC/USDT",
          coin:
            item.coin ||
            item.symbol?.split("/")?.[0] ||
            item.pair?.split("/")?.[0] ||
            "BTC",
          buyExchange: item.buyExchange || item.buy_exchange || "Unknown",
          buyPrice: item.buyPrice || item.buy_price || 0,
          sellExchange: item.sellExchange || item.sell_exchange || "Unknown",
          sellPrice: item.sellPrice || item.sell_price || 0,
          spreadPercent:
            item.spreadPercent ||
            item.spread_percent ||
            item.profitPercent ||
            item.profit_percent ||
            0,
          estimatedProfit:
            item.estimatedProfit ||
            item.estimated_profit ||
            item.potentialProfit ||
            0,
          volume24h: item.volume24h || item.volume,
          updatedAt: item.updatedAt || item.timestamp,
        })
      );

      setOpportunities(items);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "coin" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const filtered = useMemo(
    () => opportunities.filter((o) => o.spreadPercent >= minSpread),
    [opportunities, minSpread]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "coin":
          return mul * a.coin.localeCompare(b.coin);
        case "buyPrice":
          return mul * (a.buyPrice - b.buyPrice);
        case "sellPrice":
          return mul * (a.sellPrice - b.sellPrice);
        case "spreadPercent":
          return mul * (a.spreadPercent - b.spreadPercent);
        case "estimatedProfit":
          return mul * (a.estimatedProfit - b.estimatedProfit);
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const topThree = useMemo(
    () =>
      [...opportunities]
        .sort((a, b) => b.spreadPercent - a.spreadPercent)
        .slice(0, 3),
    [opportunities]
  );

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column)
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-1 h-6 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-[var(--color-text-secondary)]">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Opportunities Cards */}
      {topThree.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {topThree.map((opp, idx) => (
            <div
              key={opp.id}
              className={cn(
                "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:bg-[var(--color-surface-secondary)]",
                idx === 0 && "ring-1 ring-green-500/30"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  #{idx + 1} Opportunity
                </span>
                <Badge variant="trading">{opp.coin}</Badge>
              </div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  spreadColorIntensity(opp.spreadPercent)
                )}
              >
                +{opp.spreadPercent.toFixed(2)}%
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Buy on{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {opp.buyExchange}
                </span>{" "}
                → Sell on{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {opp.sellExchange}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                Est. profit: {formatCurrency(opp.estimatedProfit)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Min Spread:
          </span>
          {MIN_SPREAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMinSpread(opt.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                minSpread === opt.value
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>
            {sorted.length} opportunit{sorted.length === 1 ? "y" : "ies"}
          </span>
          <span>·</span>
          <span>
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="rounded-md p-1 transition-colors hover:bg-[var(--color-surface-secondary)]"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm" aria-label="Arbitrage opportunities">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              {(
                [
                  { key: "coin" as SortKey, label: "Coin", cls: "" },
                  {
                    key: "buyPrice" as SortKey,
                    label: "Buy Exchange",
                    cls: "",
                  },
                  {
                    key: "buyPrice" as SortKey,
                    label: "Buy Price",
                    cls: "hidden sm:table-cell",
                  },
                  {
                    key: "sellPrice" as SortKey,
                    label: "Sell Exchange",
                    cls: "hidden md:table-cell",
                  },
                  {
                    key: "sellPrice" as SortKey,
                    label: "Sell Price",
                    cls: "hidden sm:table-cell",
                  },
                  {
                    key: "spreadPercent" as SortKey,
                    label: "Spread %",
                    cls: "",
                  },
                  {
                    key: "estimatedProfit" as SortKey,
                    label: "Est. Profit",
                    cls: "hidden lg:table-cell",
                  },
                ] as { key: SortKey; label: string; cls: string }[]
              ).map((col, i) => (
                <th
                  key={`${col.label}-${i}`}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]",
                    col.cls
                  )}
                  onClick={() => handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {col.label}
                  <SortIcon column={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-[var(--color-text-tertiary)]"
                >
                  No arbitrage opportunities matching your criteria.
                </td>
              </tr>
            ) : (
              sorted.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-secondary)]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {opp.coin}
                    <span className="ml-1 text-xs text-[var(--color-text-tertiary)]">
                      {opp.symbol}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {opp.buyExchange}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-[var(--color-text-primary)] sm:table-cell">
                    {formatCurrency(opp.buyPrice)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)] md:table-cell">
                    {opp.sellExchange}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-[var(--color-text-primary)] sm:table-cell">
                    {formatCurrency(opp.sellPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold",
                        spreadColorIntensity(opp.spreadPercent)
                      )}
                    >
                      +{opp.spreadPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-green-600 dark:text-green-400 lg:table-cell">
                    {formatCurrency(opp.estimatedProfit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Arbitrage profits are theoretical. Account for trading fees,
          withdrawal fees, transfer times, and slippage before executing any
          trades. Past spreads do not guarantee future opportunities.
        </p>
      </div>
    </div>
  );
}
