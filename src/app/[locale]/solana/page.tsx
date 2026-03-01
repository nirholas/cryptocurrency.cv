import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceChart from "@/components/PriceChart";
import { NewsCardCompact } from "@/components/NewsCard";
import { generateSEOMetadata } from "@/lib/seo";
import { getNewsByCategory } from "@/lib/crypto-news";
import { COINGECKO_BASE } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
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
} from "lucide-react";
import type { Metadata } from "next";

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
          Accept: "application/json",
          "User-Agent": "FreeCryptoNews/1.0",
        },
        next: { revalidate: 300 },
      }
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
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
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
  if (n == null) return "—";
  if (n >= 1)
    return `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  return `$${n.toPrecision(4)}`;
}

function formatLargeNumber(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatSupply(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

// Top Solana DeFi/DEX protocols (static data — could be fetched from API)
const TOP_SOLANA_PROTOCOLS: SolanaProtocol[] = [
  { name: "Jito", tvl: "$2.8B", category: "Liquid Staking" },
  { name: "Marinade Finance", tvl: "$1.6B", category: "Liquid Staking" },
  { name: "Raydium", tvl: "$1.2B", category: "DEX" },
  { name: "Jupiter", tvl: "$890M", category: "DEX Aggregator" },
  { name: "Orca", tvl: "$520M", category: "DEX" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Solana (SOL) — Price, Network Stats & News",
    description:
      "Live Solana price, TPS, validator count, staking data, and the latest SOL news. Top Solana DeFi protocols and ecosystem dashboard.",
    path: "/solana",
    locale,
    tags: [
      "solana",
      "SOL",
      "solana price",
      "solana TPS",
      "solana DeFi",
      "solana news",
      "cryptocurrency",
    ],
  });
}

export default async function SolanaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [solanaData, networkStats, newsResponse] = await Promise.all([
    fetchSolanaData(),
    fetchSolanaNetworkStats(),
    getNewsByCategory("solana", 10),
  ]);

  const md = solanaData?.market_data;
  const price = md?.current_price?.usd;
  const change24h = md?.price_change_percentage_24h;
  const isPositive = change24h != null && change24h >= 0;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-[var(--color-text-tertiary)] mb-6">
          <Link
            href="/"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[var(--color-text-primary)] font-medium">
            Solana
          </span>
        </nav>

        {/* ── Hero Section ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                Solana
              </h1>
              <span className="text-[var(--color-text-tertiary)] text-sm uppercase font-medium">
                SOL
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mt-4 flex-wrap">
            <span className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatPrice(price)}
            </span>
            {change24h != null && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full ${
                  isPositive
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {isPositive ? "+" : ""}
                {change24h.toFixed(2)}% (24h)
              </span>
            )}
            {md?.price_change_percentage_7d != null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${
                  md.price_change_percentage_7d >= 0
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                <span className="text-[10px]">7d</span>
                {md.price_change_percentage_7d >= 0 ? "+" : ""}
                {md.price_change_percentage_7d.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-3 text-sm text-[var(--color-text-secondary)] flex-wrap">
            {md?.ath?.usd && (
              <span>
                ATH: {formatPrice(md.ath.usd)}
                {md.ath_date?.usd && (
                  <span className="text-[var(--color-text-tertiary)] ml-1">
                    (
                    {new Date(md.ath_date.usd).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                    )
                  </span>
                )}
              </span>
            )}
            {md?.market_cap?.usd && (
              <span>Market Cap: {formatLargeNumber(md.market_cap.usd)}</span>
            )}
            {md?.total_volume?.usd && (
              <span>Volume (24h): {formatLargeNumber(md.total_volume.usd)}</span>
            )}
          </div>
        </section>

        {/* ── Network Stats ── */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Network Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              icon={<Zap className="h-4 w-4" />}
              label="TPS"
              value={
                networkStats.tps != null
                  ? `${networkStats.tps.toLocaleString()}`
                  : "~3,000"
              }
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Validators"
              value={
                networkStats.validators != null
                  ? networkStats.validators.toLocaleString()
                  : "~2,000"
              }
            />
            <StatCard
              icon={<Box className="h-4 w-4" />}
              label="Slot Height"
              value={
                networkStats.slotHeight != null
                  ? networkStats.slotHeight.toLocaleString()
                  : "—"
              }
            />
            <StatCard
              icon={<Lock className="h-4 w-4" />}
              label="SOL Staked"
              value={
                networkStats.solStaked != null
                  ? `${(networkStats.solStaked / 1e6).toFixed(1)}M SOL`
                  : "—"
              }
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Avg Fee"
              value={
                networkStats.avgFee != null
                  ? `$${networkStats.avgFee.toFixed(4)}`
                  : "~$0.0025"
              }
            />
          </div>
        </section>

        {/* ── Supply Info ── */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Circulating Supply
              </p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatSupply(md?.circulating_supply)}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Total Supply
              </p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatSupply(md?.total_supply)}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Inflationary model with decreasing issuance
              </p>
            </div>
          </div>
        </section>

        {/* ── Price Chart ── */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Price Chart
          </h2>
          <Suspense
            fallback={
              <div className="h-[370px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse" />
            }
          >
            <PriceChart coinId="solana" />
          </Suspense>
        </section>

        {/* ── Solana Ecosystem ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
              Solana Ecosystem
            </h2>
            <Link
              href="/defi"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              View all DeFi →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Protocol
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    TVL
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_SOLANA_PROTOCOLS.map((protocol, i) => (
                  <tr
                    key={protocol.name}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <td className="py-3 px-3 text-[var(--color-text-tertiary)]">
                      {i + 1}
                    </td>
                    <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#9945FF]" />
                        {protocol.name}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
                        {protocol.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-[var(--color-text-primary)] tabular-nums">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
                Latest Solana News
              </h2>
              <Link
                href="/search?q=solana"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
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
          <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] mb-4">
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
      <Footer />
    </>
  );
}

/* ── Helper Components ── */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
      <div className="flex items-center gap-2 mb-2 text-[var(--color-text-tertiary)]">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-lg font-semibold text-[var(--color-text-primary)] tabular-nums">
        {value}
      </p>
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
    <div className="flex flex-col gap-3 p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
      <div className="flex items-center gap-2 text-[#9945FF]">
        {icon}
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
