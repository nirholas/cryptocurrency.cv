/**
 * @module ArticleCardSmall
 * @description Compact article card for sidebar trending lists and widgets.
 * Features optional rank badges for numbered lists.
 *
 * @features
 * - Source-specific accent colors
 * - Rank badges with gold/silver/bronze styling for top 3
 * - Bookmark button on hover
 * - Compact design for sidebar placement
 * - Glassmorphism effects
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // In a trending sidebar
 * {articles.map((article, idx) => (
 *   <ArticleCardSmall
 *     key={article.id}
 *     article={article}
 *     rank={idx + 1}
 *     showBookmark
 *   />
 * ))}
 * ```
 *
 * @see {@link ArticleCardLarge} for featured/Editor's Picks
 * @see {@link ArticleCardMedium} for main grid layouts
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';
import CardBookmarkButton from './CardBookmarkButton';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  id?: string;
}

interface ArticleCardSmallProps {
  article: Article;
  externalLink?: boolean;
  rank?: number;
  showRank?: boolean;
  showBookmark?: boolean;
}

// Source-specific accent colors
const sourceAccents: Record<string, {
  solid: string;
  gradient: string;
  text: string;
}> = {
  'CoinDesk': { solid: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-600 dark:text-blue-400' },
  'The Block': { solid: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500', text: 'text-purple-600 dark:text-purple-400' },
  'Decrypt': { solid: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400' },
  'CoinTelegraph': { solid: 'bg-orange-500', gradient: 'from-orange-500 to-red-500', text: 'text-orange-600 dark:text-orange-400' },
  'Bitcoin Magazine': { solid: 'bg-amber-500', gradient: 'from-amber-500 to-yellow-500', text: 'text-amber-600 dark:text-amber-400' },
  'Blockworks': { solid: 'bg-indigo-500', gradient: 'from-indigo-500 to-blue-500', text: 'text-indigo-600 dark:text-indigo-400' },
  'The Defiant': { solid: 'bg-pink-500', gradient: 'from-pink-500 to-rose-500', text: 'text-pink-600 dark:text-pink-400' },
};

const defaultAccent = { solid: 'bg-gray-500', gradient: 'from-gray-500 to-slate-500', text: 'text-gray-600 dark:text-gray-400' };

// Rank styling for top positions
function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30';
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg shadow-gray-400/30';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/30';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
}

function ArticleCardSmall({ 
  article, 
  externalLink = false,
  rank,
  showRank = false,
  showBookmark = false
}: ArticleCardSmallProps) {
  const articleId = article.id || generateArticleId(article.link);
  const href = externalLink ? article.link : `/article/${articleId}`;
  const accent = sourceAccents[article.source] || defaultAccent;

  const CardWrapper = externalLink ? 'a' : Link;
  const linkProps = externalLink 
    ? { href, target: '_blank', rel: 'noopener noreferrer' } 
    : { href };

  return (
    <article className="group relative">
      <div className="relative">
        <CardWrapper
          {...linkProps}
          className={`
            flex items-start gap-3 p-4 rounded-xl
            bg-white dark:bg-gray-900
            border border-transparent
            hover:bg-gradient-to-r hover:from-gray-50 hover:to-white
            dark:hover:from-gray-800/50 dark:hover:to-gray-900
            hover:border-gray-200 dark:hover:border-gray-700
            hover:shadow-lg
            transform transition-all duration-300 ease-out
            hover:-translate-x-1
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950
            motion-reduce:transition-none motion-reduce:hover:translate-x-0
          `}
        >
          {/* Rank Number with gradient medal styling */}
          {showRank && rank !== undefined && (
            <span 
              className={`
                flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center 
                text-sm font-black ${getRankStyle(rank)}
                transform transition-transform duration-300 group-hover:scale-110
                motion-reduce:transition-none motion-reduce:group-hover:scale-100
              `}
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </span>
          )}

          {/* Source Color Indicator (animated gradient bar) */}
          {!showRank && (
            <div className="flex-shrink-0 relative">
              <div 
                className={`w-1 h-14 rounded-full bg-gradient-to-b ${accent.gradient} transform transition-all duration-300 group-hover:h-16 group-hover:w-1.5 motion-reduce:transition-none motion-reduce:group-hover:h-14 motion-reduce:group-hover:w-1`}
                aria-hidden="true"
              />
              {/* Glow effect on hover */}
              <div 
                className={`absolute inset-0 w-1 h-14 rounded-full bg-gradient-to-b ${accent.gradient} blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300 motion-reduce:transition-none`}
                aria-hidden="true"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className={`
              text-sm font-semibold text-gray-900 dark:text-white 
              group-hover:${accent.text.split(' ')[0]} dark:group-hover:${accent.text.split(' ')[1]}
              transition-colors duration-300 line-clamp-2 leading-snug
            `}>
              {article.title}
            </h4>

            {/* Meta */}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {showRank && (
                <span className={`w-1.5 h-1.5 rounded-full ${accent.solid}`} aria-hidden="true" />
              )}
              <span className="font-medium truncate">{article.source}</span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
              <time dateTime={article.pubDate} className="flex items-center gap-1">
                <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {article.timeAgo}
              </time>
              
              {/* External Link Indicator */}
              {externalLink && (
                <svg 
                  className="w-3 h-3 text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0 transform transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-label="Opens in new tab"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          </div>
        </CardWrapper>

        {/* Bookmark Button (appears on hover) */}
        {showBookmark && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CardBookmarkButton
              article={article}
              size="sm"
            />
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Memoized ArticleCardSmall component
 * Only re-renders when article or rank changes
 */
export default memo(ArticleCardSmall);
