/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface L2Row {
  rank: number;
  name: string;
  slug: string;
  type: string;
  tvl: number;
  tps: number;
  averageFee: number;
  change7d: number;
  stage?: string;
}

type SortKey = "rank" | "name" | "type" | "tvl" | "tps" | "averageFee" | "change7d";
type SortDir = "asc" | "desc";

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getTypeBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case "optimistic":
    case "optimistic rollup":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
    case "zk":
    case "zk rollup":
    case "zk-rollup":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "validium":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    default:
      return "bg-surface-tertiary text-text-secondary";
  }
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

export default function L2Table({ l2s }: { l2s: L2Row[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const maxTvl = useMemo(() => Math.max(...l2s.map((l) => l.tvl), 1), [l2s]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "rank" || key === "name" || key === "type" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const sorted = useMemo(() => {
    const arr = [...l2s];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "tvl":
          cmp = a.tvl - b.tvl;
          break;
        case "tps":
          cmp = a.tps - b.tps;
          break;
        case "averageFee":
          cmp = a.averageFee - b.averageFee;
          break;
        case "change7d":
          cmp = a.change7d - b.change7d;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [l2s, sortKey, sortDir]);

  if (l2s.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-(--color-surface) p-12 text-center text-text-secondary">
        Layer 2 data is temporarily unavailable. Please try again shortly.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-(--color-surface) -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm min-w-[600px]" aria-label="Layer 2 comparison data">
        <thead>
          <tr className="border-b border-border">
            <SortHeader label="#" sortKey="rank" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
            <SortHeader label="L2 Name" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
            <SortHeader label="Type" sortKey="type" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" className="hidden sm:table-cell" />
            <SortHeader label="TVL" sortKey="tvl" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              TVL Share
            </th>
            <SortHeader label="TPS" sortKey="tps" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
            <SortHeader label="Avg Fee" sortKey="averageFee" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
            <SortHeader label="7d Δ" sortKey="change7d" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((l2) => {
            const tvlPct = maxTvl > 0 ? (l2.tvl / maxTvl) * 100 : 0;

            return (
              <tr
                key={l2.slug}
                className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors"
              >
                <td className="px-3 py-3 text-text-tertiary font-mono text-xs">
                  {l2.rank}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{l2.name}</span>
                    {l2.stage && (
                      <span className="text-[10px] font-mono text-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded">
                        {l2.stage}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 py-3">
                  <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold", getTypeBadgeClass(l2.type))}>
                    {l2.type}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-text-primary">
                  {formatLargeNumber(l2.tvl)}
                </td>
                <td className="hidden md:table-cell px-3 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-20 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${tvlPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-text-tertiary w-10 text-right">
                      {tvlPct.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-text-secondary">
                  {l2.tps > 0 ? l2.tps.toFixed(1) : "—"}
                </td>
                <td className="hidden lg:table-cell px-3 py-3 text-right font-mono text-text-secondary">
                  {l2.averageFee > 0 ? `$${l2.averageFee.toFixed(4)}` : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono",
                      l2.change7d > 0
                        ? "text-green-600 dark:text-green-400"
                        : l2.change7d < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text-secondary"
                    )}
                  >
                    {formatPct(l2.change7d)}
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
