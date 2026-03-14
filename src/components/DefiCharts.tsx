"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

/* ── Shared helpers ── */

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/* ── Chain color palette ── */

const CHAIN_BAR_COLORS: Record<string, string> = {
  Ethereum: "#3b82f6",
  BSC: "#eab308",
  Solana: "#a855f7",
  Tron: "#ef4444",
  Arbitrum: "#38bdf8",
  Polygon: "#8b5cf6",
  Avalanche: "#f43f5e",
  Optimism: "#f43f5e",
  Base: "#60a5fa",
  Fantom: "#06b6d4",
  Sui: "#7dd3fc",
  Aptos: "#34d399",
  zkSync: "#6366f1",
  Linea: "#14b8a6",
};

function getBarColor(chain: string): string {
  return CHAIN_BAR_COLORS[chain] ?? "#6b7280";
}

/* ════════════════════════════════════════════════════════
   1. CHAIN DISTRIBUTION BAR CHART
   ════════════════════════════════════════════════════════ */

interface ChainDistributionEntry {
  chain: string;
  percentage: number;
}

export function ChainDistributionChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const entries: ChainDistributionEntry[] = useMemo(() => {
    return Object.entries(distribution)
      .map(([chain, percentage]) => ({ chain, percentage }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 12);
  }, [distribution]);

  const maxPct = entries[0]?.percentage ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base">
          TVL by Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.chain} className="flex items-center gap-3">
            <span className="text-xs font-medium text-text-primary w-20 truncate">
              {entry.chain}
            </span>
            <div className="flex-1 h-4 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(entry.percentage / maxPct) * 100}%`,
                  backgroundColor: getBarColor(entry.chain),
                  minWidth: "4px",
                }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-text-secondary w-12 text-right">
              {formatPct(entry.percentage)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   2. CATEGORY DISTRIBUTION (Donut Style)
   ════════════════════════════════════════════════════════ */

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
];

