"use client";

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/format";

// ---- Types ------------------------------------------------------------------

export interface CoinRow {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number;
  sparkline_in_7d?: { price: number[] };
}

type SortKey =
  | "market_cap_rank"
  | "name"
  | "current_price"
  | "price_change_percentage_24h"
  | "price_change_percentage_7d"
  | "market_cap"
  | "total_volume";

type SortDir = "asc" | "desc";

// ---- Helpers ----------------------------------------------------------------

function getSortValue(coin: CoinRow, key: SortKey): number | string {
  switch (key) {
    case "market_cap_rank":
      return coin.market_cap_rank ?? Infinity;
    case "name":
      return coin.name.toLowerCase();
    case "current_price":
      return coin.current_price ?? 0;
    case "price_change_percentage_24h":
      return coin.price_change_percentage_24h ?? 0;
    case "price_change_percentage_7d":
      return coin.price_change_percentage_7d_in_currency ?? 0;
    case "market_cap":
      return coin.market_cap ?? 0;
    case "total_volume":
      return coin.total_volume ?? 0;
  }
}

// ---- Mini sparkline (pure CSS / SVG) ----------------------------------------

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

// ---- Column definitions -----------------------------------------------------

interface Column {
  key: SortKey;
  label: string;
  /** Tailwind classes to hide on small screens */
  hideClass?: string;
  align?: "left" | "right";
}

const columns: Column[] = [
  { key: "market_cap_rank", label: "#", align: "left" },
  { key: "name", label: "Coin", align: "left" },
  { key: "current_price", label: "Price", align: "right" },
  {
    key: "price_change_percentage_24h",
    label: "24h %",
    align: "right",
  },
  {
    key: "price_change_percentage_7d",
    label: "7d %",
    align: "right",
    hideClass: "hidden md:table-cell",
  },
  {
    key: "market_cap",
    label: "Market Cap",
    align: "right",
    hideClass: "hidden lg:table-cell",
  },
  {
    key: "total_volume",
    label: "Volume (24h)",
    align: "right",
    hideClass: "hidden lg:table-cell",
  },
];

// ---- Component --------------------------------------------------------------

export default function MarketTable({ coins }: { coins: CoinRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "name" ? "asc" : "asc");
      }
    },
    [sortKey],
  );

  const sorted = useMemo(() => {
    const copy = [...coins];
    copy.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return copy;
  }, [coins, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (col !== sortKey)
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "cursor-pointer select-none whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3 font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]",
                  col.align === "right" ? "text-right" : "text-left",
                  col.hideClass,
                  col.key === "name" && "sticky left-0 z-10 bg-[var(--color-surface)]",
                )}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortIcon col={col.key} />
              </th>
            ))}
            {/* Sparkline column — hidden on small screens */}
            <th className="hidden xl:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
              7d Chart
            </th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((coin) => {
            const pct24 = formatPercent(coin.price_change_percentage_24h);
            const pct7d = formatPercent(
              coin.price_change_percentage_7d_in_currency,
            );

            return (
              <tr
                key={coin.id}
                onClick={() => router.push(`/coin/${coin.id}`)}
                className="group border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-secondary)] cursor-pointer"
              >
                {/* Rank */}
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-[var(--color-text-secondary)]">
                  {coin.market_cap_rank}
                </td>

                {/* Coin name + icon — sticky on mobile */}
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 sticky left-0 z-10 bg-[var(--color-surface)]">
                  <div className="flex items-center gap-2">
                    {coin.image && (
                      <img
                        src={coin.image}
                        alt={coin.name}
                        width={24}
                        height={24}
                        className="rounded-full shrink-0"
                        loading="lazy"
                      />
                    )}
                    <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[120px] sm:max-w-none">
                      {coin.name}
                    </span>
                    <span className="uppercase text-[var(--color-text-tertiary)] text-xs hidden sm:inline">
                      {coin.symbol}
                    </span>
                  </div>
                </td>

                {/* Price */}
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right font-mono text-[var(--color-text-primary)]">
                  {formatCurrency(coin.current_price)}
                </td>

                {/* 24h % */}
                <td className={cn("px-3 py-2.5 sm:px-4 sm:py-3 text-right font-mono", pct24.className)}>
                  {pct24.text}
                </td>

                {/* 7d % */}
                <td
                  className={cn(
                    "hidden md:table-cell px-4 py-3 text-right font-mono",
                    pct7d.className,
                  )}
                >
                  {pct7d.text}
                </td>

                {/* Market Cap */}
                <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                  {formatLargeNumber(coin.market_cap, { prefix: "$" })}
                </td>

                {/* Volume */}
                <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                  {formatLargeNumber(coin.total_volume, { prefix: "$" })}
                </td>

                {/* Sparkline */}
                <td className="hidden xl:table-cell px-4 py-3 text-right">
                  {coin.sparkline_in_7d?.price && (
                    <MiniSparkline prices={coin.sparkline_in_7d.price} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
