import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceChart from "@/components/PriceChart";
import { NewsCardCompact } from "@/components/NewsCard";
import { generateSEOMetadata } from "@/lib/seo";
import { getBitcoinNews } from "@/lib/crypto-news";
import { COINGECKO_BASE } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import {
  ChevronRight,
  Cpu,
  Box,
  Shield,
  Inbox,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  BookOpen,
  FileText,
  Zap,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

interface BitcoinData {
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
    max_supply?: number;
  };
}

interface BitcoinNetworkStats {
  hashRate?: string;
  blockHeight?: number;
  difficulty?: string;
  mempoolSize?: number;
  avgFee?: number;
  avgBlockTime?: number;
}

async function fetchBitcoinData(): Promise<BitcoinData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
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

async function fetchBitcoinNetworkStats(): Promise<BitcoinNetworkStats> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/bitcoin`, {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Bitcoin (BTC) — Price, Network Stats & News",
    description:
      "Live Bitcoin price, network statistics, hash rate, block height, mempool data, and the latest BTC news. Your complete Bitcoin ecosystem dashboard.",
    path: "/bitcoin",
    locale,
    tags: [
      "bitcoin",
      "BTC",
      "bitcoin price",
      "hash rate",
      "bitcoin news",
      "cryptocurrency",
    ],
  });
}

export default async function BitcoinPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [bitcoinData, networkStats, newsResponse] = await Promise.all([
    fetchBitcoinData(),
    fetchBitcoinNetworkStats(),
    getBitcoinNews(10),
  ]);

  const md = bitcoinData?.market_data;
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
            Bitcoin
          </span>
        </nav>

        {/* ── Hero Section ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-xl">
              ₿
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                Bitcoin
              </h1>
              <span className="text-[var(--color-text-tertiary)] text-sm uppercase font-medium">
                BTC
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

          <div className="flex items-center gap-6 mt-3 text-sm text-[var(--color-text-secondary)]">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              icon={<Cpu className="h-4 w-4" />}
              label="Hash Rate"
              value={networkStats.hashRate ?? "—"}
            />
            <StatCard
              icon={<Box className="h-4 w-4" />}
              label="Block Height"
              value={
                networkStats.blockHeight
                  ? networkStats.blockHeight.toLocaleString()
                  : "—"
              }
            />
            <StatCard
              icon={<Shield className="h-4 w-4" />}
              label="Difficulty"
              value={networkStats.difficulty ?? "—"}
            />
            <StatCard
              icon={<Inbox className="h-4 w-4" />}
              label="Mempool Size"
              value={
                networkStats.mempoolSize
                  ? `${networkStats.mempoolSize.toLocaleString()} txs`
                  : "—"
              }
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Avg Fee"
              value={
                networkStats.avgFee != null
                  ? `$${networkStats.avgFee.toFixed(2)}`
                  : "—"
              }
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Avg Block Time"
              value={
                networkStats.avgBlockTime
                  ? `${networkStats.avgBlockTime.toFixed(1)} min`
                  : "~10 min"
              }
            />
          </div>
        </section>

        {/* ── Supply Info ── */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Max Supply
              </p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatSupply(md?.max_supply) || "21M"}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                % Mined
              </p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {md?.circulating_supply && md?.max_supply
                  ? `${((md.circulating_supply / md.max_supply) * 100).toFixed(1)}%`
                  : "—"}
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
            <PriceChart coinId="bitcoin" />
          </Suspense>
        </section>

        {/* ── Bitcoin News ── */}
        {newsResponse.articles.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
                Latest Bitcoin News
              </h2>
              <Link
                href="/search?q=bitcoin"
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

        {/* ── Educational Links ── */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Learn About Bitcoin
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <EducationCard
              icon={<BookOpen className="h-5 w-5" />}
              title="What is Bitcoin?"
              description="An introduction to the world's first cryptocurrency and decentralized digital money."
              href="https://bitcoin.org/en/getting-started"
            />
            <EducationCard
              icon={<FileText className="h-5 w-5" />}
              title="Bitcoin Whitepaper"
              description="Read Satoshi Nakamoto's original 2008 whitepaper that started it all."
              href="https://bitcoin.org/bitcoin.pdf"
            />
            <EducationCard
              icon={<Zap className="h-5 w-5" />}
              title="Lightning Network"
              description="Learn about Bitcoin's Layer 2 scaling solution for instant, low-cost payments."
              href="https://lightning.network/"
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

function EducationCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)] transition-colors"
    >
      <div className="flex items-center gap-2 text-[var(--color-accent)]">
        {icon}
        <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
          {title}
        </h3>
        <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </a>
  );
}
