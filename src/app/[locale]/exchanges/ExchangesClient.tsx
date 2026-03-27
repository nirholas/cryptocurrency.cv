/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useCallback } from "react";
import ExchangeTable from "@/components/ExchangeTable";
import { cn } from "@/lib/utils";
import { X, ArrowLeftRight } from "lucide-react";

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

function formatFee(fee: number | undefined): string {
  if (fee == null) return "—";
  return `${(fee * 100).toFixed(2)}%`;
}

export default function ExchangesClient() {
  const [compareList, setCompareList] = useState<Exchange[]>([]);

  const handleCompareSelect = useCallback((exchange: Exchange) => {
    setCompareList((prev) => {
      const exists = prev.find((e) => e.id === exchange.id);
      if (exists) return prev.filter((e) => e.id !== exchange.id);
      if (prev.length >= 2) return [prev[1], exchange];
      return [...prev, exchange];
    });
  }, []);

  const compareIds = compareList.map((e) => e.id);

  return (
    <div className="space-y-8">
      {/* Compare Prompt */}
      {compareList.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-(--color-surface) p-4 text-sm text-text-tertiary">
          <ArrowLeftRight className="h-4 w-4 shrink-0" />
          <span>
            Click the <span className="font-medium">★</span> icon on any two
            exchanges to compare them side by side.
          </span>
        </div>
      )}

      {/* Comparison Panel */}
      {compareList.length === 2 && (
        <div className="rounded-lg border border-border bg-(--color-surface) p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-text-primary">
              Exchange Comparison
            </h3>
            <button
              onClick={() => setCompareList([])}
              className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-tertiary"
              aria-label="Close comparison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Feature
                  </th>
                  {compareList.map((ex) => (
                    <th
                      key={ex.id}
                      className="pb-3 text-left text-sm font-bold text-text-primary"
                    >
                      {ex.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    label: "Type",
                    values: compareList.map((e) => e.type),
                  },
                  {
                    label: "24h Volume",
                    values: compareList.map((e) =>
                      e.volume24h
                        ? `$${(e.volume24h / 1e9).toFixed(2)}B`
                        : "—"
                    ),
                  },
                  {
                    label: "Markets",
                    values: compareList.map((e) =>
                      e.markets.toLocaleString()
                    ),
                  },
                  {
                    label: "Trust Score",
                    values: compareList.map((e) =>
                      `${e.trustScore.toFixed(1)} / 10`
                    ),
                  },
                  {
                    label: "Maker Fee",
                    values: compareList.map((e) => formatFee(e.makerFee)),
                  },
                  {
                    label: "Taker Fee",
                    values: compareList.map((e) => formatFee(e.takerFee)),
                  },
                  {
                    label: "Supported Coins",
                    values: compareList.map((e) =>
                      e.supportedCoins
                        ? e.supportedCoins.toLocaleString()
                        : "—"
                    ),
                  },
                  {
                    label: "Year Established",
                    values: compareList.map((e) =>
                      e.yearEstablished ? String(e.yearEstablished) : "—"
                    ),
                  },
                  {
                    label: "Country",
                    values: compareList.map((e) => e.country || "—"),
                  },
                ].map((row) => {
                  const better =
                    row.label === "Trust Score" || row.label === "Markets" || row.label === "Supported Coins"
                      ? row.values[0] > row.values[1]
                        ? 0
                        : row.values[1] > row.values[0]
                          ? 1
                          : -1
                      : -1;

                  return (
                    <tr key={row.label}>
                      <td className="py-2.5 pr-4 text-text-tertiary">
                        {row.label}
                      </td>
                      {row.values.map((val, i) => (
                        <td
                          key={i}
                          className={cn(
                            "py-2.5 text-text-primary",
                            better === i && "font-semibold text-green-600 dark:text-green-400"
                          )}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exchange Table with compare integration */}
      <ExchangeTable
        onCompareSelect={handleCompareSelect}
        compareIds={compareIds}
      />
    </div>
  );
}
