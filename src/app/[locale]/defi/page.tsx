/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import { NewsCardCompact } from '@/components/NewsCard';
import DefiTable, { type DefiProtocol } from '@/components/DefiTable';
import {
  ChainDistributionChart,
  CategoryBreakdown,
  YieldRiskTable,
  DexVolumeGrid,
  BridgeVolumeTable,
  StablecoinDominance,
  type YieldPoolData,
  type DexVolumeData,
  type BridgeVolumeData,
  type StablecoinEntry,
} from '@/components/DefiCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getDefiNews, type NewsResponse } from '@/lib/crypto-news';
import {
  getDefiSummary,
  getDexVolumes,
  getStablecoins,
  getBridges,
  type DefiSummary,
} from '@/lib/apis/defillama';
import { getTopYields } from '@/lib/defi-yields';
import { generateSEOMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'DeFi Dashboard — TVL, Yields, Protocols, DEX & Bridge Data',
    description:
      'Comprehensive DeFi dashboard with live TVL rankings, yield risk scoring, protocol analytics, DEX volumes, bridge stats, stablecoin dominance, chain distribution, and the latest DeFi news.',
    path: '/defi',
    locale,
    tags: [
      'defi',
      'tvl',
      'yield farming',
      'dex',
      'stablecoins',
      'protocols',
      'bridges',
      'crypto',
      'risk scoring',
    ],
  });
}

