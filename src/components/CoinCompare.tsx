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
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/format";
import { Plus, X, Search } from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: {
    current: number;
    high24h: number;
    low24h: number;
    ath: number;
    athChange: string;
  };
  changes: {
    "1h": string;
    "24h": string;
    "7d": string;
  };
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  supply: {
    circulating: number;
    total: number | null;
  };
}

interface CompareResponse {
  coins: CoinData[];
  summary: {
    count: number;
    avgChange24h: string;
    totalMarketCap: number;
    totalVolume24h: number;
    leader24h: string;
    laggard24h: string;
  };
  timestamp: string;
}

// ---------- Constants --------------------------------------------------------

const AVAILABLE_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "tron", name: "TRON", symbol: "TRX" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR" },
  { id: "sui", name: "Sui", symbol: "SUI" },
  { id: "aptos", name: "Aptos", symbol: "APT" },
  { id: "render-token", name: "Render", symbol: "RNDR" },
  { id: "injective-protocol", name: "Injective", symbol: "INJ" },
  { id: "the-graph", name: "The Graph", symbol: "GRT" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
] as const;

const MAX_COINS = 4;

const METRICS: {
  key: string;
  label: string;
  format: (coin: CoinData) => string;
  rawValue: (coin: CoinData) => number;
  isPercent?: boolean;
}[] = [
  {
    key: "price",
    label: "Price",
    format: (c) => formatCurrency(c.price.current),
    rawValue: (c) => c.price.current,
  },
  {
    key: "marketCap",
    label: "Market Cap",
    format: (c) => formatLargeNumber(c.marketCap, { prefix: "$" }),
    rawValue: (c) => c.marketCap,
  },
  {
    key: "volume",
    label: "24h Volume",
    format: (c) => formatLargeNumber(c.volume24h, { prefix: "$" }),
    rawValue: (c) => c.volume24h,
  },
  {
    key: "supply",
    label: "Circulating Supply",
    format: (c) =>
      `${formatLargeNumber(c.supply.circulating)} ${c.symbol}`,
    rawValue: (c) => c.supply.circulating,
  },
  {
    key: "change24h",
    label: "24h Change",
    format: (c) => formatPercent(parseFloat(c.changes["24h"])).text,
    rawValue: (c) => parseFloat(c.changes["24h"]) || 0,
    isPercent: true,
  },
  {
    key: "change7d",
    label: "7d Change",
    format: (c) => formatPercent(parseFloat(c.changes["7d"])).text,
    rawValue: (c) => parseFloat(c.changes["7d"]) || 0,
    isPercent: true,
  },
  {
    key: "ath",
    label: "All-Time High",
    format: (c) => formatCurrency(c.price.ath),
    rawValue: (c) => c.price.ath,
  },
  {
    key: "athChange",
    label: "From ATH",
    format: (c) => `${c.price.athChange}%`,
    rawValue: (c) => parseFloat(c.price.athChange) || 0,
    isPercent: true,
  },
];

// ---------- Coin Selector ----------------------------------------------------

function CoinSelector({
  selectedIds,
  onAdd,
}: {
  selectedIds: string[];
  onAdd: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      AVAILABLE_COINS.filter(
        (c) =>
          !selectedIds.includes(c.id) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, selectedIds]
  );

  if (selectedIds.length >= MAX_COINS) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1"
      >
        <Plus className="h-4 w-4" /> Add Coin
      </Button>

      {open && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 z-50 w-60",
            "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
            "shadow-lg overflow-hidden"
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
            <Search className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search coins…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-sm text-[var(--color-text-primary)]",
                "outline-none placeholder:text-[var(--color-text-tertiary)]"
              )}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">
                No coins found
              </p>
            ) : (
              filtered.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => {
                    onAdd(coin.id);
                    setSearch("");
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm flex items-center justify-between",
                    "hover:bg-[var(--color-surface-secondary)] transition-colors"
                  )}
                >
                  <span className="text-[var(--color-text-primary)]">
                    {coin.name}
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">
                    {coin.symbol}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Component --------------------------------------------------------

