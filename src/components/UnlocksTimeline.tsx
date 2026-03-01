"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Lock, Unlock, TrendingDown, Calendar, DollarSign, Percent } from "lucide-react";

/* ---------- Types -------------------------------------------------------- */

interface TokenUnlock {
  id: string;
  token: string;
  symbol: string;
  unlockDate: string;
  amount: number;
  valueUsd: number;
  circulatingSupplyPercent: number;
  previousUnlockPriceImpact?: number;
}

type SeverityLevel = "critical" | "warning" | "safe";

/* ---------- Helpers ------------------------------------------------------- */

function getSeverity(percent: number): SeverityLevel {
  if (percent > 5) return "critical";
  if (percent >= 2) return "warning";
  return "safe";
}

const severityConfig: Record<
  SeverityLevel,
  { dot: string; bg: string; border: string; label: string }
> = {
  critical: {
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "High Impact",
  },
  warning: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Medium Impact",
  },
  safe: {
    dot: "bg-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    label: "Low Impact",
  },
};

function formatUsd(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatAmount(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isThisWeek(dateStr: string): boolean {
  const days = daysUntil(dateStr);
  return days >= 0 && days <= 7;
}

/* ---------- Demo data ---------------------------------------------------- */

const DEMO_UNLOCKS: TokenUnlock[] = [
  { id: "1", token: "Arbitrum", symbol: "ARB", unlockDate: "2026-03-03", amount: 92_650_000, valueUsd: 148_000_000, circulatingSupplyPercent: 2.8, previousUnlockPriceImpact: -8.5 },
  { id: "2", token: "Aptos", symbol: "APT", unlockDate: "2026-03-05", amount: 11_310_000, valueUsd: 95_000_000, circulatingSupplyPercent: 1.3, previousUnlockPriceImpact: -4.2 },
  { id: "3", token: "Optimism", symbol: "OP", unlockDate: "2026-03-07", amount: 31_340_000, valueUsd: 72_000_000, circulatingSupplyPercent: 1.8, previousUnlockPriceImpact: -6.1 },
  { id: "4", token: "Sui", symbol: "SUI", unlockDate: "2026-03-10", amount: 64_190_000, valueUsd: 210_000_000, circulatingSupplyPercent: 5.2, previousUnlockPriceImpact: -12.3 },
  { id: "5", token: "Worldcoin", symbol: "WLD", unlockDate: "2026-03-12", amount: 37_230_000, valueUsd: 56_000_000, circulatingSupplyPercent: 3.1, previousUnlockPriceImpact: -7.8 },
  { id: "6", token: "Starknet", symbol: "STRK", unlockDate: "2026-03-14", amount: 64_000_000, valueUsd: 43_000_000, circulatingSupplyPercent: 4.5, previousUnlockPriceImpact: -9.2 },
  { id: "7", token: "Celestia", symbol: "TIA", unlockDate: "2026-03-18", amount: 15_830_000, valueUsd: 128_000_000, circulatingSupplyPercent: 6.1, previousUnlockPriceImpact: -15.1 },
  { id: "8", token: "Jito", symbol: "JTO", unlockDate: "2026-03-20", amount: 8_600_000, valueUsd: 24_000_000, circulatingSupplyPercent: 0.9, previousUnlockPriceImpact: -2.1 },
  { id: "9", token: "Pyth Network", symbol: "PYTH", unlockDate: "2026-03-22", amount: 125_000_000, valueUsd: 50_000_000, circulatingSupplyPercent: 1.6, previousUnlockPriceImpact: -3.9 },
  { id: "10", token: "Wormhole", symbol: "W", unlockDate: "2026-03-28", amount: 600_000_000, valueUsd: 180_000_000, circulatingSupplyPercent: 7.4, previousUnlockPriceImpact: -18.5 },
];

/* ---------- Component ---------------------------------------------------- */

export default function UnlocksTimeline() {
  const [unlocks, setUnlocks] = useState<TokenUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnlocks = useCallback(async () => {
    try {
      const res = await fetch("/api/unlocks");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUnlocks(data);
          return;
        }
      }
    } catch {
      /* fall through to demo data */
    }
    setUnlocks(DEMO_UNLOCKS);
  }, []);

  useEffect(() => {
    fetchUnlocks().finally(() => setLoading(false));
  }, [fetchUnlocks]);

  const sortedUnlocks = [...unlocks].sort(
    (a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
  );

  const thisWeek = sortedUnlocks.filter((u) => isThisWeek(u.unlockDate));
  const totalWeekValue = thisWeek.reduce((s, u) => s + u.valueUsd, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Week summary skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Timeline skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── This Week's Unlocks ───────────────────────────────────── */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
          This Week&apos;s Unlocks
        </h2>

        {thisWeek.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            No major token unlocks scheduled this week.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Summary card */}
            <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
              <CardContent className="p-5">
                <div className="mb-1 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Calendar className="h-4 w-4" />
                  This Week Total
                </div>
                <p className="text-2xl font-bold">{formatUsd(totalWeekValue)}</p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                  {thisWeek.length} unlock{thisWeek.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Individual cards for this week */}
            {thisWeek.slice(0, 2).map((u) => {
              const severity = getSeverity(u.circulatingSupplyPercent);
              const cfg = severityConfig[severity];
              return (
                <Card key={u.id} className={cn("border", cfg.border)}>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">
                        {u.token}{" "}
                        <span className="text-[var(--color-text-tertiary)]">
                          {u.symbol}
                        </span>
                      </span>
                      <Badge
                        className={cn(
                          "text-xs",
                          severity === "critical" && "bg-red-500/10 text-red-500",
                          severity === "warning" && "bg-amber-500/10 text-amber-500",
                          severity === "safe" && "bg-green-500/10 text-green-500"
                        )}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold">{formatUsd(u.valueUsd)}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {formatAmount(u.amount)} {u.symbol} ·{" "}
                      {u.circulatingSupplyPercent.toFixed(1)}% of supply
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      {formatDate(u.unlockDate)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Upcoming Unlocks Timeline ─────────────────────────────── */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
          Upcoming Unlocks — Next 30 Days
        </h2>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[var(--color-border)]" />

          <div className="space-y-6">
            {sortedUnlocks.map((u) => {
              const severity = getSeverity(u.circulatingSupplyPercent);
              const cfg = severityConfig[severity];
              const days = daysUntil(u.unlockDate);

              return (
                <div key={u.id} className="relative">
                  {/* Dot on timeline */}
                  <div
                    className={cn(
                      "absolute -left-8 top-1.5 h-3 w-3 rounded-full border-2 border-[var(--color-surface)]",
                      cfg.dot
                    )}
                  />

                  <Card
                    className={cn(
                      "transition-colors hover:bg-[var(--color-surface-secondary)]"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: token info */}
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              cfg.bg
                            )}
                          >
                            {days <= 0 ? (
                              <Unlock className="h-5 w-5" />
                            ) : (
                              <Lock className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {u.token}{" "}
                              <span className="text-[var(--color-text-tertiary)]">
                                {u.symbol}
                              </span>
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {formatDate(u.unlockDate)}{" "}
                              <span className="text-[var(--color-text-tertiary)]">
                                ({days > 0 ? `in ${days}d` : "today"})
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Right: metrics */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            <span className="font-medium">
                              {formatUsd(u.valueUsd)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Coins className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            <span>
                              {formatAmount(u.amount)} {u.symbol}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Percent className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            <span
                              className={cn(
                                "font-medium",
                                severity === "critical" && "text-red-500",
                                severity === "warning" && "text-amber-500",
                                severity === "safe" && "text-green-500"
                              )}
                            >
                              {u.circulatingSupplyPercent.toFixed(1)}% of supply
                            </span>
                          </div>

                          {u.previousUnlockPriceImpact != null && (
                            <div className="flex items-center gap-1.5">
                              <TrendingDown className="h-4 w-4 text-red-400" />
                              <span className="text-red-400">
                                {u.previousUnlockPriceImpact.toFixed(1)}% avg
                              </span>
                            </div>
                          )}

                          <Badge
                            className={cn(
                              "text-xs",
                              severity === "critical" && "bg-red-500/10 text-red-500",
                              severity === "warning" && "bg-amber-500/10 text-amber-500",
                              severity === "safe" && "bg-green-500/10 text-green-500"
                            )}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Impact Analysis ───────────────────────────────────────── */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
          Historical Impact Analysis
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Average price impact in the 7 days following previous token unlock events.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="pb-3 pr-4 font-medium">Token</th>
                <th className="pb-3 pr-4 font-medium">Unlock Value</th>
                <th className="pb-3 pr-4 font-medium">% of Supply</th>
                <th className="pb-3 pr-4 font-medium">Avg. Price Impact</th>
                <th className="pb-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedUnlocks
                .filter((u) => u.previousUnlockPriceImpact != null)
                .sort(
                  (a, b) =>
                    Math.abs(b.previousUnlockPriceImpact!) -
                    Math.abs(a.previousUnlockPriceImpact!)
                )
                .slice(0, 8)
                .map((u) => {
                  const severity = getSeverity(u.circulatingSupplyPercent);
                  const cfg = severityConfig[severity];
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-[var(--color-surface-secondary)]"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {u.token}{" "}
                        <span className="text-[var(--color-text-tertiary)]">
                          {u.symbol}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatUsd(u.valueUsd)}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            severity === "critical" && "text-red-500",
                            severity === "warning" && "text-amber-500",
                            severity === "safe" && "text-green-500"
                          )}
                        >
                          {u.circulatingSupplyPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-red-400">
                        {u.previousUnlockPriceImpact!.toFixed(1)}%
                      </td>
                      <td className="py-3">
                        <Badge
                          className={cn(
                            "text-xs",
                            severity === "critical" && "bg-red-500/10 text-red-500",
                            severity === "warning" && "bg-amber-500/10 text-amber-500",
                            severity === "safe" && "bg-green-500/10 text-green-500"
                          )}
                        >
                          {cfg.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
          Historical data is for informational purposes only. Past performance
          does not guarantee future results.
        </p>
      </section>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
        {(["critical", "warning", "safe"] as SeverityLevel[]).map((level) => {
          const cfg = severityConfig[level];
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cfg.dot)} />
              {level === "critical" && ">5% of supply (High Impact)"}
              {level === "warning" && "2–5% of supply (Medium Impact)"}
              {level === "safe" && "<2% of supply (Low Impact)"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
