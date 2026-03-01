/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import {
  Fuel,
  Lightbulb,
  Zap,
  Activity,
  Clock,
  ArrowRight,
  TrendingDown,
  Shield,
  Layers,
  Info,
} from "lucide-react";
import type { Metadata } from "next";

// ---------- Types ------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

interface GasLevel {
  gwei: number;
  usd: number | null;
}

interface GasData {
  network: string;
  baseFee: number | null;
  low: GasLevel;
  medium: GasLevel;
  high: GasLevel;
  lastBlock: string | null;
  timestamp: string;
  source: string;
}

// ---------- Constants --------------------------------------------------------

const GAS_ACTIONS = [
  { label: "ETH Transfer", gasUnits: 21_000, icon: "💸", category: "basic" },
  { label: "ERC-20 Transfer", gasUnits: 65_000, icon: "🪙", category: "basic" },
  { label: "ERC-20 Approve", gasUnits: 46_000, icon: "✅", category: "basic" },
  { label: "Uniswap V3 Swap", gasUnits: 150_000, icon: "🔄", category: "defi" },
  { label: "Aave Deposit", gasUnits: 250_000, icon: "🏛️", category: "defi" },
  { label: "Curve Swap", gasUnits: 300_000, icon: "📈", category: "defi" },
  { label: "NFT Mint (ERC-721)", gasUnits: 200_000, icon: "🎨", category: "nft" },
  { label: "OpenSea Sale", gasUnits: 250_000, icon: "🏪", category: "nft" },
  { label: "ENS Registration", gasUnits: 300_000, icon: "📛", category: "other" },
  { label: "Contract Deploy", gasUnits: 1_500_000, icon: "🏗️", category: "other" },
  { label: "Gnosis Safe Tx", gasUnits: 100_000, icon: "🔐", category: "other" },
] as const;

const SPEED_CARDS = [
  {
    key: "low" as const,
    emoji: "🐢",
    label: "Slow",
    desc: "~10 min",
    barColor: "bg-green-500",
    borderColor: "border-green-500/20",
  },
  {
    key: "medium" as const,
    emoji: "⚡",
    label: "Standard",
    desc: "~3 min",
    barColor: "bg-[var(--color-accent)]",
    borderColor: "border-[var(--color-accent)]/20",
  },
  {
    key: "high" as const,
    emoji: "🚀",
    label: "Fast",
    desc: "~30 sec",
    barColor: "bg-orange-500",
    borderColor: "border-orange-500/20",
  },
];

const TIPS = [
  {
    title: "Time it right",
    tip: "Gas is typically lowest on weekends and between 2–5 AM UTC. Set price alerts for your target gwei.",
    icon: Clock,
  },
  {
    title: "Batch transactions",
    tip: "Bundle multiple operations into a single multicall transaction to save 30-50% on gas overhead.",
    icon: Layers,
  },
  {
    title: "Use Layer 2 networks",
    tip: "Arbitrum, Optimism, Base, and zkSync offer 10–100× cheaper transactions with Ethereum-level security.",
    icon: Zap,
  },
  {
    title: "Set max fee wisely",
    tip: "Wallets let you customize max fee & priority tip. Set your comfort level — you only pay what's needed.",
    icon: Shield,
  },
  {
    title: "Avoid peak hours",
    tip: "Token launches, NFT drops, and US market open (13:30 UTC) spike gas. Wait for congestion to clear.",
    icon: TrendingDown,
  },
];

const L2_NETWORKS = [
  { name: "Arbitrum One", ratio: 0.01, color: "#28A0F0" },
  { name: "Optimism", ratio: 0.015, color: "#FF0420" },
  { name: "Base", ratio: 0.008, color: "#0052FF" },
  { name: "zkSync Era", ratio: 0.02, color: "#8C8DFC" },
  { name: "Polygon zkEVM", ratio: 0.012, color: "#7B3FE4" },
];

const ACTION_CATEGORIES = [
  { key: "basic", label: "Basic", icon: "💳" },
  { key: "defi", label: "DeFi", icon: "🏦" },
  { key: "nft", label: "NFT", icon: "🎨" },
  { key: "other", label: "Other", icon: "⚙️" },
] as const;

// ---------- Helpers ----------------------------------------------------------

function estimateUsd(
  _gwei: number,
  gasUnits: number,
  baseUsdFor21k: number | null,
): string {
  if (baseUsdFor21k === null) return "—";
  const usd = (baseUsdFor21k / 21_000) * gasUnits;
  if (usd < 0.01) return "<$0.01";
  return formatCurrency(usd);
}

function estimateUsdRaw(
  _gwei: number,
  gasUnits: number,
  baseUsdFor21k: number | null,
): number | null {
  if (baseUsdFor21k === null) return null;
  return (baseUsdFor21k / 21_000) * gasUnits;
}

