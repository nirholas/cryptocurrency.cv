/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageShareSection from '@/components/PageShareSection';
import { FeaturedOpinionCard, OpinionCard } from '@/components/OpinionCard';
import { getOpinionNews, type NewsResponse } from '@/lib/crypto-news';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export const revalidate = 300;

const TOPIC_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'Markets' },
  { key: 'geopolitical', label: 'Policy' },
  { key: 'developer', label: 'Tech' },
  { key: 'defi', label: 'DeFi' },
  { key: 'bitcoin', label: 'Bitcoin' },
  { key: 'ethereum', label: 'Ethereum' },
] as const;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topic?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Opinion & Commentary | Crypto Vision',
    description:
      'Analysis, editorials, and expert perspectives from across the crypto ecosystem. Opinion articles from CoinDesk, CoinTelegraph, and more.',
    alternates: {
      canonical: `https://cryptocurrency.cv/${locale}/opinion`,
    },
  };
}

export default async function OpinionPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { topic, page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const activeTopic = topic || 'all';
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);

  let data: NewsResponse | null = null;
  try {
    data = await getOpinionNews(21, {
      category: activeTopic !== 'all' ? activeTopic : undefined,
      page: currentPage,
      perPage: 21,
    });
  } catch {
    // Render empty state on failure
  }

  const articles = data?.articles ?? [];
  const featuredArticle = articles[0] ?? null;
  const remainingArticles = articles.slice(1);
  const totalCount = data?.totalCount ?? 0;
  const hasMore = articles.length < totalCount;

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-4 h-1 w-16 rounded-full bg-amber-500" aria-hidden="true" />
          <h1 className="mb-2 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            <span className="mr-2">💬</span>
            Opinion &amp; Commentary
          </h1>
          <p className="max-w-2xl text-text-secondary">
            Analysis, editorials, and expert perspectives from across the crypto ecosystem.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
          <span
            className="mt-0.5 text-lg leading-none text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          >
            ⚠️
          </span>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Articles in this section represent the views of their authors, not Crypto Vision.
            Opinion content is sourced from third-party publications and auto-detected from feed
            categories and URL paths.
          </p>
        </div>

        {/* Topic Filter Tabs */}
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by topic">
          {TOPIC_FILTERS.map((f) => (
            <a
              key={f.key}
              href={f.key === 'all' ? `/${locale}/opinion` : `/${locale}/opinion?topic=${f.key}`}
              role="tab"
              aria-selected={activeTopic === f.key}
              className={cn(
                'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTopic === f.key
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
              )}
            >
              {f.label}
            </a>
          ))}
        </div>

        {articles.length === 0 ? (
          <p className="py-12 text-center text-text-tertiary">
            No opinion articles found. Opinion content is auto-detected from feed categories and URL
            paths — check back later.
          </p>
        ) : (
          <div>
            {/* Featured Opinion */}
            {featuredArticle && (
              <div className="mb-10 border-b border-border pb-10">
                <FeaturedOpinionCard article={featuredArticle} />
              </div>
            )}

            {/* Opinion Grid */}
            {remainingArticles.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingArticles.map((article) => (
                  <OpinionCard key={article.link} article={article} />
                ))}
              </div>
            )}

            {/* Load More / Pagination */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <a
                  href={`/${locale}/opinion?${activeTopic !== 'all' ? `topic=${activeTopic}&` : ''}page=${currentPage + 1}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                >
                  Load more
                </a>
              </div>
            )}
          </div>
        )}
      </main>
      <PageShareSection
        title="Opinion & Commentary — Crypto News"
        description="Analysis, editorials, and expert perspectives from across the crypto ecosystem."
        url={`https://cryptocurrency.cv/${locale}/opinion`}
      />
      <Footer />
    </>
  );
}
