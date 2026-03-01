/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/format";
import {
  Search,
  X,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Trophy,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
} from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  high_24h: number;
  low_24h: number;
}

interface CompareApiResponse {
  coins: CoinData[];
  summary: {
    count: number;
    avgChange24h: number;
    totalMarketCap: number;
    totalVolume24h: number;
    leader24h: string;
    laggard24h: string;
  };
  timestamp: string;
}

type SortField =
  | "price"
  | "change24h"
  | "change7d"
  | "change30d"
  | "marketCap"
  | "volume"
  | "rank"
  | "ath_pct"
  | "vol_mcap";
type SortDir = "asc" | "desc";

// ---------- Constants --------------------------------------------------------

const AVAILABLE_COINS = [
  "bitcoin", "ethereum", "solana", "binancecoin", "ripple",
  "cardano", "dogecoin", "polkadot", "avalanche-2", "chainlink",
  "tron", "litecoin", "near", "sui", "uniswap",
  "matic-network", "aptos", "arbitrum", "optimism", "celestia",
] as const;

const MAX_COMPARE = 5;

const PRESET_GROUPS = [
  { label: "Top 5", coins: ["bitcoin", "ethereum", "solana", "binancecoin", "ripple"] },
  { label: "Layer 1s", coins: ["ethereum", "solana", "avalanche-2", "cardano", "near"] },
  { label: "Layer 2s", coins: ["matic-network", "arbitrum", "optimism"] },
  { label: "DeFi", coins: ["uniswap", "chainlink", "avalanche-2"] },
  { label: "Meme", coins: ["dogecoin", "bitcoin", "solana"] },
  { label: "New Wave", coins: ["sui", "celestia", "aptos", "arbitrum"] },
] as const;

interface MetricDefinition {
  key: string;
  label: string;
  getValue: (c: CoinData) => number | null;
  format: (v: number) => string;
  higherIsBetter: boolean;
  sortKey?: SortField;
  description?: string;
}

const METRICS: MetricDefinition[] = [
  {
    key: "rank",
    label: "Market Cap Rank",
    getValue: (c) => c.market_cap_rank,
    format: (v) => `#${v}`,
    higherIsBetter: false,
    sortKey: "rank",
    description: "Position by total market capitalization",
  },
  {
    key: "price",
    label: "Price",
    getValue: (c) => c.current_price,
    format: (v) => formatCurrency(v),
    higherIsBetter: true,
    sortKey: "price",
  },
  {
    key: "change24h",
    label: "24h Change",
    getValue: (c) => c.price_change_percentage_24h,
    format: (v) => formatPercent(v).text,
    higherIsBetter: true,
    sortKey: "change24h",
  },
  {
    key: "change7d",
    label: "7d Change",
    getValue: (c) => c.price_change_percentage_7d_in_currency ?? null,
    format: (v) => formatPercent(v).text,
    higherIsBetter: true,
    sortKey: "change7d",
  },
  {
    key: "change30d",
    label: "30d Change",
    getValue: (c) => c.price_change_percentage_30d_in_currency ?? null,
    format: (v) => formatPercent(v).text,
    higherIsBetter: true,
    sortKey: "change30d",
  },
  {
    key: "marketCap",
    label: "Market Cap",
    getValue: (c) => c.market_cap,
    format: (v) => formatLargeNumber(v),
    higherIsBetter: true,
    sortKey: "marketCap",
  },
  {
    key: "volume",
    label: "24h Volume",
    getValue: (c) => c.total_volume,
    format: (v) => formatLargeNumber(v),
    higherIsBetter: true,
    sortKey: "volume",
  },
  {
    key: "vol_mcap",
    label: "Vol / MCap Ratio",
    getValue: (c) => (c.market_cap > 0 ? c.total_volume / c.market_cap : null),
    format: (v) => `${(v * 100).toFixed(2)}%`,
    higherIsBetter: true,
    sortKey: "vol_mcap",
    description: "Higher ratio = more trading activity relative to size",
  },
  {
    key: "supply",
    label: "Circulating Supply",
    getValue: (c) => c.circulating_supply,
    format: (v) => formatLargeNumber(v),
    higherIsBetter: false,
  },
  {
    key: "maxSupply",
    label: "Max Supply",
    getValue: (c) => c.max_supply,
    format: (v) => (v ? formatLargeNumber(v) : "∞"),
    higherIsBetter: false,
  },
  {
    key: "supplyRatio",
    label: "Supply Minted %",
    getValue: (c) =>
      c.max_supply && c.max_supply > 0
        ? (c.circulating_supply / c.max_supply) * 100
        : null,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: false,
  },
  {
    key: "high24h",
    label: "24h High",
    getValue: (c) => c.high_24h,
    format: (v) => formatCurrency(v),
    higherIsBetter: true,
  },
  {
    key: "low24h",
    label: "24h Low",
    getValue: (c) => c.low_24h,
    format: (v) => formatCurrency(v),
    higherIsBetter: false,
  },
  {
    key: "ath",
    label: "All-Time High",
    getValue: (c) => c.ath,
    format: (v) => formatCurrency(v),
    higherIsBetter: true,
  },
  {
    key: "ath_pct",
    label: "% from ATH",
    getValue: (c) => c.ath_change_percentage,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
    sortKey: "ath_pct",
    description: "How far the price is from its all-time high",
  },
];

