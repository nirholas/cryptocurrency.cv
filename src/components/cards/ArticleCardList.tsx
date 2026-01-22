/**
 * @module ArticleCardList
 * @description Full-width horizontal article card for "More Stories" sections.
 * Features thumbnail, metadata, and optional reading progress indicator.
 *
 * @features
 * - Left-aligned thumbnail with lazy loading
 * - Source-specific accent colors
 * - Bookmark and share buttons
 * - Sentiment badges (bullish/bearish/neutral)
 * - Reading progress bar for returning users
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * <ArticleCardList
 *   article={{
 *     title: "DeFi Protocol Analysis",
 *     source: "Decrypt",
 *     url: "/article/789",
 *     timeAgo: "6 hours ago",
 *     readProgress: 65
 *   }}
 *   showBookmark
 *   showShare
 *   showProgress
 * />
 * ```
 *
 * @see {@link ArticleCardLarge} for featured content
 * @see {@link ArticleCardMedium} for grid layouts
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';
import { Article, getSourceColors } from './cardUtils';
import CardImage from './CardImage';
import CardBookmarkButton from './CardBookmarkButton';
import QuickShareButton from './QuickShareButton';
import SentimentBadge from './SentimentBadge';
import ReadingProgress from './ReadingProgress';

interface ArticleCardListProps {
  article: Article;
  externalLink?: boolean;
  /** Show bookmark button */
  showBookmark?: boolean;
  /** Show share button */
  showShare?: boolean;
  /** Animation delay for staggered entrance (in ms) */
  animationDelay?: number;
}

function ArticleCardList({ 
  article, 
  externalLink = false,
  showBookmark = true,
  showShare = true,
  animationDelay = 0
}: ArticleCardListProps) {
  const articleId = article.id || generateArticleId(article.link);
  const href = externalLink ? article.link : `/article/${articleId}`;
  const sourceStyle = getSourceColors(article.source);

  const CardWrapper = externalLink ? 'a' : Link;
  const linkProps = externalLink 
    ? { href, target: '_blank', rel: 'noopener noreferrer' } 
    : { href };

  return (
    <article 
      className="group animate-fadeIn"
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'backwards'
      }}
    >
      <CardWrapper
        {...linkProps}
        className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 motion-reduce:transition-none"
      >
        {/* Image Section */}
        <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden">
          <CardImage
            src={article.imageUrl}
            alt={article.title}
            source={article.source}
            size="sm"
            className="absolute inset-0 transition-transform duration-200 motion-safe:group-hover:scale-105"
          />
          
          {/* Reading progress overlay on image */}
          {article.readProgress !== undefined && article.readProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
              <div 
                className={`h-full ${article.readProgress >= 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, article.readProgress)}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title Row with Actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-200 line-clamp-2 leading-snug flex-1">
              {article.title}
            </h3>
            
            {/* Action Buttons (appear on hover) */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              {showShare && (
                <QuickShareButton
                  title={article.title}
                  url={externalLink ? article.link : `${typeof window !== 'undefined' ? window.location.origin : ''}/article/${articleId}`}
                  className="scale-90"
                />
              )}
              {showBookmark && (
                <CardBookmarkButton
                  article={article}
                  size="sm"
                  className="scale-90"
                />
              )}
            </div>
          </div>

          {/* Description (if available) */}
          {article.description && (
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-1 leading-relaxed hidden sm:block">
              {article.description}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Source Pill */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceStyle.bg} ${sourceStyle.text}`}>
              {article.source}
            </span>
            
            <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
            
            {/* Time */}
            <time 
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={article.pubDate}
            >
              {article.timeAgo}
            </time>

            {/* Read Time */}
            {article.readTime && (
              <>
                <span className="text-gray-300 dark:text-gray-600 hidden sm:inline" aria-hidden="true">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {article.readTime}
                </span>
              </>
            )}

            {/* Sentiment Badge */}
            {article.sentiment && (
              <SentimentBadge sentiment={article.sentiment} size="sm" />
            )}

            {/* External Link Indicator */}
            {externalLink && (
              <svg 
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0" 
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
    </article>
  );
}

/**
 * Memoized ArticleCardList component
 * Only re-renders when article data changes
 */
export default memo(ArticleCardList);
