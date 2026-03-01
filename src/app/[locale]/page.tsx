/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Homepage — The Block-inspired editorial layout
 */

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingNewsBanner from "@/components/BreakingNewsBanner";
import MarketsSnapshot from "@/components/MarketsSnapshot";
import TopMovers from "@/components/TopMovers";
import TrendingCoins from "@/components/TrendingCoins";
import MarketMovers from "@/components/MarketMovers";
import NewsletterCTA from "@/components/NewsletterCTA";
import ExploreMore from "@/components/ExploreMore";
import NewsCard, {
  FeaturedCard,
  NewsCardCompact,
  NewsCardHeadline,
} from "@/components/NewsCard";
import {
  WebsiteStructuredData,
  OrganizationStructuredData,
  NewsListStructuredData,
} from "@/components/StructuredData";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingTopicsWidget } from "@/components/TrendingTopics";
import { SentimentBanner } from "@/components/SentimentIndicator";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { SmartFeed, FeedStatsWidget } from "@/components/SmartFeed";
import {
  getHomepageNews,
  getSourceCount,
  type NewsResponse,
  type NewsArticle,
} from "@/lib/crypto-news";
import { categories } from "@/lib/categories";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Crypto Vision News — Free Real-Time Crypto News API",
    description:
      "100% free crypto news API. No API keys. No rate limits. Real-time cryptocurrency news aggregation from 200+ sources covering Bitcoin, Ethereum, DeFi, Solana & altcoins.",
    path: "",
    locale,
    tags: [
      "crypto news",
      "cryptocurrency",
      "bitcoin",
      "ethereum",
      "defi",
      "news aggregator",
    ],
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let data: { latest: NewsResponse; breaking: NewsResponse; trending: NewsResponse } | null = null;
  try {
    data = await getHomepageNews({ latestLimit: 20, trendingLimit: 10 });
  } catch {
    // Render empty state on failure
  }

  const articles = data?.latest?.articles ?? [];
  const breaking = data?.breaking?.articles ?? [];
  const featured = articles[0] ?? null;
  const topGrid = articles.slice(1, 5);
  const latestFeed = articles.slice(5, 20);
  const trending = data?.trending?.articles ?? [];
  const sourceCount = getSourceCount();

  return (
    <>
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      {articles.length > 0 && <NewsListStructuredData articles={articles} />}

      <Header />

      {/* ── Breaking News ── */}
      <BreakingNewsBanner
        articles={breaking.map((a) => ({ title: a.title, link: a.link }))}
      />

      <main id="main-content" className="min-h-screen">
        {/* ── Hero section ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-8 lg:py-10">
            {featured ? (
              <FeaturedCard article={featured} />
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="aspect-[16/10] w-full" />
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
          <section className="border-b border-[var(--color-border)]">
            <div className="container-main py-8 lg:py-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {topGrid.map((article) => (
                  <NewsCard key={article.link} article={article} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Markets Snapshot ── */}
        <Suspense
          fallback={
            <section className="border-b border-[var(--color-border)]">
              <div className="container-main py-6">
                <div className="flex gap-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 shrink-0">
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

        {/* ── Top Movers (Gainers / Losers) ── */}
        <Suspense
          fallback={
            <section className="border-b border-[var(--color-border)]">
              <div className="container-main py-8">
                <Skeleton className="h-7 w-36 mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-[var(--color-border)] p-4 space-y-2">
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
            <SmartFeed initialArticles={latestFeed} />

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Trending */}
              <div>
                <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)]">
                  Trending
                </h3>
                {/* Horizontal scroll on mobile, vertical list on lg+ */}
                <div className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {trending.length > 0 ? (
                    trending.slice(0, 8).map((article, i) => (
                      <div
                        key={article.link}
                        className="min-w-[200px] shrink-0 lg:min-w-0 lg:shrink lg:pb-4 lg:border-b border-[var(--color-border)] lg:last:border-b-0"
                      >
                        <NewsCardHeadline article={article} index={i} />
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3 pb-4 border-b border-[var(--color-border)]">
                        <Skeleton className="h-8 w-8" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)]">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`}>
                      <Badge className="cursor-pointer hover:opacity-80 transition-opacity">
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

              {/* Stats */}
              <div className="rounded-lg border border-[var(--color-border)] p-5 bg-[var(--color-surface-secondary)]">
                <h3 className="text-base font-bold font-serif mb-4">
                  About FCN
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Sources</dt>
                    <dd className="font-semibold">{sourceCount}+</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">API Key</dt>
                    <dd className="font-semibold text-green-600">Not required</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Rate Limits</dt>
                    <dd className="font-semibold text-green-600">None</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">License</dt>
                    <dd className="font-semibold">MIT</dd>
                  </div>
                </dl>
                <Link
                  href="/developers"
                  className="mt-4 block text-center text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                >
                  View API Docs →
                </Link>
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
              <div className="rounded-lg border border-[var(--color-border)] p-5 bg-[var(--color-surface-secondary)]">
                <h3 className="text-base font-bold font-serif mb-3">
                  Explore
                </h3>
                <div className="space-y-1.5">
                  {[
                    { label: "Market Intelligence", href: "/intelligence" },
                    { label: "Token Unlocks", href: "/unlocks" },
                    { label: "DeFi Dashboard", href: "/defi" },
                    { label: "Fear & Greed Index", href: "/fear-greed" },
                    { label: "Market Heatmap", href: "/heatmap" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors py-1"
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