// ---------- Component --------------------------------------------------------

export default function CoinCompare() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [selectedCoins, setSelectedCoins] = useState<string[]>(() => {
    const fromUrl = searchParams.get("coins");
    if (fromUrl) return fromUrl.split(",").filter(Boolean).slice(0, MAX_COMPARE);
    return ["bitcoin", "ethereum", "solana"];
  });
  const [data, setData] = useState<CompareApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [copied, setCopied] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  // Fetch data
  const fetchData = useCallback(
    async (silent = false) => {
      if (selectedCoins.length === 0) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/compare?coins=${selectedCoins.join(",")}`);
        if (!res.ok) throw new Error("Failed to fetch comparison data");
        const json = (await res.json()) as CompareApiResponse;
        setData(json);
      } catch {
        if (!silent) setError("Unable to load comparison data.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedCoins],
  );

  // Update URL
  useEffect(() => {
    const currentUrl = searchParams.get("coins") ?? "";
    const newUrl = selectedCoins.join(",");
    if (currentUrl !== newUrl) {
      router.replace(`?coins=${newUrl}`, { scroll: false });
    }
  }, [selectedCoins, searchParams, router]);

  // Fetch on coin change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sorted coins
  const sortedCoins = useMemo(() => {
    if (!data?.coins) return [];
    const coins = [...data.coins];
    const metric = METRICS.find((m) => m.sortKey === sortField);
    if (metric) {
      coins.sort((a, b) => {
        const va = metric.getValue(a) ?? -Infinity;
        const vb = metric.getValue(b) ?? -Infinity;
        return sortDir === "asc" ? va - vb : vb - va;
      });
    }
    return coins;
  }, [data, sortField, sortDir]);

  // Winners per metric
  const winners = useMemo(() => {
    if (!data?.coins || data.coins.length < 2) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const metric of METRICS) {
      let bestId = "";
      let bestVal = metric.higherIsBetter ? -Infinity : Infinity;
      for (const coin of data.coins) {
        const v = metric.getValue(coin);
        if (v === null) continue;
        if (metric.key === "rank") {
          // Lower rank is better
          if (v < bestVal) { bestVal = v; bestId = coin.id; }
        } else if (metric.higherIsBetter) {
          if (v > bestVal) { bestVal = v; bestId = coin.id; }
        } else {
          if (v < bestVal) { bestVal = v; bestId = coin.id; }
        }
      }
      if (bestId) map.set(metric.key, bestId);
    }
    return map;
  }, [data]);

  // Market dominance
  const dominanceData = useMemo(() => {
    if (!data?.coins) return [];
    const totalMcap = data.coins.reduce((s, c) => s + c.market_cap, 0);
    if (totalMcap === 0) return [];
    return data.coins.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      pct: (c.market_cap / totalMcap) * 100,
    }));
  }, [data]);

  // Handlers
  const addCoin = (coinId: string) => {
    if (selectedCoins.length >= MAX_COMPARE || selectedCoins.includes(coinId)) return;
    setSelectedCoins([...selectedCoins, coinId]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const removeCoin = (coinId: string) => {
    if (selectedCoins.length <= 2) return;
    setSelectedCoins(selectedCoins.filter((c) => c !== coinId));
  };

  const applyPreset = (coins: readonly string[]) => {
    setSelectedCoins([...coins].slice(0, MAX_COMPARE));
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?coins=${selectedCoins.join(",")}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSearch = AVAILABLE_COINS.filter(
    (c) =>
      !selectedCoins.includes(c) &&
      c.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const visibleMetrics = expandedMetrics ? METRICS : METRICS.slice(0, 8);

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Coin Selector */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Select Coins ({selectedCoins.length}/{MAX_COMPARE})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className={cn(
                "p-1.5 rounded-lg border border-[var(--color-border)]",
                "hover:bg-[var(--color-surface-secondary)] transition-colors",
              )}
              aria-label="Copy share URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              )}
            </button>
            <button
              onClick={() => fetchData(true)}
              className={cn(
                "p-1.5 rounded-lg border border-[var(--color-border)]",
                "hover:bg-[var(--color-surface-secondary)] transition-colors",
              )}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </button>
          </div>
        </div>

        {/* Selected chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCoins.map((coinId) => {
            const coinInfo = data?.coins.find((c) => c.id === coinId);
            return (
              <span
                key={coinId}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                  "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
                  "text-sm font-medium",
                )}
              >
                {coinInfo?.image && (
                  <img
                    src={coinInfo.image}
                    alt=""
                    className="h-4 w-4 rounded-full"
                    loading="lazy"
                  />
                )}
                {coinInfo?.symbol.toUpperCase() ?? coinId}
                {selectedCoins.length > 2 && (
                  <button
                    onClick={() => removeCoin(coinId)}
                    className="hover:text-red-500 transition-colors"
                    aria-label={`Remove ${coinId}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            );
          })}
          {selectedCoins.length < MAX_COMPARE && (
            <button
              onClick={() => setShowSearch(true)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full",
                "border border-dashed border-[var(--color-border)]",
                "text-sm text-[var(--color-text-tertiary)]",
                "hover:bg-[var(--color-surface-secondary)] transition-colors",
              )}
            >
              + Add Coin
            </button>
          )}
        </div>

        {/* Search box */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSearch(false);
                    setSearchQuery("");
                  }
                }}
                placeholder="Search coins..."
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)]",
                  "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                  "placeholder:text-[var(--color-text-tertiary)]",
                )}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto">
              {filteredSearch.map((coinId) => (
                <button
                  key={coinId}
                  onClick={() => addCoin(coinId)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm",
                    "border border-[var(--color-border)] bg-[var(--color-surface)]",
                    "hover:bg-[var(--color-surface-secondary)] transition-colors",
                    "text-[var(--color-text-secondary)]",
                  )}
                >
                  {coinId}
                </button>
              ))}
              {filteredSearch.length === 0 && (
                <p className="text-sm text-[var(--color-text-tertiary)] py-2">
                  No matching coins
                </p>
              )}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_GROUPS.map((g) => (
            <Button
              key={g.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(g.coins)}
              className="text-xs"
            >
              <Layers className="h-3 w-3 mr-1" />
              {g.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Loading / Error */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6 text-center">
          <p className="text-[var(--color-text-secondary)] mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </Card>
      )}

      {/* Comparison Table */}
      {!loading && !error && data && data.coins.length >= 2 && (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <th className="sticky left-0 z-10 bg-[var(--color-surface-secondary)] px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      Metric
                    </th>
                    {sortedCoins.map((coin) => (
                      <th
                        key={coin.id}
                        className="px-4 py-3 text-center min-w-[120px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {coin.image && (
                            <img
                              src={coin.image}
                              alt=""
                              className="h-5 w-5 rounded-full"
                              loading="lazy"
                            />
                          )}
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {coin.symbol.toUpperCase()}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {visibleMetrics.map((metric) => (
                    <tr
                      key={metric.key}
                      className="hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {metric.sortKey ? (
                            <button
                              onClick={() => toggleSort(metric.sortKey!)}
                              className="flex items-center gap-1 hover:text-[var(--color-accent)] transition-colors"
                            >
                              <span className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
                                {metric.label}
                              </span>
                              {sortField === metric.sortKey && (
                                sortDir === "asc" ? (
                                  <ChevronUp className="h-3 w-3 text-[var(--color-accent)]" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-[var(--color-accent)]" />
                                )
                              )}
                              {sortField !== metric.sortKey && (
                                <ArrowUpDown className="h-3 w-3 text-[var(--color-text-tertiary)] opacity-50" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
                              {metric.label}
                            </span>
                          )}
                        </div>
                      </td>
                      {sortedCoins.map((coin) => {
                        const value = metric.getValue(coin);
                        const isWinner = winners.get(metric.key) === coin.id;
                        const isChangeMetric = metric.key.startsWith("change") || metric.key === "ath_pct";
                        return (
                          <td
                            key={coin.id}
                            className={cn(
                              "px-4 py-3 text-center font-medium whitespace-nowrap",
                              isWinner && "bg-[var(--color-accent)]/5",
                            )}
                          >
                            <span
                              className={cn(
                                isWinner && "text-[var(--color-accent)] font-bold",
                                !isWinner && "text-[var(--color-text-primary)]",
                                isChangeMetric && value !== null && value > 0 && !isWinner && "text-green-500 dark:text-green-400",
                                isChangeMetric && value !== null && value < 0 && !isWinner && "text-red-500 dark:text-red-400",
                              )}
                            >
                              {value !== null ? metric.format(value) : "—"}
                              {isWinner && data.coins.length > 2 && (
                                <Trophy className="inline-block h-3 w-3 ml-1 text-[var(--color-accent)]" />
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {METRICS.length > 8 && (
              <div className="px-4 py-3 border-t border-[var(--color-border)] text-center">
                <button
                  onClick={() => setExpandedMetrics(!expandedMetrics)}
                  className="text-sm text-[var(--color-accent)] font-medium hover:underline"
                >
                  {expandedMetrics
                    ? `Show fewer metrics ↑`
                    : `Show all ${METRICS.length} metrics ↓`}
                </button>
              </div>
            )}
          </Card>

          {/* Market Dominance Bar */}
          {dominanceData.length >= 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">
                  Relative Market Dominance
                </h2>
              </div>
              <div className="w-full h-8 rounded-full overflow-hidden flex">
                {dominanceData.map((coin, i) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                  ];
                  return (
                    <div
                      key={coin.id}
                      className={cn(
                        "h-full flex items-center justify-center text-white text-xs font-bold transition-all",
                        colors[i % colors.length],
                      )}
                      style={{ width: `${Math.max(coin.pct, 3)}%` }}
                      title={`${coin.symbol}: ${coin.pct.toFixed(1)}%`}
                    >
                      {coin.pct > 8 ? `${coin.symbol} ${coin.pct.toFixed(0)}%` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {dominanceData.map((coin, i) => {
                  const dotColors = [
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                  ];
                  return (
                    <span
                      key={coin.id}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"
                    >
                      <span
                        className={cn("w-2.5 h-2.5 rounded-full", dotColors[i % dotColors.length])}
                      />
                      {coin.symbol}: {coin.pct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Summary Card */}
          {data.summary && (
            <Card className="p-5">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
                Comparison Summary
              </h2>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <SummaryCell
                    label="Coins Compared"
                    value={data.summary.count.toString()}
                  />
                  <SummaryCell
                    label="Avg. 24h Change"
                    value={`${data.summary.avgChange24h > 0 ? "+" : ""}${data.summary.avgChange24h.toFixed(2)}%`}
                    color={
                      data.summary.avgChange24h > 0
                        ? "text-green-500"
                        : data.summary.avgChange24h < 0
                          ? "text-red-500"
                          : undefined
                    }
                  />
                  <SummaryCell
                    label="Total Market Cap"
                    value={formatLargeNumber(data.summary.totalMarketCap)}
                  />
                  <SummaryCell
                    label="24h Leader"
                    value={data.summary.leader24h}
                    icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                  />
                  <SummaryCell
                    label="24h Laggard"
                    value={data.summary.laggard24h}
                    icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Card */}
          {data.coins.length >= 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-[var(--color-text-primary)]">
                  Winner Scorecard
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.coins.map((coin) => {
                  const wins = Array.from(winners.values()).filter(
                    (id) => id === coin.id,
                  ).length;
                  return (
                    <div
                      key={coin.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        wins > 0
                          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5"
                          : "border-[var(--color-border)]",
                      )}
                    >
                      {coin.image && (
                        <img
                          src={coin.image}
                          alt=""
                          className="h-5 w-5 rounded-full"
                          loading="lazy"
                        />
                      )}
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {coin.symbol.toUpperCase()}
                      </span>
                      <Badge
                        className={cn(
                          "text-xs",
                          wins > 0 && "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
                        )}
                      >
                        {wins}{" "}
                        {wins === 1 ? "win" : "wins"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {!loading && !error && data && data.coins.length < 2 && (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-text-secondary)]">
            Select at least 2 coins to compare.
          </p>
        </Card>
      )}
    </div>
  );
}

// ---------- Sub-components ---------------------------------------------------

function SummaryCell({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className={cn("text-lg font-bold", color ?? "text-[var(--color-text-primary)]")}>
          {value}
        </p>
      </div>
    </div>
  );
}
