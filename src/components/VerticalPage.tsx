'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FeaturedCard, NewsCardDefault, NewsCardCompact } from '@/components/NewsCard';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/lib/crypto-news';
import type { NewsVertical } from '@/lib/verticals';
import { Building2, Code, Globe, Layers, Newspaper } from 'lucide-react';

const ICON_MAP: Record<string, typeof Building2> = {
  Building2,
  Code,
  Globe,
  Layers,
};

const RELATED_VERTICALS: Record<string, { label: string; href: string }[]> = {
  business: [
    { label: 'Markets', href: '/markets' },
    { label: 'Regulation', href: '/regulation' },
  ],
  tech: [
    { label: 'Web3', href: '/web3' },
    { label: 'DeFi', href: '/defi-news' },
  ],
  web3: [
    { label: 'Technology', href: '/tech' },
    { label: 'DeFi', href: '/defi-news' },
  ],
  'defi-news': [
    { label: 'Markets', href: '/markets' },
    { label: 'Technology', href: '/tech' },
  ],
};

interface VerticalPageProps {
  vertical: NewsVertical;
  articles: NewsArticle[];
  total: number;
  locale: string;
}

export default function VerticalPage({ vertical, articles, total, locale }: VerticalPageProps) {
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const Icon = ICON_MAP[vertical.icon] ?? Newspaper;

  const filteredArticles = activeSubcategory
    ? articles.filter((a) => {
        const text = `${a.title} ${a.description ?? ''}`.toLowerCase();
        return text.includes(activeSubcategory.replace(/-/g, ' '));
      })
    : articles;

  const featuredArticle = filteredArticles[0] ?? null;
  const remainingArticles = filteredArticles.slice(1);
  const trendingArticles = articles.slice(0, 5);
  const related = RELATED_VERTICALS[vertical.slug] ?? [];

  return (
    <>
      <Header />
      <main className="container-main space-y-10 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-text-tertiary">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-text-primary">{vertical.name}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${vertical.color}15`, color: vertical.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
              {vertical.name}
            </h1>
          </div>
          <p className="max-w-2xl text-text-secondary">{vertical.description}</p>
        </header>

        {/* Subcategory filters */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Subcategory filters">
          <button
            role="tab"
            aria-selected={activeSubcategory === null}
            onClick={() => setActiveSubcategory(null)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeSubcategory === null
                ? 'text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary',
            )}
            style={activeSubcategory === null ? { backgroundColor: vertical.color } : undefined}
          >
            All
          </button>
          {vertical.subcategories.map((sub) => (
            <button
              key={sub}
              role="tab"
              aria-selected={activeSubcategory === sub}
              onClick={() => setActiveSubcategory(sub)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                activeSubcategory === sub
                  ? 'text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary',
              )}
              style={activeSubcategory === sub ? { backgroundColor: vertical.color } : undefined}
            >
              {sub.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        {filteredArticles.length === 0 ? (
          <p className="py-12 text-center text-text-tertiary">
            No articles found for this section.
          </p>
        ) : (
          <div className="flex gap-10">
            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Featured Article */}
              {featuredArticle && (
                <div className="mb-10 border-b border-border pb-10">
                  <FeaturedCard article={featuredArticle} />
                </div>
              )}

              {/* Latest heading */}
              <h2 className="mb-6 font-serif text-xl font-bold text-text-primary">
                Latest {vertical.name} News
              </h2>

              {/* News Grid */}
              {remainingArticles.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((article) => (
                    <NewsCardDefault key={article.link} article={article} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 space-y-8">
                {/* Trending in Vertical */}
                <div>
                  <h3 className="mb-4 font-serif text-lg font-bold text-text-primary">
                    Trending in {vertical.name}
                  </h3>
                  <div className="space-y-4">
                    {trendingArticles.map((article) => (
                      <NewsCardCompact key={article.link} article={article} />
                    ))}
                  </div>
                </div>

                {/* Related Sections */}
                {related.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-serif text-sm font-bold tracking-wider text-text-tertiary uppercase">
                      Related
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {related.map((r) => (
                        <Link
                          key={r.href}
                          href={r.href}
                          className="rounded-full border border-border px-3 py-1 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                        >
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
