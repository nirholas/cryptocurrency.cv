/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { BookmarkButton } from '@/components/BookmarkButton';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/lib/crypto-news';
import { getArticlePath } from '@/lib/article-url';

const BOOKMARK_BTN =
  'absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity';

/* ------------------------------------------------
   FEATURED OPINION — large hero card
   ------------------------------------------------ */

export function FeaturedOpinionCard({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          {article.imageUrl && (
            <div className="bg-surface-tertiary relative aspect-16/10 w-full overflow-hidden rounded-xl shadow-lg">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={80}
                loading="lazy"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className={cn('flex flex-col gap-4', !article.imageUrl && 'md:col-span-2')}>
            <Badge variant="opinion" className="w-fit">
              Opinion
            </Badge>
            <h2 className="group-hover:text-accent font-serif text-2xl leading-[1.15] font-bold tracking-tight italic transition-colors duration-200 md:text-3xl lg:text-4xl">
              &ldquo;{article.title}&rdquo;
            </h2>
            {article.description && (
              <p className="text-text-secondary line-clamp-3 text-sm leading-relaxed md:text-base">
                {article.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm">
              {article.author && (
                <span className="text-text-primary font-semibold">By {article.author}</span>
              )}
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-text-tertiary">{article.source}</span>
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-text-tertiary">{article.timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

/* ------------------------------------------------
   DEFAULT OPINION — card with prominent author
   ------------------------------------------------ */

export function OpinionCard({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative" role="article" aria-label={article.title}>
      <BookmarkButton article={article} className={BOOKMARK_BTN} />
      <Link href={getArticlePath(article.title, article.pubDate)} className="block">
        <article className="flex flex-col gap-3">
          {article.imageUrl && (
            <div className="bg-surface-tertiary relative aspect-16/10 w-full overflow-hidden rounded-lg">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={80}
                loading="lazy"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Badge variant="opinion" className="w-fit">
              Opinion
            </Badge>
            <h3 className="group-hover:text-accent line-clamp-3 font-serif text-lg leading-snug font-bold tracking-tight italic transition-colors">
              &ldquo;{article.title}&rdquo;
            </h3>
            {article.description && (
              <p className="text-text-secondary line-clamp-2 text-sm">{article.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs">
              {article.author && (
                <span className="text-text-primary font-semibold">{article.author}</span>
              )}
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-text-tertiary">{article.source}</span>
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-text-tertiary">{article.timeAgo}</span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

export default OpinionCard;
