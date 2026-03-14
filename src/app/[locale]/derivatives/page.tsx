import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/constants';
import { formatLargeNumber } from '@/lib/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingDown, TrendingUp, BarChart3, Activity, Target } from 'lucide-react';
import LiquidationFeed from '@/components/LiquidationFeed';
import FundingRates from '@/components/FundingRates';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE = SITE_URL;

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------- Types ---------- */

interface DerivativesTicker {
  symbol?: string;
  open_interest?: number;
  h24_volume?: number;
}

interface OptionsData {
  success: boolean;
  data: {
    putCallRatio?: number;
    maxPain?: number;
    totalCalls?: number;
    totalPuts?: number;
  };
}

interface HyperliquidResponse {
  data: Array<{
    symbol: string;
    openInterestUsd: number;
    volume24h: number;
    fundingRate: number;
  }>;
}

/* ---------- Metadata ---------- */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Derivatives & Liquidations Dashboard — Crypto Vision News',
    description:
      'Live cryptocurrency derivatives dashboard: liquidation feed, funding rates, open interest, and options data for BTC, ETH, SOL and more.',
    path: '/derivatives',
    locale,
    tags: [
      'crypto derivatives',
      'liquidations',
      'funding rates',
      'open interest',
      'options',
      'perpetual futures',
    ],
  });
}

/* ---------- Page ---------- */

