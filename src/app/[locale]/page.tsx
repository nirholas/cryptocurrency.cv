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
import NewsletterCTA from "@/components/NewsletterCTA";
import ExploreMore from "@/components/ExploreMore";
import NewsCard, {
  FeaturedCard,
} from "@/components/NewsCard";
import {
  WebsiteStructuredData,
  OrganizationStructuredData,
  NewsListStructuredData,
} from "@/components/StructuredData";
import {
  DateHeader,
  EditorsPicks,
  CategorySection,
  MostRead,
  OpinionSection,
  SectionHeader,
} from "@/components/EditorialSection";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingTopicsWidget } from "@/components/TrendingTopics";
import { SentimentBanner } from "@/components/SentimentIndicator";
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
    title: "Free Crypto News — Breaking Crypto News, Analysis & Market Intelligence",
    description:
      "Breaking cryptocurrency news and in-depth analysis from 300+ sources. Coverage of Bitcoin, Ethereum, DeFi, regulation, and market movements — updated every minute.",
    path: "",
    locale,
    tags: [
      "crypto news",
      "cryptocurrency",
      "bitcoin news",
      "ethereum news",
      "defi",
      "market analysis",
    ],
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let data: { latest: NewsResponse; breaking: NewsResponse; trending: NewsResponse } | null = null;
  try {
    data = await getHomepageNews({ latestLimit: 50, trendingLimit: 10 });
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

  // ── Partition articles by category for editorial sections ──
  const usedLinks = new Set(articles.slice(0, 5).map((a) => a.link));
  const remainingArticles = articles.filter((a) => !usedLinks.has(a.link));

  const marketsArticles = remainingArticles.filter((a) => {
    const text = `${a.title} ${a.description || ""} ${a.category}`.toLowerCase();
    return ["trading", "markets"].includes(a.category) ||
      ["market", "price", "rally", "crash", "etf", "futures", "bull", "bear"].some((k) => text.includes(k));
  }).slice(0, 4);

  const defiArticles = remainingArticles.filter((a) => {
    const text = `${a.title} ${a.description || ""} ${a.category}`.toLowerCase();
    return a.category === "defi" ||
      ["defi", "yield", "lending", "dex", "tvl", "staking", "aave", "uniswap"].some((k) => text.includes(k));
  }).slice(0, 4);

  const regulationArticles = remainingArticles.filter((a) => {
    const text = `${a.title} ${a.description || ""} ${a.category}`.toLowerCase();
    return a.category === "regulation" ||
      ["regulation", "sec", "cftc", "lawsuit", "legal", "compliance", "policy", "congress"].some((k) => text.includes(k));
  }).slice(0, 4);

  // Analysis/opinion — from research, macro, journalism sources
  const analysisKeywords = ["analysis", "opinion", "insight", "outlook", "forecast", "research", "review", "deep dive", "commentary"];
  const analysisSources = ["messari", "delphi", "nansen", "lyn alden", "paradigm", "a16z", "galaxy", "pantera"];
  const opinionArticles = remainingArticles.filter((a) => {
    const text = `${a.title} ${a.description || ""} ${a.source}`.toLowerCase();
    return analysisKeywords.some((k) => text.includes(k)) ||
      analysisSources.some((k) => text.includes(k));
  }).slice(0, 3);

  // Editor's picks — highest quality trending articles
  const editorsPicks = trending.slice(0, 3);

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

      {/* ── Date Header (newspaper-style) ── */}
      <DateHeader />

      <main id="main-content" className="min-h-screen">
        {/* ── Hero section ── */}
        <section className="relative border-b border-[var(--color-border)] overflow-hidden">
          {/* Subtle premium background pattern */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.015]" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-text-primary) 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }} />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--color-accent)] opacity-[0.03] blur-[120px] -translate-y-1/2 translate-x-1/3" />
          </div>
          <div className="container-main py-8 lg:py-10 relative z-10">
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
              <SectionHeader title="Top Stories" />
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

        {/* ── Markets & Trading Section ── */}
        <CategorySection
          title="Markets & Trading"
          href="/category/trading"
          icon="📈"
          articles={marketsArticles}
        />

        {/* ── DeFi Section ── */}
        <CategorySection
          title="DeFi & Web3"
          href="/category/defi"
          icon="🏦"
          articles={defiArticles}
        />

        {/* ── Analysis & Opinion ── */}
        <OpinionSection articles={opinionArticles} />

        {/* ── Regulation & Policy Section ── */}
        <CategorySection
          title="Regulation & Policy"
          href="/category/regulation"
          icon="⚖️"
          articles={regulationArticles}
        />

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
            <div>
              <SectionHeader title="Latest News" />
              <SmartFeed initialArticles={latestFeed} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Most Read */}
              <MostRead articles={trending} />

              {/* Categories */}
              <div>
                <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)]">
                  Sections
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

              {/* About — editorial-focused */}
              <div className="rounded-lg border border-[var(--color-border)] p-5 bg-[var(--color-surface-secondary)]">
                <h3 className="text-base font-bold font-serif mb-3">
                  About Free Crypto News
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  Real-time crypto news aggregated from {sourceCount}+ trusted sources.
                  Covering Bitcoin, Ethereum, DeFi, regulation, and emerging markets — updated every minute.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/about"
                    className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                  >
                    About us →
                  </Link>
                  <Link
                    href="/sources"
                    className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    Our sources →
                  </Link>
                </div>
              </div>

              {/* Trending Coins */}
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                <TrendingCoins />
              </Suspense>

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
