/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import { generateSEOMetadata } from '@/lib/seo';
import { Card } from '@/components/ui/Card';
import SentimentTable from '@/components/SentimentTable';
import InfluencerFeed from '@/components/InfluencerFeed';
import FearGreedGauge from '@/components/FearGreedGauge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Users,
  Hash,
  BarChart3,
  Brain,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import { internalFetch } from '@/lib/internal-fetch';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ locale: string }>;
};

interface MarketSentiment {
  overall: string;
  score: number;
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  relatedTickers: string[];
  emerging: boolean;
}

interface SocialTrend {
  topic: string;
  mentions: number;
}

/* ------------------------------------------------------------------ */
/*  Data fetchers                                                      */
/* ------------------------------------------------------------------ */


async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await internalFetch(path, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Sentiment & Social Intelligence — Crypto Vision News',
    description:
      'Real-time crypto market sentiment analysis, trending narratives, influencer insights, and social buzz — all in one place.',
    path: '/sentiment',
    locale,
    tags: [
      'crypto sentiment',
      'market sentiment',
      'social intelligence',
      'crypto influencers',
      'trending narratives',
      'bitcoin sentiment',
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Sub-components (server-rendered)                                    */
/* ------------------------------------------------------------------ */

function labelFor(overall: string): string {
  switch (overall) {
    case 'very_bullish':
      return 'Very Bullish';
    case 'bullish':
      return 'Bullish';
    case 'bearish':
      return 'Bearish';
    case 'very_bearish':
      return 'Very Bearish';
    default:
      return 'Neutral';
  }
}

function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const sentimentConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    bullish: {
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    bearish: {
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    neutral: {
      icon: <Minus className="h-4 w-4" />,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800/20',
    },
  };

  const sc = sentimentConfig[narrative.sentiment] ?? sentimentConfig.neutral;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${sc.bg} ${sc.color}`}>{sc.icon}</div>
          <div>
            <h3 className="text-text-primary text-sm font-semibold">{narrative.name}</h3>
            {narrative.emerging && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <Zap className="h-2.5 w-2.5" /> Emerging
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-text-primary text-lg font-bold tabular-nums">
            {narrative.strength}
          </div>
          <div className="text-text-tertiary text-[10px] tracking-wider uppercase">Strength</div>
        </div>
      </div>

      <p className="text-text-secondary line-clamp-2 text-xs leading-relaxed">
        {narrative.description}
      </p>

      {narrative.relatedTickers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {narrative.relatedTickers.slice(0, 6).map((t) => (
            <span
              key={t}
              className="bg-accent/10 text-accent rounded px-1.5 py-0.5 text-[10px] font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Momentum bar */}
      <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent h-full rounded-full transition-all"
          style={{ width: `${narrative.strength}%` }}
        />
      </div>
    </Card>
  );
}

function SocialBuzzCloud({ trends }: { trends: SocialTrend[] }) {
  if (!trends.length) return null;

  const max = Math.max(...trends.map((t) => t.mentions));
  const min = Math.min(...trends.map((t) => t.mentions));
  const range = max - min || 1;

  // Stable alphabetical order: size carries the volume, position stays put
  // between renders so the cloud does not reshuffle on every revalidation.
  const ordered = [...trends].sort((a, b) => a.topic.localeCompare(b.topic));

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
      {ordered.map((trend) => {
        const ratio = (trend.mentions - min) / range;
        const fontSize = 0.7 + ratio * 1.6; // 0.7rem to 2.3rem
        const opacity = 0.45 + ratio * 0.55;
        return (
          <span
            key={trend.topic}
            className="text-accent cursor-default font-medium transition-transform hover:scale-110"
            style={{
              fontSize: `${fontSize}rem`,
              opacity,
            }}
            title={`${trend.mentions.toLocaleString()} mentions`}
          >
            {trend.topic}
          </span>
        );
      })}
    </div>
  );
}

function SkeletonSection({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-border h-12 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function SentimentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch data in parallel — use allSettled so one failure doesn't crash the page
  const [sentimentResult, narrativesResult, socialResult] = await Promise.allSettled([
    fetchJSON<{
      market?: MarketSentiment;
      method?: 'ai' | 'keyword';
      meta?: { articlesAnalyzed?: number };
    }>('/api/sentiment?limit=30'),
    fetchJSON<{
      narratives?: Narrative[];
      method?: 'ai' | 'keyword';
      summary?: { dominantNarrative?: string };
    }>('/api/narratives'),
    fetchJSON<{
      data?: {
        trends?: SocialTrend[];
      };
    }>('/api/social?view=trends&limit=30'),
  ]);

  const sentimentData = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
  const narrativesData = narrativesResult.status === 'fulfilled' ? narrativesResult.value : null;
  const socialData = socialResult.status === 'fulfilled' ? socialResult.value : null;

  // Missing data renders as an unavailable state, never as invented numbers.
  const market = sentimentData?.market ?? null;
  const narratives = narrativesData?.narratives ?? [];
  const narrativesAreKeyword = narrativesData?.method === 'keyword';
  const socialTrends: SocialTrend[] = (socialData?.data?.trends ?? [])
    .map((t) => {
      const raw = t as unknown as Record<string, unknown>;
      return {
        topic: String(raw.topic ?? raw.coin ?? ''),
        mentions: Number(raw.mentions ?? raw.volume ?? 0),
      };
    })
    .filter((t) => t.topic !== '' && Number.isFinite(t.mentions) && t.mentions > 0);

  const gaugeValue = market ? Math.round(((market.score + 100) / 200) * 100) : 0; // -100..100 → 0..100
  const gaugeLabel = market ? labelFor(market.overall) : '';

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* ---- Page heading ---- */}
        <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
          Sentiment & Social Intelligence
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Real-time market sentiment analysis powered by news, social data, and AI — track what the
          crypto community is thinking and talking about.
        </p>

        {/* ================================================================ */}
        {/* SECTION 1 — Overall Market Sentiment                             */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Overall Market Sentiment">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-serif text-xl font-bold">
            <Brain className="text-accent h-5 w-5" />
            Overall Market Sentiment
          </h2>

          {market ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              {/* Gauge */}
              <Card className="flex flex-col items-center justify-center p-6">
                <Suspense fallback={<SkeletonSection rows={2} />}>
                  <FearGreedGauge value={gaugeValue} label={gaugeLabel} />
                </Suspense>
              </Card>

              {/* Summary + Drivers */}
              <div className="flex flex-col gap-4">
                <Card className="flex-1 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="text-accent h-4 w-4" />
                    <h3 className="text-text-primary text-sm font-semibold">Market Summary</h3>
                    <span className="text-text-tertiary bg-border/50 ml-auto rounded-full px-2 py-0.5 text-[10px]">
                      Confidence: {market.confidence}%
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">{market.summary}</p>
                </Card>

                <Card className="p-5">
                  <h3 className="text-text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Key Sentiment Drivers
                  </h3>
                  <ul className="space-y-2">
                    {market.keyDrivers.map((driver, i) => (
                      <li key={i} className="text-text-secondary flex items-center gap-2 text-sm">
                        <span className="bg-accent/10 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                          {i + 1}
                        </span>
                        {driver}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="text-text-secondary p-12 text-center">
              Market sentiment is temporarily unavailable.
            </Card>
          )}
        </section>

        {/* ================================================================ */}
        {/* SECTION 2 — Coin Sentiment Table                                 */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Coin Sentiment">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-serif text-xl font-bold">
            <BarChart3 className="text-accent h-5 w-5" />
            Coin Sentiment
          </h2>
          <Suspense fallback={<SkeletonSection rows={6} />}>
            <SentimentTable />
          </Suspense>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3 — Trending Narratives                                  */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Trending Narratives">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-serif text-xl font-bold">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Narratives
          </h2>
          {narrativesAreKeyword && narratives.length > 0 && (
            <p className="text-text-tertiary -mt-2 mb-4 text-xs">
              AI analysis is temporarily unavailable. These narratives are grouped by headline
              keywords.
            </p>
          )}

          {narratives.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {narratives.map((n) => (
                <NarrativeCard key={n.id} narrative={n} />
              ))}
            </div>
          ) : (
            <Card className="text-text-secondary p-12 text-center">
              Narrative data is temporarily unavailable.
            </Card>
          )}
        </section>

        {/* ================================================================ */}
        {/* SECTION 4 — Influencer Feed                                      */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Influencer Feed">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-serif text-xl font-bold">
            <Users className="text-accent h-5 w-5" />
            Top Influencer Feed
          </h2>
          <Suspense fallback={<SkeletonSection rows={5} />}>
            <InfluencerFeed />
          </Suspense>
        </section>

        {/* ================================================================ */}
        {/* SECTION 5 — Social Buzz Cloud                                    */}
        {/* ================================================================ */}
        <section className="mb-4" aria-label="Social Buzz">
          <h2 className="text-text-primary mb-4 flex items-center gap-2 font-serif text-xl font-bold">
            <Hash className="text-accent h-5 w-5" />
            Social Buzz
          </h2>
          <Card className="p-6">
            {socialTrends.length > 0 ? (
              <>
                <SocialBuzzCloud trends={socialTrends} />
                <p className="text-text-tertiary mt-2 text-center text-[10px]">
                  Sized by mention volume across social platforms
                </p>
              </>
            ) : (
              <p className="text-text-secondary py-6 text-center">
                Social buzz data is temporarily unavailable.
              </p>
            )}
          </Card>
        </section>
      </main>
      <PageShareSection
        title="Crypto Market Sentiment — Fear & Greed, Social Buzz"
        description="Real-time crypto sentiment analysis with Fear & Greed Index, social trends, and influencer signals."
        url={`https://cryptocurrency.cv/${locale}/sentiment`}
      />
      <Footer />
    </>
  );
}
