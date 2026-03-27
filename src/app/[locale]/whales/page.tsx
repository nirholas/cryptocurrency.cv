/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Skeleton } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import WhaleAlertFeed from "@/components/WhaleAlertFeed";
import type { Metadata } from "next";
import {
  Activity,
  Cpu,
  Flame,
  ArrowDownUp,
  Coins,
  BarChart3,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ISR                                                               */
/* ------------------------------------------------------------------ */

export const revalidate = 300;

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ locale: string }>;
};

interface OnChainMetric {
  metric: string;
  chain: string;
  value: number;
  unit: string;
  source: string;
}

interface FlowData {
  coin: string;
  symbol: string;
  period: string;
  exchangeBalance: {
    current: number;
    previous: number;
    netChange: number;
    netChangeUsd: number;
    unit: string;
  } | null;
  interpretation: string;
  signal: string;
  market: {
    price: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    volume24h: number;
    marketCap: number;
  } | null;
}

interface WhaleWallet {
  hash: string;
  blockchain: string;
  symbol: string;
  amount: number;
  usd_value: number;
  from: string;
  to: string;
  type: string;
  significance: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  SEO                                                               */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Whale Alerts & On-Chain Activity — Live Crypto Dashboard",
    description:
      "Track large cryptocurrency whale transactions in real time. Monitor on-chain metrics, exchange flows, and notable wallet activity for Bitcoin, Ethereum, and altcoins.",
    path: "/whales",
    locale,
    tags: [
      "whale alerts",
      "on-chain analytics",
      "crypto whale tracker",
      "exchange flows",
      "bitcoin whales",
      "ethereum whales",
      "blockchain analytics",
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Data fetching helpers (server)                                    */
/* ------------------------------------------------------------------ */

const BASE =
  process.env.NEXT_PUBLIC_APP_URL || "https://cryptocurrency.cv";

async function fetchOnChainMetrics(): Promise<OnChainMetric[]> {
  try {
    const res = await fetch(`${BASE}/api/on-chain`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function fetchFlows(): Promise<FlowData[]> {
  try {
    const coins = ["bitcoin", "ethereum", "solana", "xrp", "cardano"];
    const results = await Promise.allSettled(
      coins.map((coin) =>
        fetch(`${BASE}/api/flows?coin=${coin}`, {
          next: { revalidate: 300 },
        }).then((r) => (r.ok ? r.json() : null)),
      ),
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<FlowData> =>
          r.status === "fulfilled" && r.value !== null,
      )
      .map((r) => r.value);
  } catch {
    return [];
  }
}

async function fetchWhaleWallets(): Promise<WhaleWallet[]> {
  try {
    const res = await fetch(`${BASE}/api/whales?limit=10`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                    */
/* ------------------------------------------------------------------ */

function formatMetricValue(value: number, unit: string): string {
  if (unit === "USD" || unit === "$") {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === "%" || unit === "percent") return `${value.toFixed(2)}%`;
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)}P ${unit}`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T ${unit}`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B ${unit}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M ${unit}`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K ${unit}`;
  return `${value.toLocaleString()} ${unit}`;
}

function formatCoinAmount(amount: number): string {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function truncate(str: string, len: number): string {
  if (!str || str.length <= len) return str || "—";
  return `${str.slice(0, 6)}…${str.slice(-4)}`;
}

/* ------------------------------------------------------------------ */
/*  Metric card icon mapping                                          */
/* ------------------------------------------------------------------ */

const METRIC_ICONS: Record<string, typeof Activity> = {
  "active addresses": Activity,
  "gas price": Flame,
  "hash rate": Cpu,
  hashrate: Cpu,
  "exchange netflow": ArrowDownUp,
  netflow: ArrowDownUp,
  "staking rate": Coins,
  staking: Coins,
  "transaction count": BarChart3,
  transactions: BarChart3,
  default: Activity,
};

function getMetricIcon(metric: string) {
  const lower = metric.toLowerCase();
  for (const [key, Icon] of Object.entries(METRIC_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return METRIC_ICONS.default;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (server)                                           */
/* ------------------------------------------------------------------ */

async function OnChainStatsGrid() {
  const metrics = await fetchOnChainMetrics();

  /* Fallback cards when API returns nothing */
  const fallbackMetrics: OnChainMetric[] = [
    { metric: "BTC Active Addresses (24h)", chain: "bitcoin", value: 0, unit: "addresses", source: "on-chain" },
    { metric: "ETH Gas Price", chain: "ethereum", value: 0, unit: "gwei", source: "on-chain" },
    { metric: "BTC Hash Rate", chain: "bitcoin", value: 0, unit: "EH/s", source: "on-chain" },
    { metric: "Exchange Netflow", chain: "bitcoin", value: 0, unit: "BTC", source: "on-chain" },
    { metric: "Staking Rate", chain: "ethereum", value: 0, unit: "%", source: "on-chain" },
    { metric: "Transaction Count (24h)", chain: "bitcoin", value: 0, unit: "txs", source: "on-chain" },
  ];

  const display = metrics.length > 0 ? metrics.slice(0, 6) : fallbackMetrics;

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
        On-Chain Stats
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {display.map((m, i) => {
          const Icon = getMetricIcon(m.metric);
          return (
            <Card key={`${m.metric}-${i}`}>
              <CardContent className="flex items-start gap-3 py-4 px-5">
                <span className="shrink-0 p-2 rounded-lg bg-accent/10">
                  <Icon className="w-5 h-5 text-accent" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary truncate">
                    {m.metric}
                  </p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">
                    {m.value === 0 ? "—" : formatMetricValue(m.value, m.unit)}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {m.chain} · {m.source}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

async function ExchangeFlows() {
  const flows = await fetchFlows();

  if (flows.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
          Exchange Flows
        </h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-text-tertiary text-center">
              Exchange flow data is currently unavailable.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
        Exchange Flows
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Asset
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Net Change
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary hidden sm:table-cell">
                    Net Change (USD)
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary hidden md:table-cell">
                    Price (24h)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Signal
                  </th>
                </tr>
              </thead>
              <tbody>
                {flows.map((f) => {
                  const net = f.exchangeBalance?.netChange || 0;
                  const netUsd = f.exchangeBalance?.netChangeUsd || 0;
                  const isPositive = net > 0;
                  const pctChange = f.market?.priceChangePercent24h || 0;

                  return (
                    <tr
                      key={f.symbol}
                      className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary">
                          {f.symbol}
                        </span>
                        <span className="text-xs text-text-tertiary ml-1.5 hidden sm:inline">
                          {f.coin}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-mono text-sm font-semibold",
                            isPositive ? "text-red-500" : "text-green-500",
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {formatCoinAmount(net)} {f.exchangeBalance?.unit || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span
                          className={cn(
                            "font-mono text-sm",
                            netUsd > 0 ? "text-red-500" : "text-green-500",
                          )}
                        >
                          {netUsd > 0 ? "+" : ""}
                          {formatUsd(Math.abs(netUsd))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-1">
                          {pctChange > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          ) : pctChange < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-text-tertiary" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              pctChange > 0
                                ? "text-green-500"
                                : pctChange < 0
                                  ? "text-red-500"
                                  : "text-text-tertiary",
                            )}
                          >
                            {pctChange > 0 ? "+" : ""}
                            {pctChange.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                            f.signal === "accumulation" || f.signal === "bullish"
                              ? "bg-green-500/10 text-green-600"
                              : f.signal === "distribution" || f.signal === "bearish"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-surface-tertiary text-text-tertiary",
                          )}
                        >
                          {f.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Interpretations */}
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs font-semibold text-text-tertiary mb-1.5">
              Analysis
            </p>
            <div className="space-y-1">
              {flows
                .filter((f) => f.interpretation)
                .slice(0, 3)
                .map((f) => (
                  <p
                    key={f.symbol}
                    className="text-xs text-text-secondary"
                  >
                    <span className="font-semibold">{f.symbol}:</span>{" "}
                    {f.interpretation}
                  </p>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

async function NotableWallets() {
  const wallets = await fetchWhaleWallets();

  if (wallets.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
          Notable Wallets
        </h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-text-tertiary text-center">
              Notable wallet data is currently unavailable.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
        Notable Wallets
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Wallet
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Chain
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Amount
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary hidden sm:table-cell">
                    USD Value
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-tertiary">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary hidden md:table-cell">
                    Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w, i) => (
                  <tr
                    key={`${w.hash}-${i}`}
                    className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-text-tertiary" />
                        <span className="font-mono text-xs text-text-primary">
                          {truncate(w.from || w.to, 16)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary capitalize">
                        {w.blockchain}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-semibold text-text-primary">
                        {formatCoinAmount(w.amount)} {w.symbol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-sm text-text-secondary">
                        {formatUsd(w.usd_value)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                          w.significance === "high" || w.significance === "critical"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-surface-tertiary text-text-tertiary",
                        )}
                      >
                        {w.type || w.significance || "transfer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-[10px] text-text-tertiary">
                        {truncate(w.hash, 16)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                         */
/* ------------------------------------------------------------------ */

function OnChainSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded" />
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function WhalesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
            🐋 Whale Alerts &amp; On-Chain Activity
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Track large cryptocurrency transactions in real time. Monitor
            on-chain metrics, exchange flows, and notable wallet activity across
            Bitcoin, Ethereum, and top altcoins.
          </p>
        </div>

        <div className="space-y-10">
          {/* 1. Live Whale Feed (client component) */}
          <WhaleAlertFeed />

          {/* 2. On-Chain Stats Grid */}
          <Suspense fallback={<OnChainSkeleton />}>
            <OnChainStatsGrid />
          </Suspense>

          {/* 3. Exchange Flows */}
          <Suspense fallback={<TableSkeleton />}>
            <ExchangeFlows />
          </Suspense>

          {/* 4. Notable Wallets */}
          <Suspense fallback={<TableSkeleton />}>
            <NotableWallets />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
