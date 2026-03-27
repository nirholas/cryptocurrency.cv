/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface StablecoinRow {
  rank: number;
  name: string;
  symbol: string;
  marketCap: number;
  volume24h: number;
  price: number;
  pegDeviation: number;
  supplyChange7d: number;
  pegType: string;
  chains?: string[];
}

type SortKey = "rank" | "name" | "marketCap" | "volume24h" | "price" | "pegDeviation" | "supplyChange7d";
type SortDir = "asc" | "desc";

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getPegStatus(deviation: number): { label: string; className: string; icon: React.ReactNode } {
  const absDeviation = Math.abs(deviation);
  if (absDeviation <= 0.001) {
    return {
      label: "On Peg",
      className: "text-green-600 dark:text-green-400",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    };
  }
  if (absDeviation <= 0.005) {
    return {
      label: "Minor",
      className: "text-amber-600 dark:text-amber-400",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    };
  }
  return {
    label: "Off Peg",
    className: "text-red-600 dark:text-red-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  };
}

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}

function SortHeader({ label, sortKey, currentSort, currentDir, onSort, align = "right", className }: SortHeaderProps) {
  const active = currentSort === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-accent",
        align === "left" ? "text-left" : "text-right",
        active ? "text-accent" : "text-text-tertiary",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {align === "right" && (
          active ? (currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
        {label}
        {align === "left" && (
          active ? (currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

export default function StablecoinTable({ stablecoins }: { stablecoins: StablecoinRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "rank" || key === "name" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const sorted = useMemo(() => {
    const arr = [...stablecoins];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "marketCap":
          cmp = a.marketCap - b.marketCap;
          break;
        case "volume24h":
          cmp = a.volume24h - b.volume24h;
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "pegDeviation":
          cmp = Math.abs(a.pegDeviation) - Math.abs(b.pegDeviation);
          break;
        case "supplyChange7d":
          cmp = a.supplyChange7d - b.supplyChange7d;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [stablecoins, sortKey, sortDir]);

  if (stablecoins.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-(--color-surface) p-12 text-center text-text-secondary">
        Stablecoin data is temporarily unavailable. Please try again shortly.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-(--color-surface) -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm min-w-[500px]" aria-label="Stablecoin market data">
        <thead>
          <tr className="border-b border-border">
            <SortHeader label="#" sortKey="rank" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
            <SortHeader label="Name" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
            <SortHeader label="Market Cap" sortKey="marketCap" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="24h Volume" sortKey="volume24h" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
            <SortHeader label="Peg" sortKey="pegDeviation" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="7d Supply Δ" sortKey="supplyChange7d" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((coin) => {
            const peg = getPegStatus(coin.pegDeviation);
            return (
              <tr
                key={coin.symbol}
                className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors"
              >
                <td className="px-3 py-3 text-text-tertiary font-mono text-xs">
                  {coin.rank}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{coin.name}</span>
                    <span className="text-xs text-text-tertiary uppercase">{coin.symbol}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-primary">
                  {formatLargeNumber(coin.marketCap)}
                </td>
                <td className="hidden sm:table-cell px-3 py-3 text-right font-mono text-text-secondary">
                  {formatLargeNumber(coin.volume24h)}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={cn("font-mono", peg.className)}>
                      ${coin.price.toFixed(4)}
                    </span>
                    <span className={peg.className}>{peg.icon}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono",
                      coin.supplyChange7d > 0
                        ? "text-green-600 dark:text-green-400"
                        : coin.supplyChange7d < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text-secondary"
                    )}
                  >
                    {formatPct(coin.supplyChange7d)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