export function CategoryBreakdown({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const entries = useMemo(() => {
    return Object.entries(distribution)
      .map(([name, pct]) => ({ name, pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);
  }, [distribution]);

  /* simple horizontal stacked bar as a donut-alternative */
  const total = entries.reduce((s, e) => s + e.pct, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base">
          TVL by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* stacked bar */}
        <div className="flex h-5 rounded-full overflow-hidden border border-border">
          {entries.map((entry, i) => (
            <div
              key={entry.name}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(entry.pct / total) * 100}%`,
                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                minWidth: entry.pct > 0 ? "3px" : "0",
              }}
              title={`${entry.name}: ${formatPct(entry.pct)}`}
            />
          ))}
        </div>

        {/* legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {entries.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                }}
              />
              <span className="text-xs text-text-secondary truncate">
                {entry.name}
              </span>
              <span className="text-xs font-semibold tabular-nums text-text-primary ml-auto">
                {formatPct(entry.pct)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   3. YIELD RISK TABLE (enhanced yield cards with risk scoring)
   ════════════════════════════════════════════════════════ */

export interface YieldPoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  } | null;
  sigma: number;
  apyMean30d: number | null;
  volumeUsd1d: number | null;
}

type YieldSort = "apy" | "tvlUsd" | "risk";

function computeRiskScore(pool: YieldPoolData): {
  score: number;
  label: string;
  color: string;
} {
  let risk = 0;
  // high APY = higher risk
  if (pool.apy > 200) risk += 4;
  else if (pool.apy > 100) risk += 3;
  else if (pool.apy > 50) risk += 2;
  else if (pool.apy > 20) risk += 1;

  // IL risk
  if (pool.ilRisk === "yes") risk += 2;

  // multi-exposure = higher risk
  if (pool.exposure === "multi") risk += 1;

  // high volatility (sigma)
  if (pool.sigma > 1) risk += 2;
  else if (pool.sigma > 0.5) risk += 1;

  // low confidence prediction
  if (pool.predictions) {
    if (pool.predictions.binnedConfidence < 1) risk += 1;
    if (pool.predictions.predictedClass === "Down") risk += 2;
  }

  // low TVL
  if (pool.tvlUsd < 1e6) risk += 2;
  else if (pool.tvlUsd < 10e6) risk += 1;

  // normalize 0-10
  const capped = Math.min(risk, 10);

  if (capped <= 2) return { score: capped, label: "Low", color: "text-green-500" };
  if (capped <= 5) return { score: capped, label: "Medium", color: "text-yellow-500" };
  if (capped <= 7) return { score: capped, label: "High", color: "text-orange-500" };
  return { score: capped, label: "Very High", color: "text-red-500" };
}

function RiskMeter({ score }: { score: number }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-3.5 rounded-[1px] transition-all",
            i < score
              ? i < 3
                ? "bg-green-500"
                : i < 6
                  ? "bg-yellow-500"
                  : i < 8
                    ? "bg-orange-500"
                    : "bg-red-500"
              : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

export function YieldRiskTable({ pools }: { pools: YieldPoolData[] }) {
  const [sortBy, setSortBy] = useState<YieldSort>("apy");
  const [showStableOnly, setShowStableOnly] = useState(false);

  const processed = useMemo(() => {
    let list = pools.map((p) => ({
      ...p,
      riskInfo: computeRiskScore(p),
    }));
    if (showStableOnly) list = list.filter((p) => p.stablecoin);
    list.sort((a, b) => {
      switch (sortBy) {
        case "apy":
          return b.apy - a.apy;
        case "tvlUsd":
          return b.tvlUsd - a.tvlUsd;
        case "risk":
          return a.riskInfo.score - b.riskInfo.score;
      }
    });
    return list;
  }, [pools, sortBy, showStableOnly]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(["apy", "tvlUsd", "risk"] as YieldSort[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
                sortBy === key
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "text-text-tertiary border-border hover:text-text-secondary"
              )}
            >
              {key === "apy" ? "Highest APY" : key === "tvlUsd" ? "Highest TVL" : "Lowest Risk"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showStableOnly}
            onChange={(e) => setShowStableOnly(e.target.checked)}
            className="rounded border-border accent-accent"
          />
          <span className="text-xs text-text-secondary">
            Stablecoins only
          </span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-(--color-surface)">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Pool
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden sm:table-cell">
                Chain
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                APY
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden md:table-cell">
                Base / Reward
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden sm:table-cell">
                TVL
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {processed.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-text-tertiary"
                >
                  No yield pools available.
                </td>
              </tr>
            )}
            {processed.slice(0, 15).map((pool) => (
              <tr
                key={pool.pool}
                className="border-b border-border last:border-0 hover:bg-(--color-surface-hover) transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-text-primary truncate max-w-[200px]">
                      {pool.symbol}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      {pool.project}
                      {pool.stablecoin && (
                        <span className="ml-1.5 inline-flex items-center px-1 py-0 rounded text-[9px] bg-green-500/15 text-green-500">
                          Stable
                        </span>
                      )}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-text-secondary">
                    {pool.chain}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      pool.apy > 100
                        ? "text-orange-500"
                        : pool.apy > 20
                          ? "text-green-500"
                          : "text-text-primary"
                    )}
                  >
                    {pool.apy.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="text-xs tabular-nums text-text-secondary">
                    {pool.apyBase !== null ? `${pool.apyBase.toFixed(1)}%` : "—"}
                    {" / "}
                    {pool.apyReward !== null ? `${pool.apyReward.toFixed(1)}%` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-xs font-semibold tabular-nums text-text-primary">
                    {formatLargeNumber(pool.tvlUsd)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <RiskMeter score={pool.riskInfo.score} />
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        pool.riskInfo.color
                      )}
                    >
                      {pool.riskInfo.label}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   4. DEX VOLUME CARDS
   ════════════════════════════════════════════════════════ */

export interface DexVolumeData {
  name: string;
  total24h: number;
  total7d: number;
  change_1d: number;
  change_7d: number;
  category?: string;
}

export function DexVolumeGrid({ dexes }: { dexes: DexVolumeData[] }) {
  const top = useMemo(
    () =>
      [...dexes]
        .sort((a, b) => b.total24h - a.total24h)
        .slice(0, 8),
    [dexes]
  );

  const maxVol = top[0]?.total24h ?? 1;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {top.map((dex, i) => (
        <Card key={dex.name}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tabular-nums text-text-tertiary">
                  {i + 1}
                </span>
                <span className="font-semibold text-sm text-text-primary truncate">
                  {dex.name}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  dex.change_1d >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {dex.change_1d >= 0 ? "+" : ""}
                {dex.change_1d.toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-bold tabular-nums text-text-primary">
              {formatLargeNumber(dex.total24h)}
            </p>
            <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{
                  width: `${(dex.total24h / maxVol) * 100}%`,
                  minWidth: "4px",
                }}
              />
            </div>
            <p className="text-[10px] text-text-tertiary">
              7d: {formatLargeNumber(dex.total7d)}
              <span className="ml-1.5">
                ({dex.change_7d >= 0 ? "+" : ""}
                {dex.change_7d.toFixed(1)}%)
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   5. BRIDGE VOLUME TABLE
   ════════════════════════════════════════════════════════ */

export interface BridgeVolumeData {
  name: string;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  chains: string[];
}

export function BridgeVolumeTable({
  bridges,
}: {
  bridges: BridgeVolumeData[];
}) {
  const top = useMemo(
    () =>
      [...bridges]
        .sort((a, b) => b.lastDailyVolume - a.lastDailyVolume)
        .slice(0, 10),
    [bridges]
  );

  const maxVol = top[0]?.lastDailyVolume ?? 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-(--color-surface)">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Bridge
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden sm:table-cell">
              Chains
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              24h Volume
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden md:table-cell">
              7d Volume
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-tertiary hidden lg:table-cell">
              30d Volume
            </th>
          </tr>
        </thead>
        <tbody>
          {top.map((bridge) => (
            <tr
              key={bridge.name}
              className="border-b border-border last:border-0 hover:bg-(--color-surface-hover) transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-semibold text-text-primary">
                  {bridge.displayName}
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                  {bridge.chains.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-(--color-surface-hover) text-text-tertiary"
                    >
                      {c}
                    </span>
                  ))}
                  {bridge.chains.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--color-surface-hover) text-text-tertiary">
                      +{bridge.chains.length - 4}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-semibold tabular-nums text-text-primary">
                    {formatLargeNumber(bridge.lastDailyVolume)}
                  </span>
                  <div className="w-12 h-1.5 rounded-full bg-border/50 overflow-hidden hidden md:block">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{
                        width: `${(bridge.lastDailyVolume / maxVol) * 100}%`,
                        minWidth: "3px",
                      }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell font-medium tabular-nums text-text-secondary">
                {formatLargeNumber(bridge.weeklyVolume)}
              </td>
              <td className="px-4 py-3 text-right hidden lg:table-cell font-medium tabular-nums text-text-secondary">
                {formatLargeNumber(bridge.monthlyVolume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   6. STABLECOIN DOMINANCE CHART
   ════════════════════════════════════════════════════════ */

export interface StablecoinEntry {
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  pegType: string;
}

export function StablecoinDominance({
  stablecoins,
}: {
  stablecoins: StablecoinEntry[];
}) {
  const sorted = useMemo(
    () =>
      [...stablecoins]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 8),
    [stablecoins]
  );

  const totalMcap = sorted.reduce((s, c) => s + c.marketCap, 0);

  const STABLECOIN_COLORS = [
    "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#ef4444", "#ec4899", "#6b7280",
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base">
          Stablecoin Dominance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* stacked bar */}
        <div className="flex h-6 rounded-lg overflow-hidden border border-border">
          {sorted.map((coin, i) => {
            const pct = totalMcap > 0 ? (coin.marketCap / totalMcap) * 100 : 0;
            return (
              <div
                key={coin.symbol}
                className="h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{
                  width: `${pct}%`,
                  backgroundColor: STABLECOIN_COLORS[i],
                  minWidth: pct > 3 ? undefined : "0",
                }}
                title={`${coin.symbol}: ${formatLargeNumber(coin.marketCap)} (${pct.toFixed(1)}%)`}
              >
                {pct > 8 ? coin.symbol : ""}
              </div>
            );
          })}
        </div>

        {/* list */}
        <div className="space-y-2">
          {sorted.map((coin, i) => {
            const pct = totalMcap > 0 ? (coin.marketCap / totalMcap) * 100 : 0;
            const depegged = Math.abs(coin.price - 1) > 0.01;
            return (
              <div
                key={coin.symbol}
                className="flex items-center gap-3"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: STABLECOIN_COLORS[i] }}
                />
                <span className="text-xs font-semibold text-text-primary w-14">
                  {coin.symbol}
                </span>
                <span className="text-xs text-text-secondary flex-1 truncate">
                  {coin.name}
                </span>
                <span className="text-xs tabular-nums text-text-secondary">
                  {formatLargeNumber(coin.marketCap)}
                </span>
                <span className="text-xs font-semibold tabular-nums text-text-primary w-12 text-right">
                  {pct.toFixed(1)}%
                </span>
                {depegged && (
                  <Badge variant="breaking" className="text-[9px] px-1">
                    ${coin.price.toFixed(4)}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════
   7. DEFI TABS (lightweight tab switcher)
   ════════════════════════════════════════════════════════ */

export function DefiTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-(--color-surface) border border-border w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === tab.id
              ? "bg-accent text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-(--color-surface-hover)"
          )}
        >
          {tab.icon && <span className="mr-1">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
