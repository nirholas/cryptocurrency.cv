import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import StablecoinTable, { type StablecoinRow } from "@/components/StablecoinTable";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Coins,
} from "lucide-react";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE = SITE_URL;

interface StablecoinAPIItem {
  rank?: number;
  name: string;
  symbol: string;
  pegType?: string;
  circulatingUsd?: number;
  price?: number;
  chains?: string[];
  circulating?: Record<string, number>;
  circulatingPrevWeek?: Record<string, number>;
}

interface StablecoinAPIResponse {
  totalMarketCap?: number;
  count?: number;
  data?: StablecoinAPIItem[];
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
    title: "Stablecoin Analytics — Market Cap, Peg Health & Supply | Crypto Vision News",
    description:
      "Track stablecoin market data including USDT, USDC, DAI, and more. Monitor peg health, market cap rankings, supply changes, and de-peg alerts in real time.",
    path: "/stablecoins",
    locale,
    tags: [
      "stablecoins",
      "USDT",
      "USDC",
      "DAI",
      "peg health",
      "stablecoin market cap",
      "de-peg monitor",
      "crypto",
    ],
  });
}

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
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
    <Card className={cn(accent && "ring-1 ring-accent/20 bg-accent/[0.03]")}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
            {label}
          </p>
          <div className="text-accent opacity-60">{icon}</div>
        </div>
        <p className="text-xl md:text-2xl font-bold tabular-nums text-text-primary">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DonutChart({
  segments,
}: {
  segments: { name: string; symbol: string; share: number; color: string }[];
}) {
  // Build conic-gradient from segments
  let accumulated = 0;
  const gradientStops = segments.map((seg) => {
    const start = accumulated;
    accumulated += seg.share;
    return `${seg.color} ${start}% ${accumulated}%`;
  });
  // Fill remaining with gray
  if (accumulated < 100) {
    gradientStops.push(`var(--color-surface-tertiary) ${accumulated}% 100%`);
  }
  const gradient = `conic-gradient(${gradientStops.join(", ")})`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div
        className="relative h-48 w-48 shrink-0 rounded-full"
        style={{ background: gradient }}
        aria-label="Stablecoin market share donut chart"
        role="img"
      >
        <div className="absolute inset-6 rounded-full bg-(--color-surface) flex items-center justify-center">
          <span className="text-xs font-semibold text-text-tertiary">
            Market Share
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {segments.map((seg) => (
          <div key={seg.symbol} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-text-secondary">
              {seg.symbol}{" "}
              <span className="font-mono text-text-primary">
                {seg.share.toFixed(1)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
];

export default async function StablecoinsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await fetchJSON<StablecoinAPIResponse>("/api/stablecoins");

  const items = data?.data ?? [];
  const totalMarketCap = data?.totalMarketCap ?? 0;

  // Transform API data to StablecoinRow
  const stablecoins: StablecoinRow[] = items.map((item, idx) => {
    const circulatingUsd =
      item.circulatingUsd ??
      (item.circulating
        ? Object.values(item.circulating).reduce((a, b) => a + b, 0)
        : 0);
    const prevWeekUsd = item.circulatingPrevWeek
      ? Object.values(item.circulatingPrevWeek).reduce((a, b) => a + b, 0)
      : circulatingUsd;
    const supplyChange7d =
      prevWeekUsd > 0
        ? ((circulatingUsd - prevWeekUsd) / prevWeekUsd) * 100
        : 0;

    return {
      rank: item.rank ?? idx + 1,
      name: item.name,
      symbol: item.symbol,
      marketCap: circulatingUsd,
      volume24h: 0, // Volume not available from DefiLlama stablecoins
      price: item.price ?? 1,
      pegDeviation: (item.price ?? 1) - 1,
      supplyChange7d,
      pegType: item.pegType ?? "fiat",
      chains: item.chains,
    };
  });

  // Sort by market cap for donut chart
  const topForChart = [...stablecoins]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 8);
  const topTotal = topForChart.reduce((s, c) => s + c.marketCap, 0);
  const othersTotal = totalMarketCap - topTotal;

  const donutSegments = topForChart.map((c, i) => ({
    name: c.name,
    symbol: c.symbol,
    share: totalMarketCap > 0 ? (c.marketCap / totalMarketCap) * 100 : 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  if (othersTotal > 0 && totalMarketCap > 0) {
    donutSegments.push({
      name: "Others",
      symbol: "Others",
      share: (othersTotal / totalMarketCap) * 100,
      color: "#71717a",
    });
  }

  // De-peg alerts — stablecoins with >0.5% deviation
  const offPeg = stablecoins.filter(
    (c) => Math.abs(c.pegDeviation) > 0.005
  );

  // Stats
  const usdBackedCount = stablecoins.filter(
    (c) => c.pegType === "peggedUSD" || c.pegType === "fiat"
  ).length;
  const topStable = stablecoins[0];

  return (
    <>
      <Header />
      <main className="container-main py-10 space-y-14">
        {/* Hero */}
        <section>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
            💵 Stablecoin Analytics
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Real-time stablecoin market data — track total supply, peg health,
            market cap rankings, and de-peg alerts across all major stablecoins.
          </p>
        </section>

        {/* Stats Grid */}
        <section>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <StatCard
              label="Total Stablecoin Supply"
              value={totalMarketCap > 0 ? formatLargeNumber(totalMarketCap) : "—"}
              icon={<DollarSign className="h-5 w-5" />}
              accent
            />
            <StatCard
              label="Stablecoins Tracked"
              value={stablecoins.length > 0 ? stablecoins.length.toString() : "—"}
              icon={<Coins className="h-5 w-5" />}
            />
            <StatCard
              label="Largest Stablecoin"
              value={topStable ? topStable.symbol : "—"}
              sub={topStable ? formatLargeNumber(topStable.marketCap) : undefined}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Off-Peg Alerts"
              value={offPeg.length.toString()}
              sub={offPeg.length > 0 ? "Stablecoins deviating >0.5%" : "All pegs healthy"}
              icon={
                offPeg.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )
              }
            />
          </div>
        </section>

        {/* De-Peg Monitor */}
        {offPeg.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
              ⚠️ De-Peg Monitor
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offPeg.map((coin) => (
                <Card key={coin.symbol} className="border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-text-primary">
                          {coin.name}
                        </span>
                        <Badge>{coin.symbol}</Badge>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-lg font-mono font-bold text-text-primary">
                        ${coin.price.toFixed(4)}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-mono",
                          coin.pegDeviation > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {coin.pegDeviation > 0 ? "+" : ""}
                        {(coin.pegDeviation * 100).toFixed(2)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Market Share Donut */}
        {donutSegments.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
              📊 Stablecoin Market Share
            </h2>
            <Card>
              <CardContent className="p-6">
                <DonutChart segments={donutSegments} />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Stablecoin Table */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4 text-text-primary">
            📋 All Stablecoins
          </h2>
          <StablecoinTable stablecoins={stablecoins} />
        </section>
      </main>
      <Footer />
    </>
  );
}