export default function CoinCompare() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCoins = useMemo(() => {
    const param = searchParams.get("coins");
    if (param) {
      return param
        .split(",")
        .filter((id) => AVAILABLE_COINS.some((c) => c.id === id))
        .slice(0, MAX_COINS);
    }
    return ["bitcoin", "ethereum"];
  }, [searchParams]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialCoins);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync URL
  useEffect(() => {
    const param = selectedIds.join(",");
    const currentParam = searchParams.get("coins");
    if (param !== currentParam) {
      router.replace(`?coins=${param}`, { scroll: false });
    }
  }, [selectedIds, router, searchParams]);

  // Fetch comparison data
  const fetchData = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compare?coins=${ids.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch comparison data");
      const json = (await res.json()) as CompareResponse;
      setData(json);
    } catch {
      setError("Unable to load comparison data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedIds);
  }, [selectedIds, fetchData]);

  const addCoin = (id: string) => {
    if (selectedIds.length < MAX_COINS && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const removeCoin = (id: string) => {
    setSelectedIds((prev) => prev.filter((c) => c !== id));
  };

  return (
    <div className="space-y-6">
      {/* Coin selector bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.map((id) => {
            const coin = AVAILABLE_COINS.find((c) => c.id === id);
            return (
              <span
                key={id}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                  "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
                  "border border-[var(--color-accent)]/20"
                )}
              >
                {coin?.symbol ?? id}
                {selectedIds.length > 1 && (
                  <button
                    onClick={() => removeCoin(id)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${coin?.name ?? id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            );
          })}
          <CoinSelector selectedIds={selectedIds} onAdd={addCoin} />
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-text-secondary)] mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(selectedIds)}
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Comparison table */}
      {data && !loading && (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-tertiary)] w-36">
                    Metric
                  </th>
                  {data.coins.map((coin) => (
                    <th
                      key={coin.id}
                      className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)]"
                    >
                      <div className="flex items-center justify-end gap-2">
                        {coin.image && (
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="h-5 w-5 rounded-full"
                          />
                        )}
                        <span>{coin.symbol}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr
                    key={metric.key}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                      {metric.label}
                    </td>
                    {data.coins.map((coin) => {
                      const formatted = metric.format(coin);
                      const raw = metric.rawValue(coin);
                      const colorClass = metric.isPercent
                        ? raw > 0
                          ? "text-green-500 dark:text-green-400"
                          : raw < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-primary)]";

                      return (
                        <td
                          key={coin.id}
                          className={cn("px-4 py-3 text-right font-medium", colorClass)}
                        >
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Visual bar comparisons */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Visual Comparison
            </h2>
            <div className="space-y-6">
              {METRICS.filter((m) => !m.isPercent).map((metric) => {
                const values = data.coins.map((c) => metric.rawValue(c));
                const maxVal = Math.max(...values, 1);

                return (
                  <div key={metric.key}>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {metric.label}
                    </p>
                    <div className="space-y-2">
                      {data.coins.map((coin) => {
                        const val = metric.rawValue(coin);
                        const pct = (val / maxVal) * 100;
                        return (
                          <div key={coin.id} className="flex items-center gap-3">
                            <span className="w-12 text-xs font-medium text-[var(--color-text-tertiary)] text-right shrink-0">
                              {coin.symbol}
                            </span>
                            <div className="flex-1 h-6 rounded bg-[var(--color-surface-secondary)] overflow-hidden">
                              <div
                                className="h-full rounded bg-[var(--color-accent)] transition-all flex items-center justify-end pr-2"
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              >
                                {pct > 20 && (
                                  <span className="text-[10px] font-medium text-white truncate">
                                    {metric.format(coin)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {pct <= 20 && (
                              <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                                {metric.format(coin)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Summary card */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[var(--color-text-tertiary)]">Coins</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {data.summary.count}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Avg 24h Change</p>
                <p
                  className={cn(
                    "font-semibold",
                    parseFloat(data.summary.avgChange24h) > 0
                      ? "text-green-500"
                      : parseFloat(data.summary.avgChange24h) < 0
                        ? "text-red-500"
                        : "text-[var(--color-text-primary)]"
                  )}
                >
                  {parseFloat(data.summary.avgChange24h) > 0 ? "+" : ""}
                  {data.summary.avgChange24h}%
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">24h Leader</p>
                <p className="font-semibold text-green-500">
                  {data.summary.leader24h}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">24h Laggard</p>
                <p className="font-semibold text-red-500">
                  {data.summary.laggard24h}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
