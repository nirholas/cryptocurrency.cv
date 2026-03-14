import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import L2Table, { type L2Row } from '@/components/L2Table';
import { cn } from '@/lib/utils';
import { Layers, TrendingUp, Zap, ArrowRightLeft, BarChart3, DollarSign } from 'lucide-react';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE = SITE_URL;

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
  projectId?: string;
  projectName?: string;
  averageTps?: number;
}

interface L2Summary {
  totalTvl: number;
  totalTvlChange24h?: number;
  totalProjects?: number;
  dominance?: Record<string, number>;
  topProjects?: L2Project[];
  activityMetrics?: L2Activity[];
  timestamp?: string;
}

interface BridgeData {
  name: string;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume?: number;
  monthlyVolume?: number;
  chains?: string[];
}

interface BridgesSummary {
  totalVolume24h?: number;
  totalVolume7d?: number;
  bridges?: BridgeData[];
  topByVolume?: BridgeData[];
}

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
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

// Average fee data (approximate, for comparison display)
const FEE_COMPARISON = [
  { name: 'Ethereum L1', fee: 3.5, color: '#627eea' },
  { name: 'Arbitrum', fee: 0.1, color: '#28a0f0' },
  { name: 'Optimism', fee: 0.07, color: '#ff0420' },
  { name: 'Base', fee: 0.03, color: '#0052ff' },
  { name: 'zkSync', fee: 0.05, color: '#8b8dfc' },
];

export default async function L2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [l2Result, bridgeResult] = await Promise.allSettled([
    fetchJSON<L2Summary>('/api/l2'),
    fetchJSON<BridgesSummary>('/api/bridges'),
  ]);

  const l2Data = l2Result.status === 'fulfilled' ? l2Result.value : null;
  const bridgeData = bridgeResult.status === 'fulfilled' ? bridgeResult.value : null;

  const topProjects = l2Data?.topProjects ?? [];
  const activityMetrics = l2Data?.activityMetrics ?? [];
  const totalTvl = l2Data?.totalTvl ?? 0;
  const totalTvlChange24h = l2Data?.totalTvlChange24h ?? 0;
  const totalProjects = l2Data?.totalProjects ?? 0;

  // Build activity lookup
  const activityMap = new Map<string, L2Activity>();
  for (const a of activityMetrics) {
    if (a.projectName) {
      activityMap.set(a.projectName.toLowerCase(), a);
    }
  }

  // Transform to L2Row
  const l2Rows: L2Row[] = topProjects.map((p, idx) => {
    const activity = activityMap.get(p.name.toLowerCase());
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
      averageFee: 0,
      change7d: p.tvlChange7d ?? 0,
      stage: p.stage,
    };
  });

  // Bridge data
  const bridges = bridgeData?.topByVolume ?? bridgeData?.bridges ?? [];
  const topBridges = bridges.slice(0, 8);
  const totalBridgeVolume =
    bridgeData?.totalVolume24h ?? bridges.reduce((s, b) => s + (b.lastDailyVolume ?? 0), 0);

  // Dominant L2
  const dominance = l2Data?.dominance ?? {};
  const topL2Name = Object.entries(dominance).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Max fee for comparison bar chart
  const maxFee = Math.max(...FEE_COMPARISON.map((f) => f.fee));

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
            <StatCard
              label="Bridge Volume (24h)"
              value={totalBridgeVolume > 0 ? formatLargeNumber(totalBridgeVolume) : '—'}
              icon={<ArrowRightLeft className="h-5 w-5" />}
            />
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
              🌉 Cross-Chain Bridge Volume
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topBridges.map((bridge) => (
                <Card key={bridge.name}>
                  <CardContent className="p-4">
                    <p className="text-text-primary mb-1 font-medium">
                      {bridge.displayName || bridge.name}
                    </p>
                    <p className="text-text-primary font-mono text-xl font-bold">
                      {formatLargeNumber(bridge.lastDailyVolume)}
                    </p>
                    <p className="text-text-tertiary mt-1 text-[10px] tracking-wider uppercase">
                      24h volume
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
              <p className="text-text-tertiary mb-4 text-xs">
                Average transaction costs across Ethereum L1 and major L2 networks (approximate)
              </p>
              <div className="space-y-4">
                {FEE_COMPARISON.map((item) => {
                  const barWidth = maxFee > 0 ? (item.fee / maxFee) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-4">
                      <span className="text-text-primary w-28 shrink-0 text-sm font-medium">
                        {item.name}
                      </span>
                      <div className="bg-surface-tertiary relative h-6 flex-1 overflow-hidden rounded">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: item.color,
                            minWidth: '2px',
                          }}
                        />
                      </div>
                      <span className="text-text-primary w-16 text-right font-mono text-sm">
                        ${item.fee.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-text-tertiary mt-4 text-[10px]">
                * Fees are approximate averages and vary based on network congestion and transaction
                complexity.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}
