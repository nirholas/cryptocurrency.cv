/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/format";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface FundingRate {
  symbol: string;
  exchange?: string;
  fundingRate: number;
  nextFundingTime?: number;
  markPrice?: number;
}

type SortField = "symbol" | "rate" | "annualized";

export default function FundingRates() {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("rate");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchRates = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/funding-rates");
      if (!res.ok) return;
      const json = await res.json();
      // Handle both array and { data: [] } responses
      const arr: FundingRate[] = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : [];
      setRates(arr);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(), 60_000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortAsc((prev) => !prev);
      } else {
        setSortField(field);
        setSortAsc(false);
      }
    },
    [sortField],
  );

  const sorted = useMemo(() => {
    const copy = [...rates];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === "symbol") {
        cmp = a.symbol.localeCompare(b.symbol);
      } else {
        // Sort by absolute funding rate value
        cmp = Math.abs(b.fundingRate) - Math.abs(a.fundingRate);
      }
      return sortAsc ? -cmp : cmp;
    });
    return copy;
  }, [rates, sortField, sortAsc]);

  const annualized = (rate: number) => rate * 3 * 365 * 100; // 8h funding × 3 × 365

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-text-primary",
        sortField === field
          ? "text-accent"
          : "text-text-secondary",
      )}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Funding Rates</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchRates(true)}
          disabled={refreshing}
          className="h-8 w-8"
          aria-label="Refresh funding rates"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
          />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left">
                  <SortButton field="symbol">Coin</SortButton>
                </th>
                <th className="pb-2 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Exchange
                  </span>
                </th>
                <th className="pb-2 text-right">
                  <SortButton field="rate">Funding Rate</SortButton>
                </th>
                <th className="hidden pb-2 text-right sm:table-cell">
                  <SortButton field="annualized">Annualized</SortButton>
                </th>
                <th className="hidden pb-2 text-right md:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Next Funding
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-2" colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-text-tertiary"
                  >
                    No funding rate data available
                  </td>
                </tr>
              ) : (
                sorted.map((r, idx) => {
                  const rate = r.fundingRate;
                  const ann = annualized(rate);
                  const isPositive = rate >= 0;
                  const colorClass = isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400";
                  return (
                    <tr
                      key={`${r.symbol}-${r.exchange ?? idx}`}
                      className="border-b border-border/50 transition-colors hover:bg-surface-secondary"
                    >
                      <td className="py-2 font-medium">{r.symbol}</td>
                      <td className="py-2 text-text-secondary">
                        {r.exchange ?? "—"}
                      </td>
                      <td className={cn("py-2 text-right font-mono", colorClass)}>
                        {isPositive ? "+" : ""}
                        {(rate * 100).toFixed(4)}%
                      </td>
                      <td
                        className={cn(
                          "hidden py-2 text-right font-mono sm:table-cell",
                          colorClass,
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {ann.toFixed(2)}%
                      </td>
                      <td className="hidden py-2 text-right text-text-secondary md:table-cell">
                        {r.nextFundingTime
                          ? new Date(r.nextFundingTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
