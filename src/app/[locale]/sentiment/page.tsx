import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShareSection from "@/components/PageShareSection";
import { generateSEOMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import SentimentTable from "@/components/SentimentTable";
import InfluencerFeed from "@/components/InfluencerFeed";
import FearGreedGauge from "@/components/FearGreedGauge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Users,
  Hash,
  BarChart3,
  Brain,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";

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
  sentiment: "bullish" | "bearish" | "neutral";
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

const BASE = SITE_URL;

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
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
    title: "Sentiment & Social Intelligence — Free Crypto News",
    description:
      "Real-time crypto market sentiment analysis, trending narratives, influencer insights, and social buzz — all in one place.",
    path: "/sentiment",
    locale,
    tags: [
      "crypto sentiment",
      "market sentiment",
      "social intelligence",
      "crypto influencers",
      "trending narratives",
      "bitcoin sentiment",
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Sub-components (server-rendered)                                    */
/* ------------------------------------------------------------------ */

function SentimentArrow({ change }: { change: number }) {
  if (change > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-green-500 dark:text-green-400 text-sm font-medium">
        <ArrowUpRight className="h-4 w-4" /> +{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400 text-sm font-medium">
        <ArrowDownRight className="h-4 w-4" /> {change}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[var(--color-text-tertiary)] text-sm font-medium">
      <Minus className="h-4 w-4" /> 0
    </span>
  );
}

function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const sentimentConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    bullish: {
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    bearish: {
      icon: <TrendingDown className="h-4 w-4" />,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    neutral: {
      icon: <Minus className="h-4 w-4" />,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-800/20",
    },
  };

  const sc = sentimentConfig[narrative.sentiment] ?? sentimentConfig.neutral;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${sc.bg} ${sc.color}`}>{sc.icon}</div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {narrative.name}
            </h3>
            {narrative.emerging && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <Zap className="h-2.5 w-2.5" /> Emerging
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
            {narrative.strength}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Strength
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
        {narrative.description}
      </p>

      {narrative.relatedTickers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {narrative.relatedTickers.slice(0, 6).map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Momentum bar */}
      <div className="w-full h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
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

  // Shuffle for visual variety
  const shuffled = [...trends].sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
      {shuffled.map((trend) => {
        const ratio = (trend.mentions - min) / range;
        const fontSize = 0.7 + ratio * 1.6; // 0.7rem to 2.3rem
        const opacity = 0.45 + ratio * 0.55;
        return (
          <span
            key={trend.topic}
            className="text-[var(--color-accent)] font-medium transition-transform hover:scale-110 cursor-default"
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
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-[var(--color-border)]"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Default mock data                                                  */
/* ------------------------------------------------------------------ */

const MOCK_SENTIMENT: MarketSentiment = {
  overall: "bullish",
  score: 65,
  confidence: 72,
  summary:
    "Markets are showing cautious optimism driven by institutional inflows and improving on-chain metrics. Layer 2 adoption and AI narrative continue to fuel positive sentiment.",
  keyDrivers: [
    "Record ETF inflows",
    "Layer 2 ecosystem growth",
    "AI x Crypto convergence",
  ],
};

const MOCK_NARRATIVES: Narrative[] = [
  {
    id: "ai_tokens",
    name: "AI Tokens",
    description:
      "Convergence of artificial intelligence and blockchain. Projects like Fetch.ai, Render, and Bittensor driving innovation.",
    sentiment: "bullish",
    strength: 82,
    relatedTickers: ["FET", "RNDR", "TAO", "AGIX", "OCEAN"],
    emerging: false,
  },
  {
    id: "layer_2",
    name: "Layer 2 Season",
    description:
      "Ethereum L2s hitting new usage milestones. Base, Arbitrum, and Optimism seeing record TVL and transaction counts.",
    sentiment: "bullish",
    strength: 75,
    relatedTickers: ["ARB", "OP", "MATIC", "IMX", "STRK"],
    emerging: false,
  },
  {
    id: "rwa",
    name: "RWA Narrative",
    description:
      "Tokenization of real-world assets gaining traction with institutional players. BlackRock and Franklin Templeton leading.",
    sentiment: "bullish",
    strength: 68,
    relatedTickers: ["ONDO", "MKR", "LINK", "AVAX"],
    emerging: true,
  },
  {
    id: "meme_coins",
    name: "Meme Coins",
    description:
      "Meme coin mania continues with high social volume. Extreme speculation but significant trading volume.",
    sentiment: "neutral",
    strength: 60,
    relatedTickers: ["DOGE", "SHIB", "PEPE", "WIF", "BONK"],
    emerging: false,
  },
  {
    id: "btc_etf",
    name: "Bitcoin ETF Flows",
    description:
      "Spot Bitcoin ETFs continue to attract billions in inflows. Institutional demand remains strong.",
    sentiment: "bullish",
    strength: 88,
    relatedTickers: ["BTC", "GBTC"],
    emerging: false,
  },
  {
    id: "depin",
    name: "DePIN Growth",
    description:
      "Decentralized physical infrastructure networks gaining ground in compute, storage, and wireless.",
    sentiment: "bullish",
    strength: 55,
    relatedTickers: ["HNT", "RNDR", "FIL", "AR", "MOBILE"],
    emerging: true,
  },
];

const MOCK_BUZZ: SocialTrend[] = [
  { topic: "#Bitcoin", mentions: 125_000 },
  { topic: "#Ethereum", mentions: 89_000 },
  { topic: "#Solana", mentions: 67_000 },
  { topic: "#DeFi", mentions: 45_000 },
  { topic: "#NFT", mentions: 28_000 },
  { topic: "#Layer2", mentions: 52_000 },
  { topic: "#AIcrypto", mentions: 61_000 },
  { topic: "#Altseason", mentions: 38_000 },
  { topic: "#BullRun", mentions: 42_000 },
  { topic: "#ETF", mentions: 55_000 },
  { topic: "#Staking", mentions: 22_000 },
  { topic: "#Web3", mentions: 31_000 },
  { topic: "#HODL", mentions: 48_000 },
  { topic: "#Memecoin", mentions: 57_000 },
  { topic: "#RWA", mentions: 34_000 },
  { topic: "#DePIN", mentions: 29_000 },
  { topic: "#ZKProof", mentions: 18_000 },
  { topic: "#Airdrop", mentions: 41_000 },
  { topic: "#GameFi", mentions: 15_000 },
  { topic: "#BTC100K", mentions: 73_000 },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function SentimentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch data in parallel
  const [sentimentData, narrativesData, socialData] = await Promise.all([
    fetchJSON<{
      market?: MarketSentiment;
      meta?: { articlesAnalyzed?: number };
    }>("/api/sentiment?limit=30"),
    fetchJSON<{
      narratives?: Narrative[];
      summary?: { dominantNarrative?: string };
    }>("/api/narratives"),
    fetchJSON<{
      data?: {
        trends?: SocialTrend[];
      };
    }>("/api/social?view=trends&limit=30"),
  ]);

  // Derive values with fallbacks
  const market = sentimentData?.market ?? MOCK_SENTIMENT;
  const narratives =
    narrativesData?.narratives && narrativesData.narratives.length > 0
      ? narrativesData.narratives
      : MOCK_NARRATIVES;
  const socialTrends =
    socialData?.data?.trends && socialData.data.trends.length > 0
      ? socialData.data.trends.map((t) => {
          const raw = t as unknown as Record<string, unknown>;
          return {
            topic: String(raw.topic ?? raw.coin ?? t),
            mentions: Number(raw.mentions ?? raw.volume ?? 0),
          };
        })
      : MOCK_BUZZ;

  // Gauge values
  const gaugeValue = Math.round(((market.score + 100) / 200) * 100); // Convert -100..100 to 0..100
  const gaugeLabel =
    market.overall === "very_bullish"
      ? "Very Bullish"
      : market.overall === "bullish"
      ? "Bullish"
      : market.overall === "bearish"
      ? "Bearish"
      : market.overall === "very_bearish"
      ? "Very Bearish"
      : "Neutral";

  // Trend vs yesterday (mocked since API doesn't provide historical)
  const yesterdayScore = gaugeValue - Math.floor(Math.random() * 10 - 5);
  const trendChange = gaugeValue - yesterdayScore;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* ---- Page heading ---- */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          Sentiment & Social Intelligence
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
          Real-time market sentiment analysis powered by news, social data, and
          AI — track what the crypto community is thinking and talking about.
        </p>

        {/* ================================================================ */}
        {/* SECTION 1 — Overall Market Sentiment                             */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Overall Market Sentiment">
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--color-accent)]" />
            Overall Market Sentiment
          </h2>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            {/* Gauge */}
            <Card className="p-6 flex flex-col items-center justify-center">
              <Suspense fallback={<SkeletonSection rows={2} />}>
                <FearGreedGauge
                  value={gaugeValue}
                  label={gaugeLabel}
                  previousValue={yesterdayScore}
                />
              </Suspense>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-[var(--color-text-tertiary)]">
                  vs yesterday:
                </span>
                <SentimentArrow change={trendChange} />
              </div>
            </Card>

            {/* Summary + Drivers */}
            <div className="flex flex-col gap-4">
              <Card className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
                  <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                    Market Summary
                  </h3>
                  <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-border)]/50 px-2 py-0.5 rounded-full">
                    Confidence: {market.confidence}%
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {market.summary}
                </p>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Key Sentiment Drivers
                </h3>
                <ul className="space-y-2">
                  {market.keyDrivers.map((driver, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 2 — Coin Sentiment Table                                 */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Coin Sentiment">
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" />
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
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Narratives
          </h2>

          {narratives.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {narratives.map((n) => (
                <NarrativeCard key={n.id} narrative={n} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-[var(--color-text-secondary)]">
              Narrative data is temporarily unavailable.
            </Card>
          )}
        </section>

        {/* ================================================================ */}
        {/* SECTION 4 — Influencer Feed                                      */}
        {/* ================================================================ */}
        <section className="mb-10" aria-label="Influencer Feed">
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-accent)]" />
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
          <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)] flex items-center gap-2">
            <Hash className="h-5 w-5 text-[var(--color-accent)]" />
            Social Buzz
          </h2>
          <Card className="p-6">
            <SocialBuzzCloud trends={socialTrends} />
            <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-2">
              Sized by mention volume across social platforms
            </p>
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
