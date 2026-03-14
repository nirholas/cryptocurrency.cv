import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import { generateSEOMetadata } from '@/lib/seo';
import { Skeleton } from '@/components/ui';
import type { Metadata } from 'next';
import FearGreedGauge from '@/components/FearGreedGauge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Fear & Greed Index — Live Sentiment Gauge',
    description:
      "Track the Crypto Fear & Greed Index in real time. See today's score from 0–100, 30-day history, market context, and what it means for Bitcoin and altcoin investors.",
    path: '/fear-greed',
    locale,
    tags: ['fear and greed index', 'crypto sentiment', 'bitcoin fear greed', 'market sentiment'],
  });
}

interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: number;
}

interface FearGreedResponse {
  current: {
    value: number;
    valueClassification: string;
    timestamp: number;
    timeUntilUpdate: string;
  };
  historical: FearGreedData[];
  trend: {
    direction: string;
    change7d: number;
    change30d: number;
    averageValue7d: number;
    averageValue30d: number;
  };
  breakdown: Record<string, { value: number; weight: number }>;
  lastUpdated: string;
}

async function fetchFearGreed(): Promise<FearGreedResponse | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/fear-greed?days=30`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchBtcPrice(): Promise<{ usd: number; usd_24h_change: number } | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/prices?coins=bitcoin`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.bitcoin ?? null;
  } catch {
    return null;
  }
}

function HistoricalChart({ data }: { data: FearGreedData[] }) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const maxVal = 100;
  const barWidth = Math.max(4, Math.floor(600 / sorted.length) - 2);
  const chartWidth = sorted.length * (barWidth + 2);
  const chartHeight = 160;

  function barColor(v: number) {
    if (v <= 25) return '#ea3943';
    if (v <= 45) return '#ea8c00';
    if (v <= 55) return '#f5d100';
    if (v <= 75) return '#16c784';
    return '#0d8a5e';
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 30}`}
        className="w-full min-w-100"
        aria-label="Fear and Greed Index - 30 day history"
      >
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <text
              x={28}
              y={chartHeight - (v / maxVal) * chartHeight + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-text-secondary, #888)"
            >
              {v}
            </text>
            <line
              x1={32}
              x2={chartWidth + 36}
              y1={chartHeight - (v / maxVal) * chartHeight}
              y2={chartHeight - (v / maxVal) * chartHeight}
              stroke="var(--color-border, #333)"
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          </g>
        ))}

        {/* Bars */}
        {sorted.map((d, i) => {
          const height = (d.value / maxVal) * chartHeight;
          return (
            <rect
              key={d.timestamp}
              x={36 + i * (barWidth + 2)}
              y={chartHeight - height}
              width={barWidth}
              height={height}
              fill={barColor(d.value)}
              rx={2}
            >
              <title>
                {new Date(d.timestamp * 1000).toLocaleDateString()} — {d.value} (
                {d.valueClassification})
              </title>
            </rect>
          );
        })}

        {/* X-axis labels — first, middle, last */}
        {[0, Math.floor(sorted.length / 2), sorted.length - 1].map((idx) => {
          const d = sorted[idx];
          if (!d) return null;
          return (
            <text
              key={idx}
              x={36 + idx * (barWidth + 2) + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize="8"
              fill="var(--color-text-secondary, #888)"
            >
              {new Date(d.timestamp * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BreakdownCard({
  breakdown,
}: {
  breakdown: Record<string, { value: number; weight: number }>;
}) {
  const labels: Record<string, string> = {
    volatility: 'Volatility',
    marketMomentum: 'Market Momentum',
    socialMedia: 'Social Media',
    surveys: 'Surveys',
    dominance: 'BTC Dominance',
    trends: 'Search Trends',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Index Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(breakdown).map(([key, { value, weight }]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-text-secondary">{labels[key] || key}</span>
              <span className="font-medium tabular-nums">
                {value}/100{' '}
                <span className="text-text-secondary text-xs">({Math.round(weight * 100)}%)</span>
              </span>
            </div>
            <div className="bg-border h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${value}%`,
                  backgroundColor:
                    value <= 25
                      ? '#ea3943'
                      : value <= 45
                        ? '#ea8c00'
                        : value <= 55
                          ? '#f5d100'
                          : value <= 75
                            ? '#16c784'
                            : '#0d8a5e',
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

