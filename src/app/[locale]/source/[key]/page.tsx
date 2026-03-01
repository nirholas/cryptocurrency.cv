/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Source Profile Page — /source/[key]
 * Editorial-style publisher profile with latest articles, credibility info, and stats.
 */

import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { NewsCardCompact } from "@/components/NewsCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import { getSourceInfo, getLatestNews, type NewsArticle } from "@/lib/crypto-news";
import { SOURCE_TIERS, getSourceTier, getSourceCredibility, getSourceReputation, type SourceTier } from "@/lib/source-tiers";
import { getSourceProfile, type SourceProfile } from "@/lib/source-profiles";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; key: string }>;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function tierLabel(tier: SourceTier): { text: string; className: string } {
  switch (tier) {
    case 'tier1':
      return { text: 'Mainstream', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    case 'tier2':
      return { text: 'Premium', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
    case 'tier3':
      return { text: 'Established', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    case 'tier4':
      return { text: 'Aggregator', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    case 'research':
      return { text: 'Research', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
    case 'fintech':
      return { text: 'Fintech', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  }
}

function credibilityBar(score: number): { label: string; color: string; width: string } {
  if (score >= 0.9) return { label: 'Very High', color: 'bg-emerald-500', width: `${score * 100}%` };
  if (score >= 0.8) return { label: 'High', color: 'bg-green-500', width: `${score * 100}%` };
  if (score >= 0.7) return { label: 'Good', color: 'bg-lime-500', width: `${score * 100}%` };
  if (score >= 0.6) return { label: 'Moderate', color: 'bg-yellow-500', width: `${score * 100}%` };
  return { label: 'Low', color: 'bg-orange-500', width: `${score * 100}%` };
}

function getInitialColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-emerald-500 to-emerald-700',
    'from-orange-500 to-orange-700',
    'from-rose-500 to-rose-700',
    'from-cyan-500 to-cyan-700',
    'from-amber-500 to-amber-700',
    'from-indigo-500 to-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, key } = await params;
  const sourceInfo = getSourceInfo(key);
  const profile = getSourceProfile(key);

  if (!sourceInfo) {
    return generateSEOMetadata({
      title: 'Source Not Found',
      description: 'The requested news source could not be found.',
      path: `/source/${key}`,
      locale,
    });
  }

  return generateSEOMetadata({
    title: `${sourceInfo.name} — Latest Crypto News & Articles`,
    description: profile?.description ?? `Read the latest cryptocurrency news and analysis from ${sourceInfo.name}. Coverage includes ${sourceInfo.category} topics.`,
    path: `/source/${key}`,
    locale,
    tags: [sourceInfo.name, 'crypto news', sourceInfo.category, 'source'],
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function SourceProfilePage({ params }: Props) {
  const { locale, key } = await params;
  setRequestLocale(locale);

  const sourceInfo = getSourceInfo(key);
  if (!sourceInfo) {
    notFound();
  }

  const profile = getSourceProfile(key);
  const tier = getSourceTier(key);
  const credibility = getSourceCredibility(key);
  const reputation = getSourceReputation(key);
  const tierEntry = SOURCE_TIERS[key.toLowerCase()];
  const credBar = credibilityBar(credibility);

  // Fetch latest articles from this source
  let articles: NewsArticle[] = [];
  try {
    const response = await getLatestNews(50);
    articles = response.articles.filter(
      (a) => a.sourceKey === key || a.source.toLowerCase() === sourceInfo.name.toLowerCase()
    );
  } catch {
    // fall through
  }

  const latestArticles = articles.slice(0, 12);
  const topArticles = articles.slice(0, 4);
  const moreArticles = articles.slice(4, 12);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* ── Breadcrumbs ── */}
        <div className="border-b border-[var(--color-border)]">
          <nav aria-label="Breadcrumb" className="container-main py-3">
            <ol className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)]">
              <li>
                <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href="/sources" className="hover:text-[var(--color-accent)] transition-colors">
                  Sources
                </Link>
              </li>
              <li aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-[var(--color-text-secondary)]">
                {sourceInfo.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* ── Source Header ── */}
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          <div className="container-main py-8 lg:py-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Avatar / Logo Initial */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${getInitialColor(sourceInfo.name)} flex items-center justify-center shrink-0 shadow-lg`}>
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {sourceInfo.name.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Name + Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                    {sourceInfo.name}
                  </h1>
                  {tier && (
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${tierLabel(tier).className}`}>
                      {tierLabel(tier).text}
                    </span>
                  )}
                  <Badge variant="default" className="capitalize">
                    {sourceInfo.category}
                  </Badge>
                </div>

                {/* Description */}
                {profile?.description && (
                  <p className="text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed mb-4 max-w-2xl">
                    {profile.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
                  {profile?.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[var(--color-accent)] hover:underline font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                      Visit website
                    </a>
                  )}
                  {profile?.founded && (
                    <span>Est. {profile.founded}</span>
                  )}
                  {profile?.type && (
                    <span className="capitalize">{profile.type.replace('-', ' ')} publication</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Credibility */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Credibility
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div className={`h-full rounded-full ${credBar.color}`} style={{ width: credBar.width }} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {credBar.label}
                  </span>
                </div>
              </div>

              {/* Reputation */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Reputation Score
                </p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {reputation}<span className="text-sm font-normal text-[var(--color-text-tertiary)]">/100</span>
                </p>
              </div>

              {/* Article Count */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Recent Articles
                </p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {articles.length}
                </p>
              </div>

              {/* Focus Areas */}
              {profile?.focus && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                    Focus Areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.focus.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 text-xs rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Latest Articles ── */}
        <section className="container-main py-8 lg:py-10">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b border-[var(--color-border)]">
            Latest from {sourceInfo.name}
          </h2>

          {latestArticles.length > 0 ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
              {/* Main content */}
              <div>
                {/* Top stories grid */}
                {topArticles.length > 0 && (
                  <div className="grid gap-6 sm:grid-cols-2 mb-8">
                    {topArticles.map((article) => (
                      <NewsCard key={article.link} article={article} />
                    ))}
                  </div>
                )}

                {/* More articles list */}
                {moreArticles.length > 0 && (
                  <div className="space-y-0 divide-y divide-[var(--color-border)]">
                    {moreArticles.map((article) => (
                      <div key={article.link} className="py-4 first:pt-0">
                        <NewsCardCompact article={article} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-8">
                {/* About box */}
                <div className="rounded-lg border border-[var(--color-border)] p-5 bg-[var(--color-surface-secondary)]">
                  <h3 className="text-base font-bold font-serif mb-3">
                    About {sourceInfo.name}
                  </h3>
                  {profile?.description ? (
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                      {profile.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                      {sourceInfo.name} is a {sourceInfo.category} cryptocurrency news source aggregated by Free Crypto News.
                    </p>
                  )}
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-text-tertiary)]">Category</dt>
                      <dd className="font-medium capitalize">{sourceInfo.category}</dd>
                    </div>
                    {tier && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-text-tertiary)]">Tier</dt>
                        <dd className="font-medium">{tierLabel(tier).text}</dd>
                      </div>
                    )}
                    {profile?.founded && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-text-tertiary)]">Founded</dt>
                        <dd className="font-medium">{profile.founded}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-text-tertiary)]">Credibility</dt>
                      <dd className="font-medium">{Math.round(credibility * 100)}%</dd>
                    </div>
                  </dl>
                  {profile?.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block text-center text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      Visit {sourceInfo.name} →
                    </a>
                  )}
                </div>

                {/* Browse other sources */}
                <div className="rounded-lg border border-[var(--color-border)] p-5 bg-[var(--color-surface-secondary)]">
                  <h3 className="text-base font-bold font-serif mb-3">
                    Browse Sources
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { label: "All Sources", href: "/sources" },
                      { label: "Bitcoin Coverage", href: "/category/bitcoin" },
                      { label: "Ethereum Coverage", href: "/category/ethereum" },
                      { label: "DeFi Coverage", href: "/category/defi" },
                      { label: "Regulation Coverage", href: "/category/regulation" },
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
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-secondary)] mb-2">
                No recent articles from {sourceInfo.name}.
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Articles are updated in real-time from the RSS feed.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