export default async function DerivativesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch data server-side — use allSettled so one failure doesn't crash the page
  const [derivResult, btcOptResult, ethOptResult, hlResult] = await Promise.allSettled([
    fetchJSON<DerivativesTicker[]>('/api/derivatives'),
    fetchJSON<OptionsData>('/api/options?underlying=BTC&view=dashboard'),
    fetchJSON<OptionsData>('/api/options?underlying=ETH&view=dashboard'),
    fetchJSON<HyperliquidResponse>('/api/hyperliquid?type=oi'),
  ]);

  const derivativesData = derivResult.status === 'fulfilled' ? derivResult.value : null;
  const btcOptions = btcOptResult.status === 'fulfilled' ? btcOptResult.value : null;
  const ethOptions = ethOptResult.status === 'fulfilled' ? ethOptResult.value : null;
  const hyperliquidData = hlResult.status === 'fulfilled' ? hlResult.value : null;

  // Calculate open interest totals by symbol
  const oiMap: Record<string, number> = {};
  let totalOI = 0;

  if (Array.isArray(derivativesData)) {
    for (const t of derivativesData) {
      const sym = t.symbol?.toUpperCase() ?? '';
      const oi = t.open_interest ?? 0;
      if (sym.includes('BTC')) oiMap['BTC'] = (oiMap['BTC'] ?? 0) + oi;
      else if (sym.includes('ETH')) oiMap['ETH'] = (oiMap['ETH'] ?? 0) + oi;
      else if (sym.includes('SOL')) oiMap['SOL'] = (oiMap['SOL'] ?? 0) + oi;
      totalOI += oi;
    }
  }

  // Supplement with Hyperliquid data
  if (hyperliquidData?.data) {
    for (const item of hyperliquidData.data) {
      const sym = item.symbol?.toUpperCase() ?? '';
      const oi = item.openInterestUsd ?? 0;
      if (sym === 'BTC') oiMap['BTC'] = (oiMap['BTC'] ?? 0) + oi;
      else if (sym === 'ETH') oiMap['ETH'] = (oiMap['ETH'] ?? 0) + oi;
      else if (sym === 'SOL') oiMap['SOL'] = (oiMap['SOL'] ?? 0) + oi;
      totalOI += oi;
    }
  }

  const oiCards = [
    { label: 'BTC Open Interest', value: oiMap['BTC'] ?? 0, icon: BarChart3 },
    { label: 'ETH Open Interest', value: oiMap['ETH'] ?? 0, icon: Activity },
    { label: 'SOL Open Interest', value: oiMap['SOL'] ?? 0, icon: TrendingUp },
    { label: 'Total Open Interest', value: totalOI, icon: Target },
  ];

  // Options data
  const btcPCR = btcOptions?.data?.putCallRatio ?? null;
  const btcMaxPain = btcOptions?.data?.maxPain ?? null;
  const ethPCR = ethOptions?.data?.putCallRatio ?? null;
  const ethMaxPain = ethOptions?.data?.maxPain ?? null;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Derivatives &amp; Liquidations
          </h1>
          <p className="text-text-secondary mt-2">
            Live liquidation feed, funding rates, open interest, and options data across major
            exchanges.
          </p>
        </div>

        {/* Section 1: Open Interest Cards */}
        <section className="mb-8">
          <h2 className="mb-4 font-serif text-xl font-bold">Open Interest</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {oiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-accent/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="text-accent h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">{card.label}</p>
                      <p className="font-mono text-lg font-bold">
                        {card.value > 0 ? formatLargeNumber(card.value, { prefix: '$' }) : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 2: Liquidation Feed */}
        <section className="mb-8">
          <LiquidationFeed />
        </section>

        {/* Section 3: Funding Rates */}
        <section className="mb-8">
          <FundingRates />
        </section>

        {/* Section 4: Options Overview */}
        <section className="mb-8">
          <h2 className="mb-4 font-serif text-xl font-bold">Options Overview</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* BTC Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-orange-500">₿</span> BTC Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Put/Call Ratio Gauge */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Put/Call Ratio</span>
                      <span className="font-mono font-semibold">
                        {btcPCR !== null ? btcPCR.toFixed(2) : '—'}
                      </span>
                    </div>
                    {btcPCR !== null && (
                      <div className="bg-surface-tertiary relative h-3 w-full overflow-hidden rounded-full">
                        {/* Gauge: < 0.7 bullish (green), 0.7-1.0 neutral, > 1.0 bearish (red) */}
                        <div
                          className={`h-full rounded-full transition-all ${
                            btcPCR < 0.7
                              ? 'bg-green-500'
                              : btcPCR > 1.0
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          }`}
                          style={{
                            width: `${Math.min(btcPCR * 50, 100)}%`,
                          }}
                        />
                        {/* Center marker at 1.0 */}
                        <div className="bg-text-tertiary absolute top-0 left-1/2 h-full w-0.5" />
                      </div>
                    )}
                    <div className="text-text-tertiary mt-1 flex justify-between text-xs">
                      <span>Bullish</span>
                      <span>Bearish</span>
                    </div>
                  </div>
                  {/* Max Pain */}
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Max Pain</span>
                    <span className="font-mono text-lg font-bold">
                      {btcMaxPain !== null ? formatLargeNumber(btcMaxPain, { prefix: '$' }) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ETH Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-indigo-500">⟠</span> ETH Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Put/Call Ratio Gauge */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Put/Call Ratio</span>
                      <span className="font-mono font-semibold">
                        {ethPCR !== null ? ethPCR.toFixed(2) : '—'}
                      </span>
                    </div>
                    {ethPCR !== null && (
                      <div className="bg-surface-tertiary relative h-3 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ethPCR < 0.7
                              ? 'bg-green-500'
                              : ethPCR > 1.0
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          }`}
                          style={{
                            width: `${Math.min(ethPCR * 50, 100)}%`,
                          }}
                        />
                        <div className="bg-text-tertiary absolute top-0 left-1/2 h-full w-0.5" />
                      </div>
                    )}
                    <div className="text-text-tertiary mt-1 flex justify-between text-xs">
                      <span>Bullish</span>
                      <span>Bearish</span>
                    </div>
                  </div>
                  {/* Max Pain */}
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Max Pain</span>
                    <span className="font-mono text-lg font-bold">
                      {ethMaxPain !== null ? formatLargeNumber(ethMaxPain, { prefix: '$' }) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
