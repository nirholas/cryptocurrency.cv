/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Homepage — The Block-inspired editorial layout
 */

import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BreakingNewsBanner from '@/components/BreakingNewsBanner';
import MarketsSnapshot from '@/components/MarketsSnapshot';
import TopMovers from '@/components/TopMovers';
import TrendingCoins from '@/components/TrendingCoins';
import MarketMovers from '@/components/MarketMovers';
import NewsletterCTA from '@/components/NewsletterCTA';
import ExploreMore from '@/components/ExploreMore';
import NewsCard, { FeaturedCard } from '@/components/NewsCard';
import {
  WebsiteStructuredData,
  OrganizationStructuredData,
  NewsListStructuredData,
} from '@/components/StructuredData';
import {
  DateHeader,
  EditorsPicks,
  CategorySection,
  MostRead,
  OpinionSection,
  SectionHeader,
} from '@/components/EditorialSection';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingTopicsWidget } from '@/components/TrendingTopics';
import { SentimentBanner } from '@/components/SentimentIndicator';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { SmartFeed, FeedStatsWidget } from '@/components/SmartFeed';
import DataUnavailable from '@/components/DataUnavailable';
import {
  getHomepageNews,
  getSourceCount,
  type NewsResponse,
  type NewsArticle,
} from '@/lib/crypto-news';
import { categories } from '@/lib/categories';
import { Link } from '@/i18n/navigation';
import { generateSEOMetadata } from '@/lib/seo';
import { getUnsplashFallback, getUniqueFallbacks } from '@/lib/unsplash-fallback';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Vision — Live Crypto Prices, Breaking News & Market Intelligence',
    description:
      'Live cryptocurrency prices, breaking news, and market analysis. 350+ free API endpoints, developer SDKs, embeddable widgets, and AI integrations. Bitcoin, Ethereum, DeFi & more — updated every minute.',
    path: '',
    locale,
    tags: [
      'crypto prices',
      'cryptocurrency',
      'bitcoin',
      'ethereum',
      'crypto news',
      'market data',
      'defi',
      'crypto API',
    ],
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'home' });

  let data: { latest: NewsResponse; breaking: NewsResponse; trending: NewsResponse } | null = null;
  try {
    data = await getHomepageNews({ latestLimit: 50, trendingLimit: 10 });
  } catch {
    // Render empty state on failure
  }

  const articles = data?.latest?.articles ?? [];
  const breaking = data?.breaking?.articles ?? [];
  const featured = articles[0] ?? null;

  // ── Build top-stories grid ──
  // 1. Prefer articles with real images; dedup by actual image URL
  const usedImages = new Set<string>();
  if (featured?.imageUrl) usedImages.add(featured.imageUrl);

  const topGrid: typeof articles = [];
  let nextIdx = 1;
  // First pass: pick articles that have their own image and aren't duplicates
  while (topGrid.length < 4 && nextIdx < articles.length) {
    const a = articles[nextIdx++];
    if (!a.imageUrl) continue;
    if (usedImages.has(a.imageUrl)) continue;
    usedImages.add(a.imageUrl);
    topGrid.push(a);
  }
  // Second pass: fill remaining slots with any articles (will get fallback images)
  if (topGrid.length < 4) {
    let fillIdx = 1;
    const topLinks = new Set(topGrid.map((a) => a.link));
    while (topGrid.length < 4 && fillIdx < articles.length) {
      const a = articles[fillIdx++];
      if (topLinks.has(a.link) || a.link === featured?.link) continue;
      if (a.imageUrl && usedImages.has(a.imageUrl)) continue;
      if (a.imageUrl) usedImages.add(a.imageUrl);
      topGrid.push(a);
    }
  }

  // 2. Assign guaranteed-unique fallback images for articles missing imageUrl
  const needsFallback = topGrid.filter((a) => !a.imageUrl);
  if (needsFallback.length > 0) {
    // Exclude hero's effective image from the fallback pool
    const excludeSet = new Set(usedImages);
    if (featured && !featured.imageUrl) {
      excludeSet.add(getUnsplashFallback(featured.title || featured.source || 'crypto'));
    }
    const fallbackUrls = getUniqueFallbacks(
      needsFallback.map((a) => a.title || a.source || 'crypto'),
      excludeSet,
    );
    needsFallback.forEach((a, i) => {
      (a as { imageUrl?: string }).imageUrl = fallbackUrls[i];
    });
  }
  // Also ensure hero has an image
  if (featured && !featured.imageUrl) {
    (featured as { imageUrl?: string }).imageUrl = getUnsplashFallback(
      featured.title || featured.source || 'crypto',
    );
  }

  // ── Collect used links so downstream sections skip them ──
  const heroAndGridLinks = new Set([featured, ...topGrid].filter(Boolean).map((a) => a.link));
  const latestFeed = articles.filter((a) => !heroAndGridLinks.has(a.link)).slice(0, 15);
  const trending = data?.trending?.articles ?? [];
  const sourceCount = getSourceCount();

  // ── Partition articles by category for editorial sections ──
  const remainingArticles = articles.filter((a) => !heroAndGridLinks.has(a.link));

  const marketsArticles = remainingArticles
    .filter((a) => {
      const text = `${a.title} ${a.description || ''} ${a.category}`.toLowerCase();
      return (
        ['trading', 'markets'].includes(a.category) ||
        ['market', 'price', 'rally', 'crash', 'etf', 'futures', 'bull', 'bear'].some((k) =>
          text.includes(k),
        )
      );
    })
    .slice(0, 4);

  const defiArticles = remainingArticles
    .filter((a) => {
      const text = `${a.title} ${a.description || ''} ${a.category}`.toLowerCase();
      return (
        a.category === 'defi' ||
        ['defi', 'yield', 'lending', 'dex', 'tvl', 'staking', 'aave', 'uniswap'].some((k) =>
          text.includes(k),
        )
      );
    })
    .slice(0, 4);

  const regulationArticles = remainingArticles
    .filter((a) => {
      const text = `${a.title} ${a.description || ''} ${a.category}`.toLowerCase();
      return (
        a.category === 'regulation' ||
        ['regulation', 'sec', 'cftc', 'lawsuit', 'legal', 'compliance', 'policy', 'congress'].some(
          (k) => text.includes(k),
        )
      );
    })
    .slice(0, 4);

  // Analysis/opinion — from research, macro, journalism sources
  const analysisKeywords = [
    'analysis',
    'opinion',
    'insight',
    'outlook',
    'forecast',
    'research',
    'review',
    'deep dive',
    'commentary',
  ];
  const analysisSources = [
    'messari',
    'delphi',
    'nansen',
    'lyn alden',
    'paradigm',
    'a16z',
    'galaxy',
    'pantera',
  ];
  const opinionArticles = remainingArticles
    .filter((a) => {
      const text = `${a.title} ${a.description || ''} ${a.source}`.toLowerCase();
      return (
        analysisKeywords.some((k) => text.includes(k)) ||
        analysisSources.some((k) => text.includes(k))
      );
    })
    .slice(0, 3);

  // Editor's picks — highest quality trending articles
  const editorsPicks = trending.slice(0, 3);

  // If primary data failed, show a clear message instead of empty layout
  if (articles.length === 0) {
    return (
      <>
        <Header />
        <main id="main-content" className="min-h-screen">
          <DataUnavailable
            title={t('feedUnavailable')}
            message={t('feedUnavailableHint')}
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      {articles.length > 0 && <NewsListStructuredData articles={articles} />}

      <Header />

      {/* ── Breaking News ── */}
      <BreakingNewsBanner articles={breaking.map((a) => ({ title: a.title, link: a.link }))} />

      {/* ── Date Header (newspaper-style) ── */}
      <DateHeader />

      <main id="main-content" className="min-h-screen">
        {/* ── Hero section ── */}
        <section className="border-border relative overflow-hidden border-b">
          {/* Subtle premium background pattern */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, var(--color-text-primary) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="bg-accent absolute top-0 right-0 h-150 w-150 translate-x-1/3 -translate-y-1/2 rounded-full opacity-[0.03] blur-[120px]" />
          </div>
          <div className="container-main relative z-10 py-8 lg:py-10">
            {featured ? (
              <FeaturedCard article={featured} />
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="aspect-16/10 w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Top stories grid ── */}
        {topGrid.length > 0 && (
          <section className="border-border border-b">
            <div className="container-main py-8 lg:py-10">
              <SectionHeader title={t('topStories')} />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {topGrid.map((article) => (
                  <NewsCard key={article.link} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Editor's Picks ── */}
        <EditorsPicks articles={editorsPicks} />

        {/* ── Markets Snapshot ── */}
        <Suspense
          fallback={
            <section className="border-border border-b">
              <div className="container-main py-6">
                <div className="flex gap-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex shrink-0 items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          }
        >
          <MarketsSnapshot />
        </Suspense>

        {/* ── Markets & Trading Section ── */}
        <CategorySection
          title={t('marketsTrading')}
          href="/category/trading"
          icon="📈"
          articles={marketsArticles}
        />

        {/* ── DeFi Section ── */}
        <CategorySection
          title={t('defiWeb3')}
          href="/category/defi"
          icon="🏦"
          articles={defiArticles}
        />

        {/* ── Analysis & Opinion ── */}
        <OpinionSection articles={opinionArticles} />

        {/* ── Regulation & Policy Section ── */}
        <CategorySection
          title={t('regulationPolicy')}
          href="/category/regulation"
          icon="⚖️"
          articles={regulationArticles}
        />


        {/* ── Top Movers (Gainers / Losers) ── */}
        <Suspense
          fallback={
            <section className="border-border border-b">
              <div className="container-main py-8">
                <Skeleton className="mb-4 h-7 w-36" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border-border space-y-2 rounded-lg border p-4">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          }
        >
          <TopMovers />
        </Suspense>

        {/* ── Market Sentiment Banner ── */}
        <Suspense fallback={null}>
          <SentimentBanner />
        </Suspense>

        {/* ── Latest + Sidebar ── */}
        <section className="container-main py-8 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            {/* Smart feed (replaces static list with auto-refresh + modes) */}
            <div>
              <SectionHeader title={t('latestNews')} />
              <SmartFeed initialArticles={latestFeed} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Most Read */}
              <MostRead articles={trending} />

              {/* Categories */}
              <div>
                <h3 className="border-border mb-4 border-b pb-2 font-serif text-base font-bold">
                  {t('sections')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`}>
                      <Badge className="cursor-pointer transition-opacity hover:opacity-80">
                        {cat.icon} {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trending Topics (AI-powered narrative clusters) */}
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <TrendingTopicsWidget />
              </Suspense>

              {/* Feed Stats */}
              <FeedStatsWidget />

              {/* Live On-Chain Activity */}
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                <LiveActivityFeed maxItems={5} compact />
              </Suspense>

              {/* About — editorial-focused */}
              <div className="border-border bg-surface-secondary rounded-lg border p-5">
                <h3 className="mb-3 font-serif text-base font-bold">{t('about')}</h3>
                <p className="text-text-secondary mb-4 text-sm leading-relaxed">
                  {t('aboutBody', { sourceCount })}
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/about"
                    className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                  >
                    {t('aboutLink')}
                  </Link>
                  <Link
                    href="/sources"
                    className="text-text-secondary hover:text-accent text-sm font-medium transition-colors"
                  >
                    {t('sourcesLink')}
                  </Link>
                </div>
              </div>

              {/* Trending Coins */}
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                <TrendingCoins />
              </Suspense>

              {/* Market Movers */}
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <MarketMovers />
              </Suspense>

              {/* Quick Links */}
              <div className="border-border bg-surface-secondary rounded-lg border p-5">
                <h3 className="mb-3 font-serif text-base font-bold">{t('explore')}</h3>
                <div className="space-y-1.5">
                  {[
                    { label: t('marketIntelligence'), href: '/intelligence' },
                    { label: t('tokenUnlocks'), href: '/unlocks' },
                    { label: t('defiDashboard'), href: '/defi' },
                    { label: t('fearGreedIndex'), href: '/fear-greed' },
                    { label: t('marketHeatmap'), href: '/heatmap' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-text-secondary hover:text-accent block py-1 text-sm transition-colors"
                    >
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <NewsletterCTA />

        {/* ── Explore More ── */}
        <ExploreMore />
      </main>

      <Footer />
    </>
  );
}
