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
    title: "Free Crypto News — Real-Time Cryptocurrency News Aggregator",
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

  let data: NewsResponse | null = null;
  try {
    data = await getHomepageNews({ limit: 30 });
  } catch {
    // Render empty state on failure
  }

  const articles = data?.articles ?? [];
  const featured = articles[0] ?? null;
  const topGrid = articles.slice(1, 5);
  const latestFeed = articles.slice(5, 20);
  const trending = articles.slice(20, 30);
  const sourceCount = getSourceCount();

  return (
    <>
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      {articles.length > 0 && <NewsListStructuredData articles={articles} />}

      <Header />

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

        {/* ── Latest + Sidebar ── */}
        <section className="container-main py-8 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            {/* Latest feed */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-serif">Latest News</h2>
                <span className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <span className="live-dot" />
                  Live
                </span>
              </div>

              <div className="space-y-6">
                {latestFeed.length > 0 ? (
                  latestFeed.map((article) => (
                    <div
                      key={article.link}
                      className="pb-6 border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <NewsCardCompact article={article} />
                    </div>
                  ))
                ) : (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 pb-6 border-b border-[var(--color-border)]">
                      <Skeleton className="aspect-square w-20 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Trending */}
              <div>
                <h3 className="text-base font-bold font-serif mb-4 pb-2 border-b border-[var(--color-border)]">
                  Trending
                </h3>
                <div className="space-y-4">
                  {trending.length > 0 ? (
                    trending.slice(0, 8).map((article, i) => (
                      <div
                        key={article.link}
                        className="pb-4 border-b border-[var(--color-border)] last:border-b-0"
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
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