async function FearGreedContent() {
  const [fgData, btcPrice] = await Promise.all([fetchFearGreed(), fetchBtcPrice()]);

  if (!fgData) {
    return (
      <div className="text-text-secondary py-20 text-center">
        <p className="text-lg">Unable to load Fear &amp; Greed data right now.</p>
        <p className="mt-2 text-sm">Please try again later.</p>
      </div>
    );
  }

  const { current, historical, trend, breakdown } = fgData;

  return (
    <div className="space-y-8">
      {/* Gauge + Market Context */}
      <div className="grid items-start gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <FearGreedGauge value={current.value} label={current.valueClassification} />
            <p className="text-text-secondary mt-4 text-center text-xs">
              Next update: {current.timeUntilUpdate}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Market Context */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Market Context</CardTitle>
            </CardHeader>
            <CardContent>
              {btcPrice ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-text-secondary text-sm">Bitcoin</span>
                  <span className="text-2xl font-bold tabular-nums">
                    ${btcPrice.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      btcPrice.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {btcPrice.usd_24h_change >= 0 ? '+' : ''}
                    {btcPrice.usd_24h_change.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <p className="text-text-secondary text-sm">Price data unavailable</p>
              )}
            </CardContent>
          </Card>

          {/* Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-text-secondary">7-day avg</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {Math.round(trend.averageValue7d)}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">30-day avg</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {Math.round(trend.averageValue30d)}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">7d change</div>
                  <div
                    className={`font-semibold tabular-nums ${
                      trend.change7d >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {trend.change7d >= 0 ? '+' : ''}
                    {trend.change7d}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Direction</div>
                  <div className="font-semibold capitalize">{trend.direction}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">30-Day History</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoricalChart data={historical} />
        </CardContent>
      </Card>

      {/* Breakdown + Education */}
      <div className="grid gap-8 md:grid-cols-2">
        {breakdown && <BreakdownCard breakdown={breakdown} />}

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">What It Means</CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary space-y-3 text-sm">
            <p>
              The Crypto Fear &amp; Greed Index measures market sentiment on a scale from 0 (Extreme
              Fear) to 100 (Extreme Greed). It combines volatility, market momentum, social media
              activity, surveys, BTC dominance, and search trends.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span>
                  <strong className="text-text-primary">0–25 Extreme Fear</strong> — Investors are
                  very worried. Potential buying opportunity.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                <span>
                  <strong className="text-text-primary">25–45 Fear</strong> — Market uncertainty is
                  high.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                <span>
                  <strong className="text-text-primary">45–55 Neutral</strong> — Market sentiment is
                  balanced.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                <span>
                  <strong className="text-text-primary">55–75 Greed</strong> — Investors are
                  becoming greedy. Caution advised.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" />
                <span>
                  <strong className="text-text-primary">75–100 Extreme Greed</strong> — Market may
                  be due for a correction.
                </span>
              </div>
            </div>
            <p className="text-xs italic">
              The index is updated daily. It should not be used as financial advice — always do your
              own research.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FearGreedSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mx-auto h-48 w-48 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-10 w-20" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function FearGreedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
          Crypto Fear &amp; Greed Index
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Real-time market sentiment gauge — from extreme fear to extreme greed. Track how the
          crypto market is feeling today.
        </p>

        <Suspense fallback={<FearGreedSkeleton />}>
          <FearGreedContent />
        </Suspense>
      </main>
      <PageShareSection
        title="Crypto Fear & Greed Index"
        description="Real-time market sentiment gauge — from extreme fear to extreme greed."
        url={`https://cryptocurrency.cv/${locale}/fear-greed`}
      />
      <Footer />
    </>
  );
}
