import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import PriceChart from '@/components/PriceChart';
import { NewsCardCompact } from '@/components/NewsCard';
import { generateSEOMetadata } from '@/lib/seo';
import { getNewsByCategory } from '@/lib/crypto-news';
import { COINGECKO_BASE } from '@/lib/constants';
import { Link } from '@/i18n/navigation';
import {
  ChevronRight,
  Activity,
  Users,
  Box,
  Lock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

interface SolanaData {
  id: string;
  symbol: string;
  name: string;
  market_data?: {
    current_price?: { usd?: number };
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    ath?: { usd?: number };
    ath_date?: { usd?: string };
    circulating_supply?: number;
    total_supply?: number;
  };
}

interface SolanaNetworkStats {
  tps?: number;
  validators?: number;
  slotHeight?: number;
  solStaked?: number;
  avgFee?: number;
}

interface SolanaProtocol {
  name: string;
  tvl: string;
  category: string;
}

async function fetchSolanaData(): Promise<SolanaData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/solana?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FreeCryptoNews/1.0',
        },
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchSolanaNetworkStats(): Promise<SolanaNetworkStats> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/solana`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function formatPrice(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 1)
    return `$${n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  return `$${n.toPrecision(4)}`;
}

function formatLargeNumber(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatSupply(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

// Top Solana DeFi/DEX protocols (static data — could be fetched from API)
const TOP_SOLANA_PROTOCOLS: SolanaProtocol[] = [
  { name: 'Jito', tvl: '$2.8B', category: 'Liquid Staking' },
  { name: 'Marinade Finance', tvl: '$1.6B', category: 'Liquid Staking' },
  { name: 'Raydium', tvl: '$1.2B', category: 'DEX' },
  { name: 'Jupiter', tvl: '$890M', category: 'DEX Aggregator' },
  { name: 'Orca', tvl: '$520M', category: 'DEX' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Solana (SOL) — Price, Network Stats & News',
    description:
      'Live Solana price, TPS, validator count, staking data, and the latest SOL news. Top Solana DeFi protocols and ecosystem dashboard.',
    path: '/solana',
    locale,
    tags: [
      'solana',
      'SOL',
      'solana price',
      'solana TPS',
      'solana DeFi',
      'solana news',
      'cryptocurrency',
    ],
  });
}

export default async function SolanaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [solResult, netResult, newsResult] = await Promise.allSettled([
    fetchSolanaData(),
    fetchSolanaNetworkStats(),
    getNewsByCategory('solana', 10),
  ]);

  const solanaData = solResult.status === 'fulfilled' ? solResult.value : null;
  const networkStats = netResult.status === 'fulfilled' ? netResult.value : {};
  const newsResponse = newsResult.status === 'fulfilled' ? newsResult.value : { articles: [], totalCount: 0, sources: [], fetchedAt: new Date().toISOString() };

  const md = solanaData?.market_data;
  const price = md?.current_price?.usd;
  const change24h = md?.price_change_percentage_24h;
  const isPositive = change24h != null && change24h >= 0;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav className="text-text-tertiary mb-6 flex items-center gap-1 text-sm">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-primary font-medium">Solana</span>
        </nav>

        {/* ── Hero Section ── */}
        <section className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#9945FF] to-[#14F195] text-lg font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-text-primary font-serif text-3xl font-bold md:text-4xl">
                Solana
              </h1>
              <span className="text-text-tertiary text-sm font-medium uppercase">SOL</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-4">
            <span className="text-text-primary text-4xl font-bold tabular-nums md:text-5xl">
              {formatPrice(price)}
            </span>
            {change24h != null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                  isPositive
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {isPositive ? '+' : ''}
                {change24h.toFixed(2)}% (24h)
              </span>
            )}
            {md?.price_change_percentage_7d != null && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                  md.price_change_percentage_7d >= 0
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                <span className="text-[10px]">7d</span>
                {md.price_change_percentage_7d >= 0 ? '+' : ''}
                {md.price_change_percentage_7d.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="text-text-secondary mt-3 flex flex-wrap items-center gap-6 text-sm">
            {md?.ath?.usd && (
              <span>
                ATH: {formatPrice(md.ath.usd)}
                {md.ath_date?.usd && (
                  <span className="text-text-tertiary ml-1">
                    (
                    {new Date(md.ath_date.usd).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                    )
                  </span>
                )}
              </span>
            )}
            {md?.market_cap?.usd && <span>Market Cap: {formatLargeNumber(md.market_cap.usd)}</span>}
            {md?.total_volume?.usd && (
              <span>Volume (24h): {formatLargeNumber(md.total_volume.usd)}</span>
            )}
          </div>
        </section>

        {/* ── Network Stats ── */}
        <section className="mb-10">
          <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">
            Network Statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon={<Zap className="h-4 w-4" />}
              label="TPS"
              value={networkStats.tps != null ? `${networkStats.tps.toLocaleString()}` : '~3,000'}
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Validators"
              value={
                networkStats.validators != null
                  ? networkStats.validators.toLocaleString()
                  : '~2,000'
              }
            />
            <StatCard
              icon={<Box className="h-4 w-4" />}
              label="Slot Height"
              value={
                networkStats.slotHeight != null ? networkStats.slotHeight.toLocaleString() : '—'
              }
            />
            <StatCard
              icon={<Lock className="h-4 w-4" />}
              label="SOL Staked"
              value={
                networkStats.solStaked != null
                  ? `${(networkStats.solStaked / 1e6).toFixed(1)}M SOL`
                  : '—'
              }
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Avg Fee"
              value={
                networkStats.avgFee != null ? `$${networkStats.avgFee.toFixed(4)}` : '~$0.0025'
              }
            />
          </div>
        </section>

        {/* ── Supply Info ── */}
        <section className="mb-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-border bg-surface-secondary rounded-lg border p-4">
              <p className="text-text-tertiary mb-1 text-xs">Circulating Supply</p>
              <p className="text-text-primary text-lg font-semibold">
                {formatSupply(md?.circulating_supply)}
              </p>
            </div>
            <div className="border-border bg-surface-secondary rounded-lg border p-4">
              <p className="text-text-tertiary mb-1 text-xs">Total Supply</p>
              <p className="text-text-primary text-lg font-semibold">
                {formatSupply(md?.total_supply)}
              </p>
              <p className="text-text-tertiary mt-0.5 text-xs">
                Inflationary model with decreasing issuance
              </p>
            </div>
          </div>
        </section>

        {/* ── Price Chart ── */}
        <section className="mb-10">
          <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">Price Chart</h2>
          <Suspense
            fallback={
              <div className="border-border h-92.5 animate-pulse rounded-xl border bg-(--color-surface)" />
            }
          >
            <PriceChart coinId="solana" />
          </Suspense>
        </section>

        {/* ── Solana Ecosystem ── */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary font-serif text-xl font-bold">Solana Ecosystem</h2>
            <Link href="/defi" className="text-accent text-sm hover:underline">
              View all DeFi →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-text-tertiary px-3 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    #
                  </th>
                  <th className="text-text-tertiary px-3 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Protocol
                  </th>
                  <th className="text-text-tertiary px-3 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Category
                  </th>
                  <th className="text-text-tertiary px-3 py-3 text-right text-xs font-medium tracking-wider uppercase">
                    TVL
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_SOLANA_PROTOCOLS.map((protocol, i) => (
                  <tr
                    key={protocol.name}
                    className="border-border hover:bg-surface-secondary border-b transition-colors"
                  >
                    <td className="text-text-tertiary px-3 py-3">{i + 1}</td>
                    <td className="text-text-primary px-3 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#9945FF]" />
                        {protocol.name}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="bg-surface-tertiary text-text-secondary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                        {protocol.category}
                      </span>
                    </td>
                    <td className="text-text-primary px-3 py-3 text-right font-medium tabular-nums">
                      {protocol.tvl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Solana News ── */}
        {newsResponse.articles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text-primary font-serif text-xl font-bold">Latest Solana News</h2>
              <Link href="/search?q=solana" className="text-accent text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {newsResponse.articles.map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* ── Why Solana ── */}
        <section className="mb-10">
          <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">
            What Makes Solana Unique
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="High Throughput"
              description="Solana processes thousands of transactions per second with sub-second finality, making it one of the fastest blockchains."
            />
            <FeatureCard
              icon={<DollarSign className="h-5 w-5" />}
              title="Low Fees"
              description="Transaction fees average fractions of a cent, enabling micro-transactions and high-frequency use cases."
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="Growing Ecosystem"
              description="A vibrant ecosystem of DeFi, NFTs, gaming, and payments applications built on Solana's high-performance chain."
            />
          </div>
        </section>
      </main>
      <PageShareSection
        title="Solana (SOL) — Price, News & Ecosystem"
        description="Live Solana price, TPS stats, ecosystem overview, and latest SOL news."
        url={`https://cryptocurrency.cv/${locale}/solana`}
      />
      <Footer />
    </>
  );
}

/* ── Helper Components ── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-border bg-surface-secondary rounded-lg border p-4">
      <div className="text-text-tertiary mb-2 flex items-center gap-2">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-text-primary text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-surface-secondary flex flex-col gap-3 rounded-lg border p-5">
      <div className="flex items-center gap-2 text-[#9945FF]">
        {icon}
        <h3 className="text-text-primary font-semibold">{title}</h3>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </div>
  );
}
