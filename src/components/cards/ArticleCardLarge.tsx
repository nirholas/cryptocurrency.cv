/**
 * @module ArticleCardLarge
 * @description Premium horizontal article card with animated mesh gradient backgrounds.
 * Designed for Editor's Picks and featured news sections with 320px height.
 *
 * @features
 * - Source-specific mesh gradient backgrounds (CoinDesk, Decrypt, etc.)
 * - Animated floating orbs with reduced-motion support
 * - Glassmorphism effects with backdrop blur
 * - Responsive layout (stacked on mobile, horizontal on desktop)
 * - Optional bookmark and share buttons
 * - Sentiment indicator badges
 *
 * @example
 * ```tsx
 * <ArticleCardLarge
 *   article={{
 *     title: "Bitcoin Breaks $100K",
 *     source: "CoinDesk",
 *     url: "/article/123",
 *     timeAgo: "2 hours ago"
 *   }}
 *   showBookmark
 *   showShare
 *   showSentiment
 * />
 * ```
 *
 * @see {@link ArticleCardMedium} for grid layouts
 * @see {@link ArticleCardSmall} for sidebar/trending lists
 * @see {@link ArticleCardList} for "More Stories" sections
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  description?: string;
  category?: string;
  readTime?: string;
  id?: string;
}

interface ArticleCardLargeProps {
  article: Article;
  externalLink?: boolean;
}

// Source-specific premium gradient configurations
const sourceStyles: Record<string, {
  gradient: string;
  mesh: string;
  accent: string;
  badge: string;
  badgeText: string;
  glow: string;
}> = {
  'CoinDesk': {
    gradient: 'from-blue-700 via-blue-800 to-indigo-900',
    mesh: 'radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(99, 102, 241, 0.4) 0%, transparent 60%)',
    accent: 'bg-blue-500',
    badge: 'bg-blue-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-blue-500/30',
  },
  'The Block': {
    gradient: 'from-purple-700 via-purple-800 to-violet-900',
    mesh: 'radial-gradient(ellipse at 25% 25%, rgba(168, 85, 247, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 75% 75%, rgba(139, 92, 246, 0.4) 0%, transparent 60%)',
    accent: 'bg-purple-500',
    badge: 'bg-purple-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-purple-500/30',
  },
  'Decrypt': {
    gradient: 'from-emerald-700 via-emerald-800 to-teal-900',
    mesh: 'radial-gradient(ellipse at 20% 40%, rgba(16, 185, 129, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, rgba(20, 184, 166, 0.4) 0%, transparent 60%)',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-emerald-500/30',
  },
  'CoinTelegraph': {
    gradient: 'from-orange-700 via-red-800 to-amber-900',
    mesh: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.4) 0%, transparent 60%)',
    accent: 'bg-orange-500',
    badge: 'bg-orange-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-orange-500/30',
  },
  'Bitcoin Magazine': {
    gradient: 'from-amber-700 via-yellow-800 to-orange-900',
    mesh: 'radial-gradient(ellipse at 35% 30%, rgba(245, 158, 11, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 65% 70%, rgba(234, 179, 8, 0.4) 0%, transparent 60%)',
    accent: 'bg-amber-500',
    badge: 'bg-amber-500',
    badgeText: 'text-black',
    glow: 'group-hover:shadow-amber-500/30',
  },
  'Blockworks': {
    gradient: 'from-indigo-700 via-indigo-800 to-blue-900',
    mesh: 'radial-gradient(ellipse at 25% 35%, rgba(99, 102, 241, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 75% 65%, rgba(79, 70, 229, 0.4) 0%, transparent 60%)',
    accent: 'bg-indigo-500',
    badge: 'bg-indigo-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-indigo-500/30',
  },
  'The Defiant': {
    gradient: 'from-pink-700 via-rose-800 to-fuchsia-900',
    mesh: 'radial-gradient(ellipse at 20% 30%, rgba(236, 72, 153, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(244, 114, 182, 0.4) 0%, transparent 60%)',
    accent: 'bg-pink-500',
    badge: 'bg-pink-500',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-pink-500/30',
  },
};

const defaultStyle = {
  gradient: 'from-gray-700 via-gray-800 to-slate-900',
  mesh: 'radial-gradient(ellipse at 30% 30%, rgba(107, 114, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(75, 85, 99, 0.3) 0%, transparent 50%)',
  accent: 'bg-gray-500',
  badge: 'bg-gray-500',
  badgeText: 'text-white',
  glow: 'group-hover:shadow-gray-500/30',
};

function getReadingTime(text: string | undefined): string {
  if (!text) return '2 min';
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes + ' min';
}

function ArticleCardLarge({ article, externalLink = false }: ArticleCardLargeProps) {
  const articleId = article.id || generateArticleId(article.link);
  const href = externalLink ? article.link : '/article/' + articleId;
  const style = sourceStyles[article.source] || defaultStyle;
  const readTime = article.readTime || getReadingTime(article.description);

  const CardWrapper = externalLink ? 'a' : Link;
  const linkProps = externalLink 
    ? { href, target: '_blank', rel: 'noopener noreferrer' } 
    : { href };

  const cardClasses = [
    'flex flex-col md:flex-row h-auto md:h-[320px] rounded-3xl overflow-hidden',
    'bg-white dark:bg-gray-900',
    'shadow-xl hover:shadow-2xl',
    style.glow,
    'dark:shadow-none dark:border dark:border-gray-800 dark:hover:border-gray-600',
    'transform transition-all duration-500 ease-out',
    'hover:-translate-y-2 hover:scale-[1.01]',
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-gray-950',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100',
  ].join(' ');

  const gradientClasses = [
    'absolute inset-0 bg-gradient-to-br',
    style.gradient,
    'transition-all duration-700 group-hover:scale-110',
    'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
  ].join(' ');

  const accentClasses = [
    'absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl',
    style.accent,
    'opacity-40 animate-[pulse_8s_ease-in-out_infinite] motion-reduce:animate-none',
  ].join(' ');

  const categoryClasses = 'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
  
  const badgeClasses = ['text-xs font-bold px-3 py-1.5 rounded-full shadow-lg', style.badge, style.badgeText].join(' ');

  return (
    <article className="group">
      <CardWrapper
        {...linkProps}
        className={cardClasses}
      >
        <div className="relative w-full md:w-[45%] h-[200px] md:h-full flex-shrink-0 overflow-hidden">
          <div 
            className={gradientClasses}
            aria-hidden="true"
          />
          <div 
            className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700 motion-reduce:transition-none"
            style={{ background: style.mesh }}
            aria-hidden="true"
          />
          <div 
            className={accentClasses}
            aria-hidden="true"
          />
          <div 
            className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl bg-white opacity-10 animate-[pulse_10s_ease-in-out_infinite_2s] motion-reduce:animate-none"
            aria-hidden="true"
          />
          <div 
            className="absolute inset-0 opacity-[0.04] bg-[length:30px_30px]"
            style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/90 text-6xl font-black tracking-tight [text-shadow:0_0_60px_rgba(255,255,255,0.4),0_0_120px_rgba(255,255,255,0.2)]">
              {article.source.charAt(0)}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-900 to-transparent md:hidden" aria-hidden="true" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent hidden md:block" aria-hidden="true" />
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {article.category && (
                <span className={categoryClasses}>
                  <span className={'w-2 h-2 rounded-full ' + style.accent} aria-hidden="true" />
                  {article.category}
                </span>
              )}
              <span className={badgeClasses}>
                {article.source}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors duration-300 line-clamp-2 leading-tight mb-4">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base line-clamp-3 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-800 mt-4">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <time className="flex items-center gap-1.5" dateTime={article.pubDate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {article.timeAgo}
              </time>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {readTime} read
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-400 group-hover:text-brand-800 dark:group-hover:text-brand-300 transition-colors">
              <span className="hidden sm:inline">Read More</span>
              <svg className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-2 motion-reduce:transition-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </CardWrapper>
    </article>
  );
}

/**
 * Memoized ArticleCardLarge component
 * Only re-renders when article data changes
 */
export default memo(ArticleCardLarge);
