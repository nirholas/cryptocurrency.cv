import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceChart from "@/components/PriceChart";
import { NewsCardCompact } from "@/components/NewsCard";
import { generateCoinMetadata } from "@/lib/seo";
import { sanitizeMarkdown } from "@/lib/sanitize";
import { COINGECKO_BASE } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { NewsArticle } from "@/lib/crypto-news";
import PageShareSection from "@/components/PageShareSection";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image?: { large?: string; small?: string; thumb?: string };
  description?: { en?: string };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    twitter_screen_name?: string;
    subreddit_url?: string;
    telegram_channel_identifier?: string;
  };
  categories?: string[];
  market_cap_rank?: number;
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    high_24h?: { usd?: number };
    low_24h?: { usd?: number };
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number;
    ath?: { usd?: number };
    ath_date?: { usd?: string };
    atl?: { usd?: number };
    atl_date?: { usd?: string };
  };
  last_updated?: string;
}

async function fetchCoinData(coinId: string): Promise<CoinData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "FreeCryptoNews/1.0",
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchRelatedNews(coinName: string): Promise<NewsArticle[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/news?search=${encodeURIComponent(coinName)}&limit=8`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const coin = await fetchCoinData(id);

  if (!coin) {
    return generateCoinMetadata({ name: id, symbol: id, locale });
  }

  return generateCoinMetadata({
    name: coin.name,
    symbol: coin.symbol,
    locale,
    price: coin.market_data?.current_price?.usd,
    priceChange: coin.market_data?.price_change_percentage_24h,
  });
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}

function formatPercent(n: number | undefined | null): string {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatSupply(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CoinPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const coin = await fetchCoinData(id);

  if (!coin) {
    return (
      <>
        <Header />
        <main className="container-main py-10">
          <h1 className="font-serif text-3xl font-bold mb-4 text-text-primary">
            Coin not found
          </h1>
          <p className="text-text-secondary">
            Could not find data for &ldquo;{id}&rdquo;. The coin may not exist or the data source is temporarily unavailable.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const md = coin.market_data;
  const priceChange24h = md?.price_change_percentage_24h;
  const isPositive = priceChange24h != null && priceChange24h >= 0;

  // Fetch related news in parallel (non-blocking)
  const relatedNews = await fetchRelatedNews(coin.name);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-text-tertiary mb-6">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/markets" className="hover:text-accent transition-colors">
            Markets
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-primary font-medium">{coin.name}</span>
        </nav>

        {/* ── Section 1: Coin Header ── */}
        <div className="flex items-start gap-4 mb-8">
          {coin.image?.large && (
            <img
              src={coin.image.large}
              alt={coin.name}
              width={64}
              height={64}
              className="rounded-full shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">
                {coin.name}
              </h1>
              <span className="text-text-tertiary font-medium text-xl md:text-2xl uppercase">
                {coin.symbol}
              </span>
              {coin.market_cap_rank && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-accent text-white">
                  #{coin.market_cap_rank}
                </span>
              )}
            </div>

            {/* Price + change badges */}
            <div className="flex items-baseline gap-4 mt-3 flex-wrap">
              <span className="text-4xl md:text-5xl font-bold text-text-primary tabular-nums">
                {formatPrice(md?.current_price?.usd)}
              </span>
              <div className="flex items-center gap-2">
                <ChangePercent label="24h" value={priceChange24h} />
                <ChangePercent label="7d" value={md?.price_change_percentage_7d} />
                <ChangePercent label="30d" value={md?.price_change_percentage_30d} />
              </div>
            </div>

            {md?.price_change_24h != null && (
              <p className="text-sm text-text-tertiary mt-1.5">
                {md.price_change_24h >= 0 ? "+" : ""}
                ${Math.abs(md.price_change_24h).toFixed(4)} today
              </p>
            )}
          </div>
        </div>

        {/* ── Section 2: Price Chart ── */}
        <div className="mb-10">
          <Suspense
            fallback={
              <div className="h-92.5 rounded-xl border border-border bg-(--color-surface) animate-pulse" />
            }
          >
            <PriceChart coinId={coin.id} />
          </Suspense>
        </div>

        {/* ── Section 3: Stats Grid ── */}
        <div className="mb-10">
          <h2 className="font-serif text-xl font-bold text-text-primary mb-4">
            Market Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Market Cap" value={formatNumber(md?.market_cap?.usd)} />
            <StatCard label="24h Volume" value={formatNumber(md?.total_volume?.usd)} />
            <StatCard label="Circulating Supply" value={formatSupply(md?.circulating_supply)} />
            <StatCard
              label="Total Supply"
              value={md?.total_supply ? formatSupply(md.total_supply) : "—"}
            />
            <StatCard
              label="All-Time High"
              value={formatPrice(md?.ath?.usd)}
              sub={md?.ath_date?.usd ? formatDate(md.ath_date.usd) : undefined}
              highlight="green"
            />
            <StatCard
              label="All-Time Low"
              value={formatPrice(md?.atl?.usd)}
              sub={md?.atl_date?.usd ? formatDate(md.atl_date.usd) : undefined}
              highlight="red"
            />
            <StatCard label="24h High" value={formatPrice(md?.high_24h?.usd)} />
            <StatCard label="24h Low" value={formatPrice(md?.low_24h?.usd)} />
          </div>
        </div>

        {/* ── Section 4: Related News ── */}
        {relatedNews.length > 0 && (
          <div className="mb-10">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-4">
              Latest {coin.name} News
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedNews.map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {coin.description?.en && (
          <div className="mb-10">
            <h2 className="font-serif text-xl font-bold mb-3 text-text-primary">
              About {coin.name}
            </h2>
            <div
              className="prose prose-sm max-w-none text-text-secondary [&_a]:text-blue-500 [&_a]:underline"
              dangerouslySetInnerHTML={{
                __html: sanitizeMarkdown(coin.description.en.slice(0, 2000)),
              }}
            />
          </div>
        )}

        {/* Links */}
        {coin.links && (
          <div className="mb-8">
            <h2 className="font-serif text-xl font-bold mb-3 text-text-primary">Links</h2>
            <div className="flex flex-wrap gap-2">
              {coin.links.homepage?.[0] && (
                <LinkPill href={coin.links.homepage[0]} label="Website" />
              )}
              {coin.links.twitter_screen_name && (
                <LinkPill
                  href={`https://twitter.com/${coin.links.twitter_screen_name}`}
                  label="Twitter"
                />
              )}
              {coin.links.subreddit_url && (
                <LinkPill href={coin.links.subreddit_url} label="Reddit" />
              )}
              {coin.links.telegram_channel_identifier && (
                <LinkPill
                  href={`https://t.me/${coin.links.telegram_channel_identifier}`}
                  label="Telegram"
                />
              )}
              {coin.links.blockchain_site
                ?.filter(Boolean)
                .slice(0, 2)
                .map((url) => (
                  <LinkPill key={url} href={url} label="Explorer" />
                ))}
            </div>
          </div>
        )}

        {/* Last updated */}
        {coin.last_updated && (
          <p className="text-xs text-text-tertiary">
            Last updated: {new Date(coin.last_updated).toLocaleString()}
          </p>
        )}
      </main>
      <PageShareSection
        title={`${coin.name} (${coin.symbol?.toUpperCase()}) Price & News`}
        description={`Live ${coin.name} price, charts, and latest news on Crypto Vision News.`}
        url={`https://cryptocurrency.cv/${locale}/coin/${id}`}
      />
      <Footer />
    </>
  );
}

/* ── Helper Components ── */

function ChangePercent({ label, value }: { label: string; value?: number | null }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${
        positive
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      <span className="text-[10px]">{label}</span>
      {formatPercent(value)}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-(--color-bg-secondary)">
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <p
        className={`text-lg font-semibold ${
          highlight === "green"
            ? "text-green-500"
            : highlight === "red"
              ? "text-red-500"
              : "text-text-primary"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-border text-text-secondary hover:bg-(--color-bg-secondary) transition-colors"
    >
      {label} ↗
    </a>
  );
}
