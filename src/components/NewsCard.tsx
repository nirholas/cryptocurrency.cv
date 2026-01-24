/**
 * @fileoverview News Card Component
 * 
 * A versatile article card component with multiple display variants.
 * Used throughout the application for displaying news articles in
 * various layouts and contexts.
 * 
 * @module components/NewsCard
 * @requires next/link
 * @requires @/lib/archive-v2
 * @requires @/lib/reading-time
 * 
 * @example
 * // Default card (for grids)
 * <NewsCard article={article} />
 * 
 * // Compact card (for sidebars)
 * <NewsCard article={article} variant="compact" priority={1} />
 * 
 * // Horizontal card (for lists)
 * <NewsCard article={article} variant="horizontal" showDescription={true} />
 * 
 * @variants
 * - `default` - Full card with border, shadow, and description
 * - `compact` - Minimal card with optional priority number
 * - `horizontal` - Wide card with left accent bar
 * 
 * @features
 * - Source-specific color coding
 * - Reading time estimates
 * - Keyboard navigation support via `data-article` attribute
 * - Dark mode compatible
 * - Accessible focus states
 * - Smooth hover animations
 * 
 * @see {@link ./cards/ArticleCardLarge} For premium featured cards
 */
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { generateArticleSlug } from '@/lib/archive-v2';
import { estimateReadingTime } from '@/lib/reading-time';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface NewsCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'horizontal';
  showDescription?: boolean;
  priority?: number;
}

const sourceColors: Record<string, { bg: string; light: string; text: string; border: string; darkLight: string; darkText: string }> = {
  'CoinDesk': { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', darkLight: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300' },
  'The Block': { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', darkLight: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'Decrypt': { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', darkLight: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
  'CoinTelegraph': { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', darkLight: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  'Bitcoin Magazine': { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', darkLight: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  'Blockworks': { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', darkLight: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-300' },
  'The Defiant': { bg: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', darkLight: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-300' },
};

const defaultStyle = { bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', darkLight: 'dark:bg-gray-800', darkText: 'dark:text-gray-300' };

export default function NewsCard({ article, variant = 'default', showDescription = true, priority }: NewsCardProps) {
  const t = useTranslations('news');
  const articleSlug = generateArticleSlug(article.title, article.pubDate);
  const style = sourceColors[article.source] || defaultStyle;

  const readingTime = estimateReadingTime(article.title, article.description);

  if (variant === 'compact') {
    return (
      <article className="group" data-article>
        <Link 
          href={`/article/${articleSlug}`}
          className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {priority && (
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 font-bold text-sm flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-amber-900/30 group-hover:text-brand-600 dark:group-hover:text-amber-400 transition-colors">
              {priority}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${style.light} ${style.darkLight} ${style.text} ${style.darkText} mb-2`}>
              {article.source}
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
              {article.title}
            </h3>
            <time className="text-xs text-gray-400 dark:text-slate-500 mt-1 block" dateTime={article.pubDate}>
              {article.timeAgo}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className="group" data-article>
        <Link 
          href={`/article/${articleSlug}`}
          className="flex gap-5 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-amber-500/50 hover:shadow-lg dark:hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {/* Left accent */}
          <div className={`w-1 self-stretch ${style.bg} rounded-full flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.light} ${style.darkLight} ${style.text} ${style.darkText}`}>
                {article.source}
              </span>
              <time className="text-xs text-gray-400 dark:text-slate-500" dateTime={article.pubDate}>
                {article.timeAgo}
              </time>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
              {article.title}
            </h3>
            {showDescription && article.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                {article.description}
              </p>
            )}
          </div>

          <svg 
            className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-brand-500 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 self-center"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </article>
    );
  }

  // Default card style
  return (
    <article className="group h-full" data-article>
      <Link 
        href={`/article/${articleSlug}`}
        className="block h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-2xl hover:border-brand-200 dark:hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        <div className="p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ring-1 ring-inset ${style.light} ${style.darkLight} ${style.text} ${style.darkText} ${style.border} dark:ring-0`}>
              {article.source}
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {readingTime.text}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors line-clamp-3 leading-snug mb-3 flex-grow">
            {article.title}
          </h3>

          {/* Description */}
          {showDescription && article.description && (
            <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">
              {article.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700 mt-auto">
            <time className="text-xs text-gray-400 dark:text-slate-500" dateTime={article.pubDate}>
              {article.timeAgo}
            </time>
            <span className="text-brand-600 dark:text-amber-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {t('readMore')}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
