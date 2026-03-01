import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { formatLargeNumber, formatPercent } from "@/lib/format";
import MarketTable, { type CoinRow } from "@/components/MarketTable";
import {
  TrendingUp,
  BarChart3,
  Bitcoin,
  Activity,
  Gauge,
  Coins,
} from "lucide-react";
import type { Metadata } from "next";

// ---------- Types ------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

interface GlobalData {
  total_market_cap?: Record<string, number>;
  total_volume?: Record<string, number>;
  market_cap_percentage?: Record<string, number>;
  active_cryptocurrencies?: number;
  market_cap_change_percentage_24h_usd?: number;
}

interface FearGreedData {
  current?: {
    value: number;
    valueClassification: string;
  };
}

// ---------- Data fetchers ----------------------------------------------------

const BASE = SITE_URL;

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------- Metadata ---------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Markets — Crypto Vision News",
    description:
      "Live cryptocurrency market data, prices, and trends. Track Bitcoin, Ethereum, and top altcoins in real time.",
    path: "/markets",
    locale,
    tags: [
      "crypto markets",
      "bitcoin price",
      "ethereum price",
      "market data",
      "cryptocurrency prices",
    ],
  });
}

// ---------- Stat Card --------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string;
  change?: { text: string; className: string } | null;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          {change && (
            <p className={`mt-1 text-sm font-medium ${change.className}`}>
              {change.text}
            </p>
          )}
        </div>
        <div className="text-[var(--color-accent)] opacity-60">{icon}</div>
      </div>
    </Card>
  );
}

// ---------- Page component ---------------------------------------------------

export default async function MarketsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch all data in parallel
  const [globalData, fearGreedData, topCoinsData] = await Promise.all([
    fetchJSON<GlobalData>("/api/global"),
    fetchJSON<FearGreedData>("/api/fear-greed"),
    fetchJSON<{ coins: CoinRow[] }>("/api/market/coins?type=top&limit=50"),
  ]);

  // ---- Derived values -------------------------------------------------------

  const totalMarketCap = globalData?.total_market_cap?.usd ?? null;
  const totalVolume = globalData?.total_volume?.usd ?? null;
  const btcDominance = globalData?.market_cap_percentage?.btc ?? null;
  const ethDominance = globalData?.market_cap_percentage?.eth ?? null;
  const activeCryptos = globalData?.active_cryptocurrencies ?? null;
  const marketCapChange24h =
    globalData?.market_cap_change_percentage_24h_usd ?? null;

  const fearGreedValue = fearGreedData?.current?.value ?? null;
  const fearGreedLabel =
    fearGreedData?.current?.valueClassification ?? "Unknown";

  const coins: CoinRow[] = topCoinsData?.coins ?? [];

  // Fear & greed color
  function fgColor(v: number | null) {
    if (v == null) return "text-[var(--color-text-secondary)]";
    if (v <= 25) return "text-red-500 dark:text-red-400";
    if (v <= 45) return "text-orange-500 dark:text-orange-400";
    if (v <= 55) return "text-yellow-500 dark:text-yellow-400";
    if (v <= 75) return "text-green-400 dark:text-green-300";
    return "text-green-500 dark:text-green-400";
  }

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page heading */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          Markets
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
          Real-time cryptocurrency market data — prices, trends, and global
          overview for hundreds of digital assets.
        </p>

        {/* ---- Stats bar ---- */}
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-10"
          aria-label="Market statistics"
        >
          <StatCard
            title="Total Market Cap"
            value={
              totalMarketCap != null
                ? formatLargeNumber(totalMarketCap, { prefix: "$" })
                : "—"
            }
            change={
              marketCapChange24h != null
                ? formatPercent(marketCapChange24h)
                : null
            }
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <StatCard
            title="24h Volume"
            value={
              totalVolume != null
                ? formatLargeNumber(totalVolume, { prefix: "$" })
                : "—"
            }
            icon={<BarChart3 className="h-5 w-5" />}
          />

          <StatCard
            title="BTC Dominance"
            value={btcDominance != null ? `${btcDominance.toFixed(1)}%` : "—"}
            icon={<Bitcoin className="h-5 w-5" />}
          />

          <StatCard
            title="ETH Dominance"
            value={ethDominance != null ? `${ethDominance.toFixed(1)}%` : "—"}
            icon={<Coins className="h-5 w-5" />}
          />

          <StatCard
            title="Fear & Greed"
            value={fearGreedValue != null ? String(fearGreedValue) : "—"}
            change={
              fearGreedValue != null
                ? {
                    text: fearGreedLabel,
                    className: fgColor(fearGreedValue),
                  }
                : null
            }
            icon={<Gauge className="h-5 w-5" />}
          />

          <StatCard
            title="Active Coins"
            value={
              activeCryptos != null
                ? activeCryptos.toLocaleString("en-US")
                : "—"
            }
            icon={<Activity className="h-5 w-5" />}
          />
        </section>

        {/* ---- Top Coins Table ---- */}
        <section aria-label="Top cryptocurrencies by market cap">
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)]">
            Top Cryptocurrencies
          </h2>

          {coins.length > 0 ? (
            <MarketTable coins={coins} />
          ) : (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-text-secondary)]">
              Market data is temporarily unavailable. Please try again shortly.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
