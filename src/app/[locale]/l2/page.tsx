/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/Card';
import L2Table, { type L2Row } from '@/components/L2Table';
import { cn } from '@/lib/utils';
import { Layers, TrendingUp, ArrowRightLeft, BarChart3 } from 'lucide-react';
import { internalFetch } from '@/lib/internal-fetch';
import { feesBySlug, getChainFees } from '@/lib/apis/growthepie';
import { formatCurrency } from '@/lib/format';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};


interface L2Project {
  id?: string;
  name: string;
  slug: string;
  type?: string;
  category?: string;
  tvl: number;
  tvlChange24h?: number;
  tvlChange7d?: number;
  stage?: string;
  purposes?: string[];
}

interface L2Activity {
  projectId: string;
  projectName: string;
  averageTps: number;
}

interface L2Summary {
  totalTvl: number;
  totalTvlChange24h?: number;
  totalProjects?: number;
  dominance?: Record<string, number>;
  topProjects?: L2Project[];
  activityMetrics?: { totalDailyTx: number; totalTps: number };
  timestamp?: string;
}

interface BridgeData {
  name: string;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume?: number;
  monthlyVolume?: number;
  chains?: string[];
  tvlUsd?: number;
  tvlChange1d?: number;
}

interface BridgesSummary {
  totalVolume24h?: number;
  totalVolume7d?: number;
  /** False when per-bridge volume is unavailable and only TVL is real */
  volumeAvailable?: boolean;
  bridges?: BridgeData[];
  topByVolume?: BridgeData[];
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await internalFetch(path, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Layer 2 Analytics — TVL, TPS, Fees & Bridge Data | Crypto Vision News',
    description:
      'Compare Ethereum Layer 2 scaling solutions including Arbitrum, Optimism, Base, zkSync, and more. Track TVL, transaction throughput, fees, and bridge volumes.',
    path: '/l2',
    locale,
    tags: [
      'layer 2',
      'L2',
      'rollups',
      'arbitrum',
      'optimism',
      'base',
      'zksync',
      'TVL',
      'ethereum scaling',
      'bridges',
      'crypto',
    ],
  });
}

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && 'ring-accent/20 bg-accent/[0.03] ring-1')}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
            {label}
          </p>
          <div className="text-accent opacity-60">{icon}</div>
        </div>
        <p className="text-text-primary text-xl font-bold tabular-nums md:text-2xl">{value}</p>
        {sub && <p className="text-text-secondary mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}


export default async function L2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [l2Result, activityResult, bridgeResult, feesResult] = await Promise.allSettled([
    fetchJSON<L2Summary>('/api/l2'),
    fetchJSON<L2Activity[]>('/api/l2/activity'),
    fetchJSON<BridgesSummary>('/api/bridges'),
    getChainFees(),
  ]);

  const l2Data = l2Result.status === 'fulfilled' ? l2Result.value : null;
  const activities =
    activityResult.status === 'fulfilled' && Array.isArray(activityResult.value)
      ? activityResult.value
      : [];
  const bridgeData = bridgeResult.status === 'fulfilled' ? bridgeResult.value : null;
  const fees = feesResult.status === 'fulfilled' ? feesResult.value : [];
  const feeBySlug = feesBySlug(fees);

  const topProjects = l2Data?.topProjects ?? [];
  const totalTps = l2Data?.activityMetrics?.totalTps ?? 0;
  const totalTvl = l2Data?.totalTvl ?? 0;
  const totalTvlChange24h = l2Data?.totalTvlChange24h ?? 0;
  const totalProjects = l2Data?.totalProjects ?? 0;

  // Build activity lookup
  const activityMap = new Map<string, L2Activity>();
  for (const a of activities) {
    activityMap.set(a.projectId, a);
  }

  // Transform to L2Row
  const l2Rows: L2Row[] = topProjects.map((p, idx) => {
    const activity = p.id ? activityMap.get(p.id) : undefined;
    const typeLabel = p.category ?? p.type ?? 'Rollup';
    const normalizedType = typeLabel.toLowerCase().includes('zk')
      ? 'ZK Rollup'
      : typeLabel.toLowerCase().includes('optimistic')
        ? 'Optimistic'
        : typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

    return {
      rank: idx + 1,
      name: p.name,
      slug: p.slug,
      type: normalizedType,
      tvl: p.tvl,
      tps: activity?.averageTps ?? 0,
      averageFee: feeBySlug.get(p.slug) ?? 0,
      change7d: p.tvlChange7d ?? 0,
      stage: p.stage,
    };
  });

  // Bridge data
  const bridges = bridgeData?.topByVolume ?? bridgeData?.bridges ?? [];
  const topBridges = bridges.slice(0, 8);
  const totalBridgeVolume =
    bridgeData?.totalVolume24h ?? bridges.reduce((s, b) => s + (b.lastDailyVolume ?? 0), 0);
  // DefiLlama's bridge volume API is paid; the free roster carries TVL only
  const bridgeVolumeAvailable = bridgeData?.volumeAvailable !== false;
  const totalBridgeTvl = bridges.reduce((s, b) => s + (b.tvlUsd ?? 0), 0);

  // Dominant L2
  const dominance = l2Data?.dominance ?? {};
  const topL2Name = Object.entries(dominance).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Max fee for comparison bar chart
  const maxFee = Math.max(0, ...fees.map((f) => f.usd));
  const feeHour = fees.length > 0 ? Math.max(...fees.map((f) => f.timestamp)) : null;

  return (
    <>
      <Header />
      <main className="container-main space-y-14 py-10">
        {/* Hero */}
        <section>
          <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
            ⛓️ Layer 2 Analytics
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Compare Ethereum Layer 2 scaling solutions — track TVL rankings, transaction throughput,
            fees, and cross-chain bridge activity.
          </p>
        </section>

        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <StatCard
              label="Total L2 TVL"
              value={totalTvl > 0 ? formatLargeNumber(totalTvl) : '—'}
              sub={totalTvlChange24h !== 0 ? `${formatPct(totalTvlChange24h)} (24h)` : undefined}
              icon={<Layers className="h-5 w-5" />}
              accent
            />
            <StatCard
              label="L2 Projects"
              value={totalProjects > 0 ? totalProjects.toString() : l2Rows.length.toString()}
              sub={totalTps > 0 ? `${totalTps.toFixed(0)} TPS combined` : undefined}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Top L2"
              value={topL2Name ?? l2Rows[0]?.name ?? '—'}
              sub={
                topL2Name && dominance[topL2Name]
                  ? `${dominance[topL2Name].toFixed(1)}% dominance`
                  : undefined
              }
              icon={<TrendingUp className="h-5 w-5" />}
            />
            {bridgeVolumeAvailable ? (
              <StatCard
                label="Bridge Volume (24h)"
                value={totalBridgeVolume > 0 ? formatLargeNumber(totalBridgeVolume) : '—'}
                icon={<ArrowRightLeft className="h-5 w-5" />}
              />
            ) : (
              <StatCard
                label="Bridge TVL"
                value={totalBridgeTvl > 0 ? formatLargeNumber(totalBridgeTvl) : '—'}
                sub={bridges.length > 0 ? `${bridges.length} bridges` : undefined}
                icon={<ArrowRightLeft className="h-5 w-5" />}
              />
            )}
          </div>
        </section>

        {/* L2 Comparison Table */}
        <section>
          <h2 className="text-text-primary mb-4 font-serif text-2xl font-bold">📊 L2 Comparison</h2>
          <L2Table l2s={l2Rows} />
        </section>

        {/* Bridge Volume */}
        {topBridges.length > 0 && (
          <section>
            <h2 className="text-text-primary mb-4 font-serif text-2xl font-bold">
              {bridgeVolumeAvailable ? '🌉 Cross-Chain Bridge Volume' : '🌉 Cross-Chain Bridges'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topBridges.map((bridge) => (
                <Card key={bridge.name}>
                  <CardContent className="p-4">
                    <p className="text-text-primary mb-1 font-medium">
                      {bridge.displayName || bridge.name}
                    </p>
                    <p className="text-text-primary font-mono text-xl font-bold">
                      {formatLargeNumber(
                        bridgeVolumeAvailable ? bridge.lastDailyVolume : (bridge.tvlUsd ?? 0),
                      )}
                    </p>
                    <p className="text-text-tertiary mt-1 text-[10px] tracking-wider uppercase">
                      {bridgeVolumeAvailable
                        ? '24h volume'
                        : bridge.tvlChange1d
                          ? `TVL · ${formatPct(bridge.tvlChange1d)} (24h)`
                          : 'TVL'}
                    </p>
                    {bridge.chains && bridge.chains.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bridge.chains.slice(0, 4).map((chain) => (
                          <span
                            key={chain}
                            className="bg-surface-tertiary text-text-tertiary rounded px-1.5 py-0.5 text-[10px]"
                          >
                            {chain}
                          </span>
                        ))}
                        {bridge.chains.length > 4 && (
                          <span className="bg-surface-tertiary text-text-tertiary rounded px-1.5 py-0.5 text-[10px]">
                            +{bridge.chains.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Fee Comparison */}
        <section>
          <h2 className="text-text-primary mb-4 font-serif text-2xl font-bold">
            ⛽ Fee Comparison
          </h2>
          <Card>
            <CardContent className="p-6">
              {fees.length === 0 || feeHour === null ? (
                <p className="text-text-secondary text-sm">
                  Live fee data is unavailable right now. Check back shortly.
                </p>
              ) : (
                <>
                  <p className="text-text-tertiary mb-4 text-xs">
                    Median transaction cost on Ethereum L1 and its L2 networks for the hour starting{' '}
                    {new Date(feeHour).toISOString().slice(0, 16).replace('T', ' ')} UTC
                  </p>
                  <div className="space-y-4">
                    {fees.map((item) => {
                      const barWidth = maxFee > 0 ? (item.usd / maxFee) * 100 : 0;
                      return (
                        <div key={item.chain} className="flex items-center gap-4">
                          <span className="text-text-primary w-32 shrink-0 truncate text-sm font-medium">
                            {item.name}
                          </span>
                          <div className="bg-surface-tertiary relative h-6 flex-1 overflow-hidden rounded">
                            <div
                              className={cn(
                                'h-full rounded transition-all duration-500',
                                item.chain === 'ethereum' ? 'bg-accent' : 'bg-accent/60',
                              )}
                              style={{ width: `${barWidth}%`, minWidth: '2px' }}
                            />
                          </div>
                          <span className="text-text-primary w-24 text-right font-mono text-sm">
                            {formatCurrency(item.usd)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-text-tertiary mt-4 text-[10px]">
                    * Median fee per transaction, priced in USD from the ETH cost. Source:{' '}
                    <a
                      href="https://www.growthepie.com/fees"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-primary underline"
                    >
                      growthepie
                    </a>
                    .
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}