/* ── helpers ── */

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/* ── stat card ── */

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
  icon?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && 'ring-accent/20 bg-accent/3 ring-1')}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
            {label}
          </p>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <p className="text-text-primary text-xl font-bold tabular-nums md:text-2xl">{value}</p>
        {sub && <p className="text-text-secondary mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── section heading ── */

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <div>
        <h2 className="text-text-primary font-serif text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-text-tertiary mt-0.5 text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── quick links ── */

const QUICK_LINKS = [
  { label: 'Full Yield Explorer', href: '/api/defi/yields', icon: '🌾' },
  { label: 'DEX Volumes API', href: '/api/defi/dex-volumes', icon: '📊' },
  { label: 'Bridge Data API', href: '/api/defi/bridges', icon: '🌉' },
  { label: 'Stablecoin API', href: '/api/defi/stablecoins', icon: '💵' },
  { label: 'Protocol Health', href: '/api/defi/protocol-health', icon: '🩺' },
  { label: 'Gas Tracker', href: '/gas', icon: '⛽' },
  { label: 'DeFi News Feed', href: '/api/defi', icon: '📰' },
  { label: 'DeFi Summary API', href: '/api/defi/summary', icon: '📋' },
];

/* ── page ── */

export default async function DefiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  /* ── fetch all data in parallel ── */
  const [summaryResult, yieldsResult, newsResult, dexResult, stableResult, bridgeResult] =
    await Promise.allSettled([
      getDefiSummary(),
      getTopYields({ limit: 20 }),
      getDefiNews(9),
      getDexVolumes(),
      getStablecoins(),
      getBridges(),
    ]);

  const summary: DefiSummary | null =
    summaryResult.status === 'fulfilled' ? summaryResult.value : null;

  const yields = yieldsResult.status === 'fulfilled' ? yieldsResult.value : [];

  const newsData: NewsResponse | null = newsResult.status === 'fulfilled' ? newsResult.value : null;

  const dexVolumes = dexResult.status === 'fulfilled' ? dexResult.value : [];

  const stablecoins = stableResult.status === 'fulfilled' ? stableResult.value : [];

  const bridges = bridgeResult.status === 'fulfilled' ? bridgeResult.value : [];

  const articles = newsData?.articles ?? [];

  /* ── derive stats ── */
  const totalStablecoinMcap = stablecoins.reduce((sum, s) => {
    const circulating = Object.values(s.circulating ?? {}).reduce((a, b) => a + b, 0);
    return sum + circulating;
  }, 0);

  const totalDexVol24h = dexVolumes.reduce((s, d) => s + d.total24h, 0);
  const totalBridgeVol24h = bridges.reduce((s, b) => s + b.lastDailyVolume, 0);

  const stats = [
    {
      label: 'Total DeFi TVL',
      value: summary ? formatLargeNumber(summary.totalTvl) : '—',
      sub: summary ? `${formatPct(summary.totalTvlChange24h)} (24h)` : undefined,
      icon: '🏦',
      accent: true,
    },
    {
      label: 'DEX Volume (24h)',
      value: summary?.dexVolume24h
        ? formatLargeNumber(summary.dexVolume24h)
        : totalDexVol24h > 0
          ? formatLargeNumber(totalDexVol24h)
          : '—',
      icon: '📊',
    },
    {
      label: 'Stablecoin Supply',
      value: summary?.stablecoinSupply
        ? formatLargeNumber(summary.stablecoinSupply)
        : totalStablecoinMcap > 0
          ? formatLargeNumber(totalStablecoinMcap)
          : '—',
      icon: '💵',
    },
    {
      label: 'Active Protocols',
      value: summary ? summary.totalProtocols.toLocaleString() : '—',
      icon: '🔗',
    },
    {
      label: 'Bridge Volume (24h)',
      value: summary?.bridgeVolume24h
        ? formatLargeNumber(summary.bridgeVolume24h)
        : totalBridgeVol24h > 0
          ? formatLargeNumber(totalBridgeVol24h)
          : '—',
      icon: '🌉',
    },
    {
      label: 'Chains Tracked',
      value: summary ? Object.keys(summary.chainDistribution).length.toString() : '—',
      icon: '⛓️',
    },
  ];

  /* ── protocols for table ── */
  const protocols: DefiProtocol[] = (summary?.topProtocols ?? []).slice(0, 25).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    chain: p.chain,
    chains: p.chains,
    category: p.category,
    tvl: p.tvl,
    tvlChange24h: p.tvlChange24h,
    tvlChange7d: p.tvlChange7d,
    mcap: p.mcap,
    symbol: p.symbol,
    logo: p.logo,
    url: p.url,
    twitter: p.twitter,
    description: p.description,
    audits: p.audits,
  }));

  /* ── yields data for risk table ── */
  const yieldPoolData: YieldPoolData[] = yields
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 20)
    .map((y) => ({
      pool: y.pool,
      chain: y.chain,
      project: y.project,
      symbol: y.symbol,
      tvlUsd: y.tvlUsd,
      apy: y.apy,
      apyBase: y.apyBase,
      apyReward: y.apyReward,
      stablecoin: y.stablecoin,
      ilRisk: y.ilRisk,
      exposure: y.exposure,
      predictions: y.predictions ?? null,
      sigma: y.sigma,
      apyMean30d: y.apyMean30d,
      volumeUsd1d: y.volumeUsd1d,
    }));

  /* ── DEX volume data ── */
  const dexData: DexVolumeData[] = dexVolumes.map((d) => ({
    name: d.name,
    total24h: d.total24h,
    total7d: d.total7d,
    change_1d: d.change_1d,
    change_7d: d.change_7d,
    category: d.category,
  }));

  /* ── Bridge data ── */
  const bridgeData: BridgeVolumeData[] = bridges.map((b) => ({
    name: b.name,
    displayName: b.displayName,
    lastDailyVolume: b.lastDailyVolume,
    weeklyVolume: b.weeklyVolume,
    monthlyVolume: b.monthlyVolume,
    chains: b.chains,
  }));

  /* ── Stablecoin data ── */
  const stablecoinData: StablecoinEntry[] = stablecoins
    .filter((s) => !s.delisted)
    .map((s) => {
      const marketCap = Object.values(s.circulating ?? {}).reduce((a, b) => a + b, 0);
      return {
        name: s.name,
        symbol: s.symbol,
        marketCap,
        price: s.price,
        pegType: s.pegType,
      };
    })
    .filter((s) => s.marketCap > 0)
    .sort((a, b) => b.marketCap - a.marketCap);

  /* ── data freshness ── */
  const lastUpdated = summary?.timestamp
    ? new Date(summary.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <>
      <Header />
      <main className="container-main space-y-14 py-10">
        {/* ══════════ Hero ══════════ */}
        <section>
          <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
            🏦 DeFi Dashboard
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Comprehensive decentralized finance analytics — protocol rankings, yield risk scoring,
            DEX volumes, bridge activity, stablecoin dominance, and real-time DeFi news.
          </p>
          {lastUpdated && (
            <p className="text-text-tertiary mt-2 text-[10px]">Last updated: {lastUpdated} UTC</p>
          )}
        </section>

        {/* ══════════ 1. Stats Row ══════════ */}
        <section>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* ══════════ 2. Chain & Category Distribution ══════════ */}
        {summary && (
          <section>
            <SectionHeading
              title="Market Breakdown"
              subtitle="TVL distribution across chains and protocol categories"
              icon="🗺️"
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {Object.keys(summary.chainDistribution).length > 0 && (
                <ChainDistributionChart distribution={summary.chainDistribution} />
              )}
              {Object.keys(summary.categoryDistribution).length > 0 && (
                <CategoryBreakdown distribution={summary.categoryDistribution} />
              )}
            </div>
          </section>
        )}

        {/* ══════════ 3. Top Protocols Table ══════════ */}
        {protocols.length > 0 && (
          <section>
            <SectionHeading
              title="Top Protocols by TVL"
              subtitle={`${protocols.length} protocols · Click a row to expand details`}
              icon="🏆"
            />
            <DefiTable protocols={protocols} />
          </section>
        )}

        {/* ══════════ 4. Yield Risk Table ══════════ */}
        {yieldPoolData.length > 0 && (
          <section>
            <SectionHeading
              title="Yield Opportunities & Risk"
              subtitle="AI-scored risk analysis across DeFi yield pools"
              icon="🌾"
            />
            <YieldRiskTable pools={yieldPoolData} />
          </section>
        )}

        {/* ══════════ 5. DEX Volumes ══════════ */}
        {dexData.length > 0 && (
          <section>
            <SectionHeading
              title="DEX Trading Volume"
              subtitle="Top decentralized exchanges by 24-hour volume"
              icon="📊"
            />
            <DexVolumeGrid dexes={dexData} />
          </section>
        )}

        {/* ══════════ 6. Bridge Activity ══════════ */}
        {bridgeData.length > 0 && (
          <section>
            <SectionHeading
              title="Cross-Chain Bridges"
              subtitle="Volume flowing between chains in the last 24 hours"
              icon="🌉"
            />
            <BridgeVolumeTable bridges={bridgeData} />
          </section>
        )}

        {/* ══════════ 7. Stablecoin Dominance ══════════ */}
        {stablecoinData.length > 0 && (
          <section>
            <SectionHeading
              title="Stablecoin Market"
              subtitle="Market cap distribution and peg health"
              icon="💵"
            />
            <div className="max-w-2xl">
              <StablecoinDominance stablecoins={stablecoinData} />
            </div>
          </section>
        )}

        {/* ══════════ 8. DeFi News ══════════ */}
        <section>
          <SectionHeading
            title="Latest DeFi News"
            subtitle="Real-time news from top DeFi sources"
            icon="📰"
          />
          {articles.length === 0 ? (
            <p className="text-text-tertiary py-8 text-center">
              No DeFi articles available right now. Check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* ══════════ 9. Quick Links & API Explorer ══════════ */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">🔗 Quick Links & API Explorer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
      <PageShareSection
        title="DeFi Dashboard — Protocols, TVL & Yields"
        description="Track DeFi protocols, total value locked, yields, and DEX volumes."
        url={`https://cryptocurrency.cv/${locale}/defi`}
      />
      <Footer />
    </>
  );
}
