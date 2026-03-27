/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Editorial Section Components
 *
 * Newspaper-style section dividers, date headers, and editorial layout blocks
 * that give the homepage the feel of a professional news publication.
 */

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Badge, categoryToBadgeVariant } from '@/components/ui/Badge';
import { BookmarkButton } from '@/components/BookmarkButton';
import type { NewsArticle } from '@/lib/crypto-news';
import { getUnsplashFallback } from '@/lib/unsplash-fallback';
import { getArticlePath } from '@/lib/article-url';

/** Resolve an article's display image — real URL or deterministic fallback. */
function resolveImageUrl(article: NewsArticle): string {
  return article.imageUrl || getUnsplashFallback(article.title || article.source || 'crypto');
}

/* ------------------------------------------------------------------ */
/*  Section Header — editorial-style divider with title + "See all →" */
/* ------------------------------------------------------------------ */

export async function SectionHeader({
  title,
  href,
  icon,
  className = '',
}: {
  title: string;
  href?: string;
  icon?: string;
  className?: string;
}) {
  const t = await getTranslations('common');
  return (
    <div className={`mb-6 flex items-center justify-between ${className}`}>
      <h2 className="text-text-primary flex items-center gap-2 font-serif text-xl font-bold md:text-2xl">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-accent hover:text-accent-hover text-sm font-medium whitespace-nowrap transition-colors"
        >
          {t('seeAll')}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Date Header — "Sunday, March 1, 2026"                             */
/* ------------------------------------------------------------------ */

export async function DateHeader() {
  const t = await getTranslations('editorial');
  const { getLocale } = await import('next-intl/server');
  const locale = await getLocale();
  const today = new Date();
  const formatted = today.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="border-text-primary mb-1 border-b-2">
      <div className="container-main flex items-center justify-between py-2">
        <p className="text-text-secondary text-sm font-medium tracking-wide">{formatted}</p>
        <p className="text-text-tertiary hidden text-xs sm:block">{t('tagline')}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor's Picks — horizontal strip of curated stories              */
/* ------------------------------------------------------------------ */

export async function EditorsPicks({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  const t = await getTranslations('editorial');
  return (
    <section className="border-border bg-surface-secondary border-b">
      <div className="container-main py-6 lg:py-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="bg-accent flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wider text-white uppercase">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
            {t('editorsPicks')}
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <EditorsPickCard key={article.link} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorsPickCard({ article }: { article: NewsArticle }) {
  const imgSrc = resolveImageUrl(article);
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton
        article={article}
        className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="flex items-start gap-4">
          <div className="bg-surface-tertiary relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
            <Image
              src={imgSrc}
              alt={article.title}
              fill
              sizes="96px"
              quality={80}
              loading="lazy"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Badge variant={categoryToBadgeVariant(article.category)} className="w-fit text-[10px]">
              {article.category}
            </Badge>
            <h3 className="group-hover:text-accent line-clamp-3 font-serif text-base leading-snug font-bold tracking-tight transition-colors">
              {article.title}
            </h3>
            <span className="text-text-tertiary text-xs">
              <Link
                href={`/source/${article.sourceKey}`}
                className="text-text-secondary hover:text-accent font-medium transition-colors"
              >
                {article.source}
              </Link>{' '}
              · {article.timeAgo}
            </span>
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Section — 2-col editorial block for a news category      */
/* ------------------------------------------------------------------ */

export function CategorySection({
  title,
  href,
  icon,
  articles,
}: {
  title: string;
  href: string;
  icon: string;
  articles: NewsArticle[];
}) {
  if (articles.length === 0) return null;

  const lead = articles[0];
  const rest = articles.slice(1, 4);

  return (
    <section className="border-border border-b">
      <div className="container-main py-8 lg:py-10">
        <SectionHeader title={title} href={href} icon={icon} />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Lead story */}
          <div className="group relative" role="article" aria-label={lead.title}>
            <BookmarkButton
              article={lead}
              className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
            />
            <Link href={getArticlePath(lead.title, lead.pubDate)} className="block">
              <article>
                <div className="bg-surface-tertiary relative mb-4 overflow-hidden rounded-md">
                  <Image
                    src={resolveImageUrl(lead)}
                    alt={lead.title}
                    width={800}
                    height={450}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    quality={80}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <Badge variant={categoryToBadgeVariant(lead.category)} className="mb-2">
                  {lead.category}
                </Badge>
                <h3 className="group-hover:text-accent mb-2 font-serif text-xl leading-snug font-bold tracking-tight transition-colors md:text-2xl">
                  {lead.title}
                </h3>
                {lead.description && (
                  <p className="text-text-secondary mb-2 line-clamp-2 text-sm">
                    {lead.description}
                  </p>
                )}
                <span className="text-text-tertiary text-xs">
                  <Link
                    href={`/source/${lead.sourceKey}`}
                    className="text-text-secondary hover:text-accent font-medium transition-colors"
                  >
                    {lead.source}
                  </Link>{' '}
                  · {lead.timeAgo}
                </span>
              </article>
            </Link>
          </div>

          {/* Secondary stories */}
          <div className="divide-border flex flex-col divide-y">
            {rest.map((article) => (
              <div key={article.link} className="group relative py-4 first:pt-0 last:pb-0">
                <BookmarkButton
                  article={article}
                  className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                />
                <Link
                  href={getArticlePath(article.title, article.pubDate)}
                  className="block"
                >
                  <article className="flex items-start gap-4">
                    <div className="bg-surface-tertiary relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={resolveImageUrl(article)}
                        alt={article.title}
                        fill
                        sizes="80px"
                        quality={80}
                        loading="lazy"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <h4 className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                        {article.title}
                      </h4>
                      <span className="text-text-tertiary text-xs">
                        <Link
                          href={`/source/${article.sourceKey}`}
                          className="text-text-secondary hover:text-accent font-medium transition-colors"
                        >
                          {article.source}
                        </Link>{' '}
                        · {article.timeAgo}
                      </span>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Most Read — numbered list widget for sidebar                      */
/* ------------------------------------------------------------------ */

export async function MostRead({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  const t = await getTranslations('editorial');
  return (
    <div>
      <h3 className="border-accent mb-4 border-b-2 pb-2 font-serif text-base font-bold">
        {t('mostRead')}
      </h3>
      <div className="space-y-0">
        {articles.slice(0, 5).map((article, i) => (
          <Link
            key={article.link}
            href={getArticlePath(article.title, article.pubDate)}
            className="group block"
          >
            <article className="border-border flex items-start gap-3 border-b py-3 last:border-b-0">
              <span className="text-accent mt-0.5 shrink-0 text-3xl leading-none font-bold tabular-nums opacity-60">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h4 className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                  {article.title}
                </h4>
                <span className="text-text-tertiary text-xs">
                  {article.source} · {article.timeAgo}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Opinion Banner — visual distinction for analysis/opinion content  */
/* ------------------------------------------------------------------ */

export async function OpinionSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null;

  const t = await getTranslations('editorial');
  return (
    <section className="border-border border-b bg-linear-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="container-main py-8 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-amber-500" />
          <h2 className="text-text-primary font-serif text-xl font-bold md:text-2xl">
            {t('analysisOpinion')}
          </h2>
          <Link
            href="/category/trading"
            className="text-accent hover:text-accent-hover ml-auto text-sm font-medium transition-colors"
          >
            {t('moreAnalysis')}
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.link}
              className="group relative"
              role="article"
              aria-label={article.title}
            >
              <Link href={getArticlePath(article.title, article.pubDate)} className="block">
                <article className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                      {t('opinion')}
                    </span>
                  </div>
                  <h3 className="group-hover:text-accent line-clamp-3 font-serif text-lg leading-snug font-bold tracking-tight transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-text-secondary line-clamp-2 text-sm">
                      {article.description}
                    </p>
                  )}
                  <span className="text-text-tertiary text-xs">
                    <Link
                      href={`/source/${article.sourceKey}`}
                      className="text-text-secondary hover:text-accent font-medium transition-colors"
                    >
                      {article.source}
                    </Link>{' '}
                    · {article.timeAgo}
                  </span>
                </article>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
