/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge, categoryToBadgeVariant } from '@/components/ui/Badge';
import { BookmarkButton } from '@/components/BookmarkButton';
import { TagChip } from '@/components/TagChip';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/lib/crypto-news';
import { extractTagsFromArticle } from '@/lib/tags';
import { getArticlePath } from '@/lib/article-url';
import { getUnsplashFallback } from '@/lib/unsplash-fallback';
import { classifyArticle } from '@/lib/article-classifier';
import { NEWS_VERTICALS } from '@/lib/verticals';

const BOOKMARK_BTN =
  'absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity';

/* ------------------------------------------------
   Opinion badge (shown on opinion/analysis articles)
   ------------------------------------------------ */

function ContentTypeBadge({ contentType }: { contentType?: NewsArticle['contentType'] }) {
  const t = useTranslations('newsCard');
  if (!contentType || contentType === 'news') return null;
  const labels: Record<string, string> = {
    opinion: t('opinion'),
    analysis: t('analysis'),
    'press-release': t('pressRelease'),
  };
  return (
    <Badge variant="opinion" className="w-fit">
      {labels[contentType] ?? contentType}
    </Badge>
  );
}

/* ------------------------------------------------
   Vertical badge helper
   ------------------------------------------------ */

function VerticalBadges({ article }: { article: NewsArticle }) {
  const verticals = classifyArticle({
    url: article.link,
    title: article.title,
    description: article.description ?? '',
  });
  const matched = verticals
    .map((slug) => NEWS_VERTICALS.find((v) => v.slug === slug))
    .filter(Boolean);
  if (matched.length === 0) return null;
  return (
    <>
      {matched.map((v) => (
        <span
          key={v!.slug}
          className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
          style={{ backgroundColor: v!.color }}
        >
          {v!.name}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------
   Shared helpers
   ------------------------------------------------ */

function ArticleImage({
  src,
  alt,
  className,
  source,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  source?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const fallback = getUnsplashFallback(alt || source || 'crypto');
  const [failed, setFailed] = useState(false);
  const imgSrc = !src || failed ? fallback : src;

  return (
    <div className={cn('bg-surface-tertiary relative overflow-hidden rounded-lg', className)}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes}
        quality={80}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onError={() => setFailed(true)}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}

function SourceMeta({
  source,
  sourceKey,
  timeAgo,
  author,
  authorSlug,
}: {
  source: string;
  sourceKey?: string;
  timeAgo: string;
  author?: string;
  authorSlug?: string;
}) {
  return (
    <span className="text-text-tertiary text-xs">
      {sourceKey ? (
        <Link
          href={`/source/${sourceKey}`}
          className="text-text-secondary hover:text-accent font-medium transition-colors"
        >
          {source}
        </Link>
      ) : (
        source
      )}
      {author && authorSlug && (
        <>
          {' '}
          &middot;{' '}
          <Link
            href={`/author/${authorSlug}`}
            className="text-text-secondary hover:text-accent font-medium transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {author}
          </Link>
        </>
      )}{' '}
      &middot; {timeAgo}
    </span>
  );
}

/* ------------------------------------------------
   FEATURED — large hero card (top of homepage)
   ------------------------------------------------ */

export function FeaturedCard({ article }: { article: NewsArticle }) {
  const tags = extractTagsFromArticle(article).slice(0, 3);
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <ArticleImage
            src={article.imageUrl}
            alt={article.title}
            source={article.source}
            className="aspect-16/10 w-full rounded-xl shadow-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={categoryToBadgeVariant(article.category)}>{article.category}</Badge>
              <ContentTypeBadge contentType={article.contentType} />
              <VerticalBadges article={article} />
            </div>
            <h2 className="group-hover:text-accent font-serif text-2xl leading-[1.15] font-bold tracking-tight transition-colors duration-200 md:text-3xl lg:text-4xl">
              {article.title}
            </h2>
            {article.description && (
              <p className="text-text-secondary line-clamp-3 text-sm leading-relaxed md:text-base">
                {article.description}
              </p>
            )}{' '}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagChip key={tag.slug} tag={tag} size="sm" />
                ))}
              </div>
            )}
            <SourceMeta
              source={article.source}
              sourceKey={article.sourceKey}
              timeAgo={article.timeAgo}
              author={article.author}
              authorSlug={article.authorSlug}
            />
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------
   DEFAULT — vertical card with image on top
   ------------------------------------------------ */

export function NewsCardDefault({ article }: { article: NewsArticle }) {
  const tags = extractTagsFromArticle(article).slice(0, 2);
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="flex flex-col gap-3">
          <ArticleImage
            src={article.imageUrl}
            alt={article.title}
            source={article.source}
            className="aspect-16/10 w-full"
          />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={categoryToBadgeVariant(article.category)}>{article.category}</Badge>
              <ContentTypeBadge contentType={article.contentType} />
              <VerticalBadges article={article} />
            </div>
            <h3 className="group-hover:text-accent line-clamp-3 font-serif text-lg leading-snug font-bold tracking-tight transition-colors">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-text-secondary line-clamp-2 text-sm">{article.description}</p>
            )}{' '}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <TagChip key={tag.slug} tag={tag} size="sm" />
                ))}
              </div>
            )}
            <SourceMeta
              source={article.source}
              sourceKey={article.sourceKey}
              timeAgo={article.timeAgo}
              author={article.author}
              authorSlug={article.authorSlug}
            />
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------
   COMPACT — horizontal card (sidebar / list)
   ------------------------------------------------ */

export function NewsCardCompact({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="flex items-start gap-4">
          <ArticleImage
            src={article.imageUrl}
            alt={article.title}
            source={article.source}
            className="aspect-square w-20 shrink-0"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant={categoryToBadgeVariant(article.category)} className="w-fit">
                {article.category}
              </Badge>
              <ContentTypeBadge contentType={article.contentType} />
            </div>
            <h3 className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold transition-colors">
              {article.title}
            </h3>
            <SourceMeta
              source={article.source}
              sourceKey={article.sourceKey}
              timeAgo={article.timeAgo}
              author={article.author}
              authorSlug={article.authorSlug}
            />
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------
   HEADLINE — text-only for dense lists
   ------------------------------------------------ */

export function NewsCardHeadline({ article, index }: { article: NewsArticle; index?: number }) {
  return (
    <Link href={getArticlePath(article.title, article.pubDate)} className="group block">
      <article className="flex items-baseline gap-3">
        {typeof index === 'number' && (
          <span className="text-accent/30 shrink-0 font-serif text-2xl leading-none font-bold tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h3 className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold transition-colors">
            {article.title}
          </h3>
          <SourceMeta
            source={article.source}
            sourceKey={article.sourceKey}
            timeAgo={article.timeAgo}
            author={article.author}
            authorSlug={article.authorSlug}
          />
        </div>
      </article>
    </Link>
  );
}

/* ------------------------------------------------
   DEFAULT EXPORT (backwards compat)
   ------------------------------------------------ */

export default function NewsCard({
  article,
  variant = 'default',
}: {
  article: NewsArticle;
  variant?: 'featured' | 'default' | 'compact' | 'headline';
}) {
  switch (variant) {
    case 'featured':
      return <FeaturedCard article={article} />;
    case 'compact':
      return <NewsCardCompact article={article} />;
    case 'headline':
      return <NewsCardHeadline article={article} />;
    default:
      return <NewsCardDefault article={article} />;
  }
}