function getGasStatus(medianGwei: number) {
  if (medianGwei <= 15)
    return { label: "Very Low", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", msg: "Excellent time to transact — gas is well below average." };
  if (medianGwei <= 40)
    return { label: "Low", color: "text-green-500 dark:text-green-400", bg: "bg-green-500/10", msg: "Good time to transact — gas is below average." };
  if (medianGwei <= 80)
    return { label: "Normal", color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-500/10", msg: "Gas is at typical levels. Standard fees expected." };
  if (medianGwei <= 150)
    return { label: "High", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", msg: "Network is busy. Consider waiting or using an L2." };
  return { label: "Very High", color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", msg: "Network is congested. Delay non-urgent transactions or use L2." };
}

// ---------- Data fetcher -----------------------------------------------------

const BASE = SITE_URL;

async function fetchGas(): Promise<GasData | null> {
  try {
    const res = await fetch(`${BASE}/api/gas`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as GasData;
  } catch {
    return null;
  }
}

// ---------- Metadata ---------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Ethereum Gas Tracker — Free Crypto News",
    description:
      "Live Ethereum gas prices in gwei with estimated USD costs for transfers, swaps, NFT mints, and contract deployments. Layer 2 fee comparison included.",
    path: "/gas",
    locale,
    tags: ["ethereum gas", "gas tracker", "gwei", "eth gas fees", "gas prices", "layer 2 fees"],
  });
}

// ---------- Sub-components ---------------------------------------------------

function CongestionMeter({ medianGwei }: { medianGwei: number }) {
  const status = getGasStatus(medianGwei);
  const fillPct = Math.min((medianGwei / 200) * 100, 100);

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--color-text-tertiary)]" />
          <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">
            Network Congestion
          </h2>
        </div>
        <Badge className={`${status.bg} ${status.color} border-0`}>{status.label}</Badge>
      </div>

      <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-green-500/20 via-yellow-500/20 via-orange-500/20 to-red-500/20 mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 transition-all duration-700"
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute top-0 -ml-1 w-2 h-4 bg-white dark:bg-gray-900 rounded-full border-2 border-[var(--color-text-primary)] transition-all duration-700"
          style={{ left: `${fillPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mb-3">
        <span>Low (0)</span>
        <span>Normal (50)</span>
        <span>High (100)</span>
        <span>Very High (200+)</span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">{status.msg}</p>
    </Card>
  );
}

function L2Comparison({ gas }: { gas: GasData }) {
  const ethTransferUsd = estimateUsdRaw(gas.medium.gwei, 21_000, gas.medium.usd);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-[var(--color-accent)]" />
        <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">
          L1 vs Layer 2 Fees
        </h2>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Estimated cost for a standard ETH transfer on L2 networks vs Ethereum mainnet.
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-28 text-sm font-medium text-[var(--color-text-primary)] shrink-0">Ethereum L1</span>
          <div className="flex-1 h-7 rounded bg-[var(--color-surface-secondary)] overflow-hidden">
            <div className="h-full rounded bg-[var(--color-accent)] flex items-center justify-end pr-2 transition-all" style={{ width: "100%" }}>
              <span className="text-xs font-medium text-white">
                {ethTransferUsd !== null ? formatCurrency(ethTransferUsd) : `${gas.medium.gwei} gwei`}
              </span>
            </div>
          </div>
          <span className="w-14" />
        </div>
        {L2_NETWORKS.map((l2) => {
          const l2Cost = ethTransferUsd !== null ? ethTransferUsd * l2.ratio : null;
          const barPct = Math.max(l2.ratio * 100, 3);
          const savings = ethTransferUsd !== null && l2Cost !== null ? ((1 - l2.ratio) * 100).toFixed(0) : null;
          return (
            <div key={l2.name} className="flex items-center gap-3">
              <span className="w-28 text-sm text-[var(--color-text-secondary)] shrink-0">{l2.name}</span>
              <div className="flex-1 h-7 rounded bg-[var(--color-surface-secondary)] overflow-hidden">
                <div
                  className="h-full rounded flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${barPct}%`, backgroundColor: l2.color, minWidth: "60px" }}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {l2Cost !== null ? (l2Cost < 0.01 ? "<$0.01" : formatCurrency(l2Cost)) : "—"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-green-500 dark:text-green-400 shrink-0 w-14 text-right">
                {savings ? `-${savings}%` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- Page component ---------------------------------------------------

export const revalidate = 30;

export default async function GasPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const gas = await fetchGas();

  return (
    <>
      <Header />
      <main className="container-main py-8">
        {/* Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Fuel className="h-7 w-7 text-[var(--color-accent)]" />
            <h1 className="font-serif text-3xl font-bold text-[var(--color-text-primary)]">
              Ethereum Gas Tracker
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] max-w-2xl">
            Live gas prices on Ethereum mainnet with estimated USD costs for common on-chain actions.
            Compare Layer 2 fees and find the best time to transact.
          </p>
          {gas && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)] px-2.5 py-1 rounded-full">
                <span className="live-dot" /> Live
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">Source: {gas.source}</span>
              {gas.lastBlock && (
                <span className="text-xs text-[var(--color-text-tertiary)]">Block #{gas.lastBlock}</span>
              )}
              {gas.baseFee !== null && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  Base fee: {gas.baseFee.toFixed(1)} gwei
                </span>
              )}
            </div>
          )}
        </div>

        {!gas ? (
          <Card className="p-10 text-center">
            <Fuel className="h-10 w-10 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="text-[var(--color-text-secondary)] mb-2">Unable to load gas data. Please try again shortly.</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Gas data is fetched live from Etherscan.</p>
          </Card>
        ) : (
          <>
            {/* Congestion Meter */}
            <CongestionMeter medianGwei={gas.medium.gwei} />

            {/* Speed Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {SPEED_CARDS.map(({ key, emoji, label, desc, barColor, borderColor }) => {
                const level = gas[key];
                return (
                  <Card key={key} className={`p-6 border ${borderColor}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" role="img" aria-label={label}>{emoji}</span>
                        <div>
                          <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">{label}</h2>
                          <p className="text-xs text-[var(--color-text-tertiary)]">{desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[var(--color-accent)]">{level.gwei}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">gwei</p>
                      </div>
                    </div>

                    {level.usd !== null && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                        ≈ {formatCurrency(level.usd)} for a basic transfer
                      </p>
                    )}

                    {key !== "high" && gas.high.usd !== null && level.usd !== null && gas.high.usd > 0 && (
                      <p className="text-xs text-green-500 dark:text-green-400">
                        Save {(((gas.high.usd - level.usd) / gas.high.usd) * 100).toFixed(0)}% vs Fast
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Transaction Cost Estimator */}
            <Card className="p-6 mb-8">
              <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                Transaction Cost Estimator
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Estimated costs at current gas prices for common Ethereum operations.
              </p>

              {ACTION_CATEGORIES.map((cat) => {
                const actions = GAS_ACTIONS.filter((a) => a.category === cat.key);
                if (actions.length === 0) return null;
                return (
                  <div key={cat.key} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>{cat.icon}</span> {cat.label}
                    </h3>
                    <div className="border border-[var(--color-border)] rounded-lg overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="bg-[var(--color-surface-secondary)]">
                            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-tertiary)]">Action</th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--color-text-tertiary)] hidden sm:table-cell">Gas Units</th>
                            {SPEED_CARDS.map((s) => (
                              <th key={s.key} className="px-3 py-2 text-right font-medium text-[var(--color-text-tertiary)]">
                                {s.emoji} {s.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {actions.map((action) => (
                            <tr key={action.label} className="border-t border-[var(--color-border)]">
                              <td className="px-4 py-2.5 text-[var(--color-text-primary)]">
                                <span className="mr-1.5">{action.icon}</span>{action.label}
                              </td>
                              <td className="px-3 py-2.5 text-right text-[var(--color-text-tertiary)] hidden sm:table-cell">
                                {action.gasUnits.toLocaleString()}
                              </td>
                              {SPEED_CARDS.map((s) => (
                                <td key={s.key} className="px-3 py-2.5 text-right font-medium text-[var(--color-text-primary)]">
                                  {estimateUsd(gas[s.key].gwei, action.gasUnits, gas[s.key].usd)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Gas Price Bars */}
            <Card className="p-6 mb-8">
              <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Gas Price Comparison
              </h2>
              <div className="space-y-3">
                {SPEED_CARDS.map(({ key, label, emoji, barColor }) => {
                  const level = gas[key];
                  const maxGwei = Math.max(gas.low.gwei, gas.medium.gwei, gas.high.gwei, 1);
                  const pct = (level.gwei / maxGwei) * 100;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">{emoji} {label}</span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {level.gwei} gwei
                          {level.usd !== null && (
                            <span className="text-[var(--color-text-tertiary)] ml-1">({formatCurrency(level.usd)})</span>
                          )}
                        </span>
                      </div>
                      <div className="h-4 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {gas.high.gwei > 0 && gas.low.gwei > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Fast/Slow Spread</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {(gas.high.gwei / gas.low.gwei).toFixed(1)}×
                    <span className="text-[var(--color-text-tertiary)] ml-1">
                      ({gas.high.gwei - gas.low.gwei} gwei difference)
                    </span>
                  </span>
                </div>
              )}
            </Card>

            {/* L2 Comparison */}
            <div className="mb-8">
              <L2Comparison gas={gas} />
            </div>

            {/* Educational Section */}
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-[var(--color-accent)]" />
                <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">
                  Understanding Ethereum Gas
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[var(--color-surface-secondary)]">
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <Fuel className="h-4 w-4 text-[var(--color-accent)]" /> What is Gas?
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Gas measures computational effort to execute transactions on Ethereum. More complex operations use more gas.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-surface-secondary)]">
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[var(--color-accent)]" /> Gwei Explained
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Gwei (gigawei) is a denomination of ETH. 1 ETH = 1 billion gwei. Gas prices are quoted in gwei per unit of gas.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-surface-secondary)]">
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                    <ArrowRight className="h-4 w-4 text-[var(--color-accent)]" /> EIP-1559
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Since EIP-1559, fees comprise a base fee (burned) plus an optional priority tip. The base fee adjusts automatically with demand.
                  </p>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h2 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">
                  Tips to Save on Gas
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div key={tip.title} className="p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                        <h3 className="font-medium text-sm text-[var(--color-text-primary)]">{tip.title}</h3>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{tip.tip}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
