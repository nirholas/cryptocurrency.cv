"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Star,
  AlertTriangle,
} from "lucide-react";

interface Exchange {
  id: string;
  name: string;
  url?: string;
  volume24h: number;
  markets: number;
  trustScore: number;
  yearEstablished: number | null;
  country?: string;
  type: "CEX" | "DEX";
  makerFee?: number;
  takerFee?: number;
  supportedCoins?: number;
  features?: string[];
}

type SortKey =
  | "name"
  | "volume24h"
  | "markets"
  | "trustScore"
  | "yearEstablished";
type SortDir = "asc" | "desc";
type TabType = "all" | "CEX" | "DEX";

function trustBadge(score: number) {
  if (score >= 9) return { label: "Excellent", cls: "text-green-500" };
  if (score >= 7)
    return { label: "Good", cls: "text-green-600 dark:text-green-400" };
  if (score >= 5)
    return { label: "Fair", cls: "text-amber-500 dark:text-amber-400" };
  return { label: "Low", cls: "text-red-500 dark:text-red-400" };
}

function trustBar(score: number) {
  const pct = Math.min(100, (score / 10) * 100);
  const color =
    score >= 9
      ? "bg-green-500"
      : score >= 7
        ? "bg-green-600 dark:bg-green-400"
        : score >= 5
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-tertiary">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium", trustBadge(score).cls)}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

interface ExchangeTableProps {
  onCompareSelect?: (exchange: Exchange) => void;
  compareIds?: string[];
}

export default function ExchangeTable({
  onCompareSelect,
  compareIds = [],
}: ExchangeTableProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("trustScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [tab, setTab] = useState<TabType>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/exchanges?limit=50");
      if (!res.ok) throw new Error("Failed to fetch exchange data");
      const data = await res.json();

      const items: Exchange[] = (
        data.exchanges || data.data || data || []
      ).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any, idx: number) => ({
          id: item.id || item.name?.toLowerCase().replace(/\s+/g, "-") || `ex-${idx}`,
          name: item.name || "Unknown",
          url: item.url || item.website,
          volume24h: item.volume24h || item.trade_volume_24h_btc || item.volume || 0,
          markets: item.markets || item.pairs || item.coins || 0,
          trustScore: item.trustScore || item.trust_score || item.trust || 0,
          yearEstablished: item.yearEstablished || item.year_established || item.year || null,
          country: item.country,
          type: item.type === "DEX" || item.centralized === false ? "DEX" : "CEX",
          makerFee: item.makerFee || item.maker_fee,
          takerFee: item.takerFee || item.taker_fee,
          supportedCoins: item.supportedCoins || item.coins,
          features: item.features || [],
        })
      );

      setExchanges(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "name" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const filtered = useMemo(
    () =>
      tab === "all" ? exchanges : exchanges.filter((e) => e.type === tab),
    [exchanges, tab]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return mul * a.name.localeCompare(b.name);
        case "volume24h":
          return mul * (a.volume24h - b.volume24h);
        case "markets":
          return mul * (a.markets - b.markets);
        case "trustScore":
          return mul * (a.trustScore - b.trustScore);
        case "yearEstablished":
          return mul * ((a.yearEstablished ?? 0) - (b.yearEstablished ?? 0));
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  // Volume distribution for donut
  const volumeShares = useMemo(() => {
    const total = exchanges.reduce((s, e) => s + e.volume24h, 0);
    if (total === 0) return [];
    return exchanges
      .slice()
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 10)
      .map((e) => ({
        name: e.name,
        share: (e.volume24h / total) * 100,
      }));
  }, [exchanges]);

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
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
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
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-(--color-surface) py-16">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-text-secondary">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Try Again
        </Button>
      </div>
    );
  }

  const DONUT_COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef4444",
    "#6366f1",
    "#14b8a6",
    "#f97316",
  ];

  const conicGradient = (() => {
    let acc = 0;
    const stops = volumeShares.map((v, i) => {
      const start = acc;
      acc += v.share;
      return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${acc}%`;
    });
    if (acc < 100) {
      stops.push(`var(--color-surface-tertiary) ${acc}% 100%`);
    }
    return `conic-gradient(${stops.join(", ")})`;
  })();

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["all", "CEX", "DEX"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-accent text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
            )}
          >
            {t === "all" ? "All Exchanges" : t}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-text-tertiary">
          {sorted.length} exchange{sorted.length !== 1 && "s"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-(--color-surface)">
        <table className="w-full text-sm" aria-label="Exchange rankings">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                #
              </th>
              {(
                [
                  { key: "name" as SortKey, label: "Exchange", cls: "" },
                  {
                    key: "volume24h" as SortKey,
                    label: "24h Volume",
                    cls: "",
                  },
                  {
                    key: "markets" as SortKey,
                    label: "Markets",
                    cls: "hidden md:table-cell",
                  },
                  {
                    key: "trustScore" as SortKey,
                    label: "Trust Score",
                    cls: "",
                  },
                  {
                    key: "yearEstablished" as SortKey,
                    label: "Year Est.",
                    cls: "hidden lg:table-cell",
                  },
                ] as { key: SortKey; label: string; cls: string }[]
              ).map((col) => (
                <th
                  key={col.label}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary transition-colors hover:text-text-primary",
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-text-tertiary"
                >
                  No exchanges found.
                </td>
              </tr>
            ) : (
              sorted.map((ex, idx) => (
                <tr
                  key={ex.id}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-surface-secondary",
                    compareIds.includes(ex.id) && "bg-accent/5"
                  )}
                >
                  <td className="px-4 py-3 text-text-tertiary">
                    {idx + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {ex.name}
                      </span>
                      <Badge
                        variant={ex.type === "DEX" ? "defi" : "default"}
                      >
                        {ex.type}
                      </Badge>
                    </div>
                    {ex.country && (
                      <span className="text-xs text-text-tertiary">
                        {ex.country}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-primary">
                    {formatLargeNumber(ex.volume24h, { prefix: "$" })}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-text-secondary md:table-cell">
                    {ex.markets.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {trustBar(ex.trustScore)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-text-secondary lg:table-cell">
                    {ex.yearEstablished ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      {ex.url && (
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-accent"
                          aria-label={`Visit ${ex.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {onCompareSelect && (
                        <button
                          onClick={() => onCompareSelect(ex)}
                          className={cn(
                            "rounded-md p-1.5 transition-colors",
                            compareIds.includes(ex.id)
                              ? "text-accent"
                              : "text-text-tertiary hover:bg-surface-tertiary hover:text-accent"
                          )}
                          aria-label={`Compare ${ex.name}`}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              compareIds.includes(ex.id) && "fill-current"
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Volume Distribution Donut */}
      {volumeShares.length > 0 && (
        <div>
          <h3 className="mb-4 font-serif text-xl font-bold text-text-primary">
            Volume Distribution
          </h3>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div
              className="relative h-40 w-40 shrink-0 rounded-full"
              style={{ background: conicGradient }}
              aria-hidden="true"
            >
              <div className="absolute inset-4 rounded-full bg-(--color-surface)" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {volumeShares.map((v, i) => (
                <div key={v.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        DONUT_COLORS[i % DONUT_COLORS.length],
                    }}
                  />
                  <span className="text-text-secondary">
                    {v.name}
                  </span>
                  <span className="ml-auto font-medium text-text-primary">
                    {v.share.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
