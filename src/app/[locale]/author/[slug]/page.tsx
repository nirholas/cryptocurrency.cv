/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Author Profile Page — /author/[slug]
 * Shows all articles by a specific author across all sources.
 */

import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { NewsCardDefault } from '@/components/NewsCard';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/i18n/navigation';
import { NonceScript } from '@/components/NonceScript';
import { generateSEOMetadata } from '@/lib/seo';
import { getAuthorBySlug } from '@/lib/authors';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  let data: Awaited<ReturnType<typeof getAuthorBySlug>> = null;
  try {
    data = await getAuthorBySlug(slug);
  } catch {
    // Fall through to not-found metadata
  }

  if (!data) {
    return generateSEOMetadata({
      title: 'Author Not Found',
      description: 'The requested author could not be found.',
      path: `/author/${slug}`,
      locale,
    });
  }

  const { author } = data;

  return generateSEOMetadata({
    title: `${author.name} — Crypto News & Articles`,
    description: `Read all ${author.articleCount} cryptocurrency articles by ${author.name}. Covering news from ${author.sources.join(', ')}.`,
    path: `/author/${author.slug}`,
    locale,
    tags: [author.name, 'crypto journalist', 'crypto news', ...author.sources],
  });
}

/* ------------------------------------------------------------------ */
/*  Structured Data                                                   */
/* ------------------------------------------------------------------ */

function AuthorStructuredData({ name, slug }: { name: string; slug: string }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `https://cryptocurrency.cv/author/${slug}`,
    jobTitle: 'Crypto Journalist',
    worksFor: {
      '@type': 'Organization',
      name: 'Free Crypto News',
      url: 'https://cryptocurrency.cv',
    },
  };

  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function AuthorPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let data: Awaited<ReturnType<typeof getAuthorBySlug>> = null;
  try {
    data = await getAuthorBySlug(slug);
  } catch {
    // Fall through to notFound
  }
  if (!data) {
    notFound();
  }

  const { author, articles, total } = data;
  const initials = author.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <AuthorStructuredData name={author.name} slug={author.slug} />
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-text-tertiary mb-6 text-sm">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/authors" className="hover:text-accent transition-colors">
                Authors
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text-primary font-medium">{author.name}</li>
          </ol>
        </nav>

        {/* Author Header */}
        <div className="mb-10 flex items-start gap-5">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.name}
              className="h-16 w-16 rounded-full object-cover shadow-md"
            />
          ) : (
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ${getInitialColor(author.name)} text-xl font-bold text-white shadow-md`}
            >
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-text-primary font-serif text-2xl font-bold md:text-3xl">
              {author.name}
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              {author.articleCount} {author.articleCount === 1 ? 'article' : 'articles'}
              {' · Writes for '}
              {author.sources.join(', ')}
            </p>
            <p className="text-text-tertiary mt-1 text-xs">
              First article: {formatDate(author.firstSeen)}
              {' · Latest: '}
              {formatDate(author.lastSeen)}
            </p>
          </div>
        </div>

        {/* Source filter pills */}
        {author.sources.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Badge className="cursor-default">All Sources</Badge>
            {author.sources.map((src) => (
              <Badge key={src} variant="default" className="cursor-default">
                {src}
              </Badge>
            ))}
          </div>
        )}

        {/* Articles */}
        {articles.length === 0 ? (
          <p className="text-text-tertiary py-12 text-center">No articles found for this author.</p>
        ) : (
          <>
            <h2 className="text-text-primary mb-6 font-serif text-xl font-bold">
              Articles by {author.name}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCardDefault key={article.link} article={article} />
              ))}
            </div>
            {total > articles.length && (
              <p className="text-text-tertiary mt-8 text-center text-sm">
                Showing {articles.length} of {total} articles
              </p>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
