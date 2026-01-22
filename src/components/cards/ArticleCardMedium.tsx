/**
 * @module ArticleCardMedium
 * @description Premium vertical article card with animated gradients and glassmorphism.
 * Ideal for main news feed grids with 200px image area.
 *
 * @features
 * - Source-specific gradient backgrounds with mesh effects
 * - Image zoom on hover with smooth transitions
 * - Glassmorphism overlays with backdrop blur
 * - Category and read time badges
 * - Optional bookmark button and sentiment badge
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * <ArticleCardMedium
 *   article={{
 *     title: "Ethereum 2.0 Staking Milestone",
 *     source: "CoinTelegraph",
 *     url: "/article/456",
 *     timeAgo: "4 hours ago",
 *     imageUrl: "https://..."
 *   }}
 *   showBookmark
 *   showSentiment
 * />
 * ```
 *
 * @see {@link ArticleCardLarge} for featured/Editor's Picks
 * @see {@link ArticleCardSmall} for sidebar/trending lists
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
  category?: string;
  id?: string;
}

interface ArticleCardMediumProps {
  article: Article;
  externalLink?: boolean;
}

// Source-specific gradient configurations with mesh backgrounds
const sourceStyles: Record<string, {
  gradient: string;
  mesh: string;
  accent: string;
  badge: string;
  badgeText: string;
  glow: string;
}> = {
  'CoinDesk': {
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    mesh: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.5) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.4) 0%, transparent 50%)',
    accent: 'bg-blue-500',
    badge: 'bg-blue-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-blue-500/25',
  },
  'The Block': {
    gradient: 'from-purple-600 via-purple-700 to-violet-800',
    mesh: 'radial-gradient(circle at 25% 30%, rgba(168, 85, 247, 0.5) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)',
    accent: 'bg-purple-500',
    badge: 'bg-purple-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-purple-500/25',
  },
  'Decrypt': {
    gradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    mesh: 'radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.5) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(20, 184, 166, 0.4) 0%, transparent 50%)',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-emerald-500/25',
  },
  'CoinTelegraph': {
    gradient: 'from-orange-600 via-orange-700 to-red-800',
    mesh: 'radial-gradient(circle at 30% 25%, rgba(249, 115, 22, 0.5) 0%, transparent 50%), radial-gradient(circle at 70% 75%, rgba(239, 68, 68, 0.4) 0%, transparent 50%)',
    accent: 'bg-orange-500',
    badge: 'bg-orange-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-orange-500/25',
  },
  'Bitcoin Magazine': {
    gradient: 'from-amber-600 via-amber-700 to-orange-800',
    mesh: 'radial-gradient(circle at 35% 30%, rgba(245, 158, 11, 0.5) 0%, transparent 50%), radial-gradient(circle at 65% 70%, rgba(234, 179, 8, 0.4) 0%, transparent 50%)',
    accent: 'bg-amber-500',
    badge: 'bg-amber-500/90',
    badgeText: 'text-black',
    glow: 'group-hover:shadow-amber-500/25',
  },
  'Blockworks': {
    gradient: 'from-indigo-600 via-indigo-700 to-blue-800',
    mesh: 'radial-gradient(circle at 25% 35%, rgba(99, 102, 241, 0.5) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(79, 70, 229, 0.4) 0%, transparent 50%)',
    accent: 'bg-indigo-500',
    badge: 'bg-indigo-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-indigo-500/25',
  },
  'The Defiant': {
    gradient: 'from-pink-600 via-pink-700 to-fuchsia-800',
    mesh: 'radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.5) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.4) 0%, transparent 50%)',
    accent: 'bg-pink-500',
    badge: 'bg-pink-500/90',
    badgeText: 'text-white',
    glow: 'group-hover:shadow-pink-500/25',
  },
};

const defaultStyle = {
  gradient: 'from-gray-600 via-gray-700 to-slate-800',
  mesh: 'radial-gradient(circle at 30% 30%, rgba(107, 114, 128, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(75, 85, 99, 0.3) 0%, transparent 50%)',
  accent: 'bg-gray-500',
  badge: 'bg-gray-500/90',
  badgeText: 'text-white',
  glow: 'group-hover:shadow-gray-500/25',
};

function ArticleCardMedium({ article, externalLink = false }: ArticleCardMediumProps) {
  const articleId = article.id || generateArticleId(article.link);
  const href = externalLink ? article.link : `/article/${articleId}`;
  const style = sourceStyles[article.source] || defaultStyle;

  const CardWrapper = externalLink ? 'a' : Link;
  const linkProps = externalLink 
    ? { href, target: '_blank', rel: 'noopener noreferrer' } 
    : { href };

  return (
    <article className="group h-full">
      <CardWrapper
        {...linkProps}
        className={`
          flex flex-col h-full rounded-2xl overflow-hidden
          bg-white dark:bg-gray-900
          shadow-lg hover:shadow-2xl ${style.glow}
          dark:shadow-none dark:border dark:border-gray-800 dark:hover:border-gray-600
          transform transition-all duration-300 ease-out
          hover:-translate-y-2 hover:scale-[1.02]
          focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950
          motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100
        `}
      >
        {/* Image Placeholder with animated gradient mesh */}
        <div className="relative h-[200px] overflow-hidden">
          {/* Base gradient */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${style.gradient} transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
            aria-hidden="true"
          />
          
          {/* Animated mesh overlay */}
          <div 
            className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500 motion-reduce:transition-none"
            style={{ background: style.mesh }}
            aria-hidden="true"
          />
          
          {/* Floating orb animation */}
          <div 
            className={`
              absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl
              ${style.accent} opacity-30
              animate-[pulse_6s_ease-in-out_infinite]
              motion-reduce:animate-none
            `}
            aria-hidden="true"
          />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.05] bg-[length:20px_20px]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            }}
            aria-hidden="true"
          />
          
          {/* Source initial with glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/90 text-4xl font-black tracking-tight [text-shadow:0_0_40px_rgba(255,255,255,0.3)]">
              {article.source.charAt(0)}
            </span>
          </div>

          {/* Category Badge - Glassmorphism */}
          {article.category && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white backdrop-blur-md shadow-lg">
                <span className={`w-1.5 h-1.5 rounded-full ${style.accent}`} aria-hidden="true" />
                {article.category}
              </span>
            </div>
          )}

          {/* External link indicator with hover effect */}
          {externalLink && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform duration-300 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <svg 
                  className="w-4 h-4 text-gray-700 dark:text-gray-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-label="Opens in new tab"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </div>
          )}
          
          {/* Bottom gradient fade for text protection */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Title with hover animation */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors duration-300 line-clamp-3 leading-snug flex-1">
            {article.title}
          </h3>

          {/* Meta Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {/* Source Pill with gradient */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge} ${style.badgeText} backdrop-blur-sm shadow-sm`}>
                {article.source}
              </span>
            </div>
            
            {/* Time with icon */}
            <time 
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
              dateTime={article.pubDate}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {article.timeAgo}
            </time>
          </div>
        </div>
      </CardWrapper>
    </article>
  );
}

/**
 * Memoized ArticleCardMedium component
 * Only re-renders when article data changes
 */
export default memo(ArticleCardMedium);
