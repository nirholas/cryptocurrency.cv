import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShareSection from "@/components/PageShareSection";
import PriceChart from "@/components/PriceChart";
import { NewsCardCompact } from "@/components/NewsCard";
import { generateSEOMetadata } from "@/lib/seo";
import { getEthereumNews } from "@/lib/crypto-news";
import { COINGECKO_BASE } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import {
  ChevronRight,
  Fuel,
  Percent,
  Lock,
  Flame,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Layers,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

interface EthereumData {
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

interface EthNetworkStats {
  gasPrice?: number; // gwei
  stakingApr?: number;
  totalStaked?: number;
  burnRate?: number;
  activeValidators?: number;
  tps?: number;
}

interface DefiProtocol {
  name: string;
  tvl: string;
  chain: string;
  category: string;
}

async function fetchEthereumData(): Promise<EthereumData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
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

async function fetchEthNetworkStats(): Promise<EthNetworkStats> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/ethereum`, {
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

// Top DeFi protocols on Ethereum (static data — could be fetched from API)
const TOP_DEFI_PROTOCOLS: DefiProtocol[] = [
  { name: "Lido", tvl: "$14.2B", chain: "Ethereum", category: "Liquid Staking" },
  { name: "Aave", tvl: "$11.8B", chain: "Ethereum", category: "Lending" },
  { name: "Maker (Sky)", tvl: "$8.1B", chain: "Ethereum", category: "CDP" },
  { name: "EigenLayer", tvl: "$6.9B", chain: "Ethereum", category: "Restaking" },
  { name: "Uniswap", tvl: "$5.2B", chain: "Ethereum", category: "DEX" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Ethereum (ETH) — Price, Network Stats & News",
    description:
      "Live Ethereum price, gas fees, staking stats, burn rate, and the latest ETH news. Top DeFi protocols and complete Ethereum ecosystem dashboard.",
    path: "/ethereum",
    locale,
    tags: [
      "ethereum",
      "ETH",
      "ethereum price",
      "gas fees",
      "DeFi",
      "staking",
      "ethereum news",
    ],
  });
}

export default async function EthereumPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [ethResult, netResult, newsResult] = await Promise.allSettled([
    fetchEthereumData(),
    fetchEthNetworkStats(),
    getEthereumNews(10),
  ]);

  const ethData = ethResult.status === "fulfilled" ? ethResult.value : null;
  const networkStats = netResult.status === "fulfilled" ? netResult.value : {};
  const newsResponse = newsResult.status === "fulfilled" ? newsResult.value : { articles: [], totalCount: 0, sources: [], fetchedAt: new Date().toISOString() };

  const md = ethData?.market_data;
  const price = md?.current_price?.usd;
  const change24h = md?.price_change_percentage_24h;
  const isPositive = change24h != null && change24h >= 0;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-text-tertiary mb-6">
          <Link
            href="/"
            className="hover:text-accent transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-primary font-medium">
            Ethereum
          </span>
        </nav>

        {/* ── Hero Section ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#627EEA] flex items-center justify-center text-white font-bold text-xl">
              Ξ
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">
                Ethereum
              </h1>
              <span className="text-text-tertiary text-sm uppercase font-medium">
                ETH
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mt-4 flex-wrap">
            <span className="text-4xl md:text-5xl font-bold text-text-primary tabular-nums">
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

          <div className="flex items-center gap-6 mt-3 text-sm text-text-secondary flex-wrap">
            {md?.ath?.usd && (
              <span>
                ATH: {formatPrice(md.ath.usd)}
                {md.ath_date?.usd && (
                  <span className="text-text-tertiary ml-1">
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
          <h2 className="font-serif text-xl font-bold text-text-primary mb-4">
            Network Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              icon={<Fuel className="h-4 w-4" />}
              label="Gas Price"
              value={
                networkStats.gasPrice != null
                  ? `${networkStats.gasPrice.toFixed(1)} gwei`
                  : "—"
              }
            />
            <StatCard
              icon={<Percent className="h-4 w-4" />}
              label="Staking APR"
              value={
                networkStats.stakingApr != null
                  ? `${networkStats.stakingApr.toFixed(1)}%`
                  : "~3.5%"
              }
            />
            <StatCard
              icon={<Lock className="h-4 w-4" />}
              label="Total Staked"
              value={
                networkStats.totalStaked != null
                  ? `${(networkStats.totalStaked / 1e6).toFixed(1)}M ETH`
                  : "—"
              }
            />
            <StatCard
              icon={<Flame className="h-4 w-4" />}
              label="Burn Rate"
              value={
                networkStats.burnRate != null
                  ? `${networkStats.burnRate.toFixed(2)} ETH/min`
                  : "—"
              }
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Active Validators"
              value={
                networkStats.activeValidators != null
                  ? networkStats.activeValidators.toLocaleString()
                  : "~1M"
              }
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="TPS"
              value={
                networkStats.tps != null
                  ? `${networkStats.tps.toFixed(1)}`
                  : "~15"
              }
            />
          </div>
        </section>

        {/* ── Supply Info ── */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary mb-1">
                Circulating Supply
              </p>
              <p className="text-lg font-semibold text-text-primary">
                {formatSupply(md?.circulating_supply)}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary mb-1">
                Total Supply
              </p>
              <p className="text-lg font-semibold text-text-primary">
                {formatSupply(md?.total_supply)}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                No max supply — deflationary since EIP-1559
              </p>
            </div>
          </div>
        </section>

        {/* ── Price Chart ── */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold text-text-primary mb-4">
            Price Chart
          </h2>
          <Suspense
            fallback={
              <div className="h-[370px] rounded-xl border border-border bg-(--color-surface) animate-pulse" />
            }
          >
            <PriceChart coinId="ethereum" />
          </Suspense>
        </section>

        {/* ── Top DeFi on Ethereum ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-text-primary">
              Top DeFi on Ethereum
            </h2>
            <Link
              href="/defi"
              className="text-sm text-accent hover:underline"
            >
              View all DeFi →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Protocol
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    TVL
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_DEFI_PROTOCOLS.map((protocol, i) => (
                  <tr
                    key={protocol.name}
                    className="border-b border-border hover:bg-surface-secondary transition-colors"
                  >
                    <td className="py-3 px-3 text-text-tertiary">
                      {i + 1}
                    </td>
                    <td className="py-3 px-3 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-accent" />
                        {protocol.name}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-surface-tertiary text-text-secondary">
                        {protocol.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-text-primary tabular-nums">
                      {protocol.tvl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Ethereum News ── */}
        {newsResponse.articles.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-text-primary">
                Latest Ethereum News
              </h2>
              <Link
                href="/search?q=ethereum"
                className="text-sm text-accent hover:underline"
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
      </main>
      <PageShareSection
        title="Ethereum (ETH) — Price, News & Analysis"
        description="Live Ethereum price, gas tracker, staking stats, and latest ETH news."
        url={`https://cryptocurrency.cv/${locale}/ethereum`}
      />
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
    <div className="p-4 rounded-lg border border-border bg-surface-secondary">
      <div className="flex items-center gap-2 mb-2 text-text-tertiary">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-lg font-semibold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}
