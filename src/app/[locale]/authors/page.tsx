/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Authors Directory Page — /authors
 * Browse all detected authors with search and sort.
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthorCard from '@/components/AuthorCard';
import { Link } from '@/i18n/navigation';
import { generateSEOMetadata } from '@/lib/seo';
import { getAuthors } from '@/lib/authors';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return generateSEOMetadata({
    title: 'Authors — Crypto Journalists & Analysts',
    description:
      'Browse crypto news by journalist and analyst. Find articles from your favourite writers across CoinDesk, CoinTelegraph, The Block, and 300+ sources.',
    path: '/authors',
    locale,
    tags: ['crypto journalists', 'crypto authors', 'crypto analysts', 'crypto news writers'],
  });
}

/* ------------------------------------------------------------------ */
/*  Structured Data                                                   */
/* ------------------------------------------------------------------ */

function AuthorsStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Crypto News Authors',
    description: 'Directory of cryptocurrency journalists and analysts.',
    url: 'https://cryptocurrency.cv/authors',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Free Crypto News',
      url: 'https://cryptocurrency.cv',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function AuthorsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const sort = (['articles', 'recent', 'name'] as const).includes(
    sp.sort as 'articles' | 'recent' | 'name',
  )
    ? (sp.sort as 'articles' | 'recent' | 'name')
    : 'articles';
  const search = typeof sp.search === 'string' ? sp.search : undefined;

  let data;
  try {
    data = await getAuthors({ limit: 60, sort, search });
  } catch {
    // Render empty state on failure
  }

  const authors = data?.authors ?? [];
  const total = data?.total ?? 0;

  const sortOptions = [
    { value: 'articles', label: 'Most Articles' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'name', label: 'A–Z' },
  ];

  return (
    <>
      <AuthorsStructuredData />
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-tertiary">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-text-primary">Authors</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-10">
          <div className="mb-4 h-1 w-16 rounded-full bg-accent" aria-hidden="true" />
          <h1 className="mb-2 font-serif text-3xl font-bold text-text-primary md:text-4xl">
            ✍️ Authors
          </h1>
          <p className="max-w-2xl text-text-secondary">
            Browse articles by journalist and analyst across 300+ crypto news sources.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <form method="GET" className="max-w-sm flex-1">
            <input type="hidden" name="sort" value={sort} />
            <input
              type="search"
              name="search"
              placeholder="Search authors..."
              defaultValue={search}
              className="w-full rounded-lg border border-border bg-(--color-surface) px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/50 focus:outline-none"
            />
          </form>

          {/* Sort */}
          <nav className="flex gap-1.5" aria-label="Sort authors">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/authors?sort=${opt.value}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-accent text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Results count */}
        <p className="mb-6 text-sm text-text-tertiary">
          {total} {total === 1 ? 'author' : 'authors'} found
          {search && <> for &ldquo;{search}&rdquo;</>}
        </p>

        {/* Author Grid */}
        {authors.length === 0 ? (
          <p className="py-12 text-center text-text-tertiary">No authors found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {authors.map((author) => (
              <AuthorCard key={author.slug} author={author} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
