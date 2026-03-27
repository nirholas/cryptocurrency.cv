/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ImageOff,
} from "lucide-react";

/* ── types ── */

export interface NFTCollectionRow {
  rank: number;
  name: string;
  slug: string;
  imageUrl: string;
  chain: string;
  floorPrice: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
}

type SortField = "rank" | "floorPrice" | "volume24h" | "volumeChange24h" | "sales24h";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

/* ── component ── */

export default function NFTCollections({
  collections,
}: {
  collections: NFTCollectionRow[];
}) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...collections];
    copy.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      return sortDir === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });
    return copy;
  }, [collections, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "rank" ? "asc" : "desc");
    }
    setPage(0);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="inline ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="inline ml-1 h-3 w-3" />
    );
  }

  const thClass =
    "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary cursor-pointer select-none whitespace-nowrap hover:text-text-primary transition-colors";
  const tdClass =
    "px-3 py-3 text-sm text-text-primary whitespace-nowrap";

  if (collections.length === 0) {
    return (
      <p className="text-text-tertiary py-8 text-center">
        No NFT collection data available right now. Check back soon.
      </p>
    );
  }

  return (
    <div>
      {/* table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className={thClass} onClick={() => toggleSort("rank")}>
                # <SortIcon field="rank" />
              </th>
              <th className={cn(thClass, "min-w-[200px]")}>Collection</th>
              <th className={thClass} onClick={() => toggleSort("floorPrice")}>
                Floor Price <SortIcon field="floorPrice" />
              </th>
              <th className={thClass} onClick={() => toggleSort("volume24h")}>
                Volume (24h) <SortIcon field="volume24h" />
              </th>
              <th
                className={thClass}
                onClick={() => toggleSort("volumeChange24h")}
              >
                % Change <SortIcon field="volumeChange24h" />
              </th>
              <th className={thClass} onClick={() => toggleSort("sales24h")}>
                Sales <SortIcon field="sales24h" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr
                key={c.slug}
                className="hover:bg-surface-secondary transition-colors"
              >
                <td className={cn(tdClass, "tabular-nums font-medium")}>
                  {c.rank}
                </td>
                <td className={tdClass}>
                  <div className="flex items-center gap-3">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover bg-surface-tertiary shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (
                            e.target as HTMLImageElement
                          ).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "h-10 w-10 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0",
                        c.imageUrl ? "hidden" : ""
                      )}
                    >
                      <ImageOff className="h-4 w-4 text-text-tertiary" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                        {c.chain}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cn(tdClass, "tabular-nums")}>
                  {c.floorPrice > 0
                    ? `${c.floorPrice.toFixed(c.floorPrice < 1 ? 4 : 2)} ETH`
                    : "—"}
                </td>
                <td className={cn(tdClass, "tabular-nums")}>
                  {formatVolume(c.volume24h)}
                </td>
                <td className={tdClass}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 tabular-nums font-medium",
                      c.volumeChange24h > 0
                        ? "text-green-600 dark:text-green-400"
                        : c.volumeChange24h < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text-tertiary"
                    )}
                  >
                    {c.volumeChange24h > 0 && "▲"}
                    {c.volumeChange24h < 0 && "▼"}
                    {c.volumeChange24h !== 0
                      ? `${Math.abs(c.volumeChange24h).toFixed(1)}%`
                      : "—"}
                  </span>
                </td>
                <td className={cn(tdClass, "tabular-nums")}>
                  {c.sales24h > 0 ? c.sales24h.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>
            Page {page + 1} of {totalPages} &middot;{" "}
            {sorted.length} collections
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── helpers ── */

function formatVolume(value: number): string {
  if (value <= 0) return "—";
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ETH`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K ETH`;
  return `${value.toFixed(2)} ETH`;
}
