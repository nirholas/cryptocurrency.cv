/**
 * Hero Article - CoinDesk-style "Latest Crypto News" sidebar + Featured Story
 * Left: timestamped headline list with sentiment dots
 * Right: Large featured story card
 * Inspired by CoinDesk homepage hero layout
 */
'use client';

import Link from 'next/link';
import { generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
  sentiment?: string;
}

interface HeroArticleProps {
  article: Article;
  sidebarArticles?: Article[];
}

const sentimentDot: Record<string, { color: string; label: string }> = {
  positive: { color: 'bg-emerald-500', label: 'Positive' },
  negative: { color: 'bg-red-500', label: 'Negative' },
  neutral: { color: 'bg-gray-400', label: 'Neutral' },
};

const sourceColors: Record<string, string> = {
  'CoinDesk': 'text-blue-600 dark:text-blue-400',
  'The Block': 'text-purple-600 dark:text-purple-400',
  'Decrypt': 'text-emerald-600 dark:text-emerald-400',
  'CoinTelegraph': 'text-amber-600 dark:text-amber-400',
  'Bitcoin Magazine': 'text-orange-600 dark:text-orange-400',
  'Blockworks': 'text-indigo-600 dark:text-indigo-400',
  'The Defiant': 'text-pink-600 dark:text-pink-400',
  'Bloomberg Crypto': 'text-blue-500 dark:text-blue-300',
  'Reuters Crypto': 'text-orange-600 dark:text-orange-400',
};

export default function HeroArticle({ article, sidebarArticles = [] }: HeroArticleProps) {
  const articleSlug = generateArticleSlug(article.title, article.pubDate);
  const sourceColor = sourceColors[article.source] || 'text-gray-600 dark:text-gray-400';

  // Format time to show just the hour
  const formatTime = (timeAgo: string) => {
    // Extract time from pubDate or use timeAgo
    try {
      const d = new Date(article.pubDate);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeAgo;
    }
  };

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      {/* Left: Latest Crypto News sidebar list - CoinDesk style */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Latest Crypto News
          </h2>
          <Link href="/read" className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {/* Today label */}
          <div className="px-5 py-2 bg-gray-50/50 dark:bg-slate-800/80">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Today</span>
          </div>

          {/* Main hero article in the sidebar */}
          <Link
            href={`/article/${articleSlug}`}
            className="group block px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
          >
            <div className="text-[11px] text-gray-400 dark:text-slate-500 mb-1.5 tabular-nums">
              {formatTime(article.timeAgo)}
            </div>
            <div className="flex items-start gap-2 mb-1">
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sentimentDot[article.sentiment || 'neutral']?.color || 'bg-gray-400'}`} />
              <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">{sentimentDot[article.sentiment || 'neutral']?.label || 'Neutral'}</span>
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
          </Link>

          {/* Additional sidebar articles */}
          {sidebarArticles.slice(0, 5).map((sideArticle) => {
            const slug = generateArticleSlug(sideArticle.title, sideArticle.pubDate);
            const sentiment = sentimentDot[sideArticle.sentiment || 'neutral'] || sentimentDot.neutral;

            return (
              <Link
                key={sideArticle.link}
                href={`/article/${slug}`}
                className="group block px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="text-[11px] text-gray-400 dark:text-slate-500 mb-1 tabular-nums">
                  {(() => {
                    try {
                      return new Date(sideArticle.pubDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    } catch { return sideArticle.timeAgo; }
                  })()}
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sentiment.color}`} />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">{sentiment.label}</span>
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
                  {sideArticle.title}
                </h3>
              </Link>
            );
          })}

          {/* View all link */}
          <div className="px-5 py-3 bg-gray-50/30 dark:bg-slate-800/50">
            <Link
              href="/read"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              View all stories
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Featured story card - large prominent display */}
      <Link 
        href={`/article/${articleSlug}`}
        className="group block"
      >
        <div className="relative h-full bg-gray-950 rounded-xl overflow-hidden flex flex-col justify-end min-h-[320px] lg:min-h-[420px]">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/20" />

          {/* Content */}
          <div className="relative p-6 md:p-8 lg:p-10">
            {/* Category label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Top Story
              </span>
              <span className="text-gray-600 dark:text-slate-600">·</span>
              <span className={`text-xs font-semibold ${sourceColor}`}>
                {article.source}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-[1.15] group-hover:text-brand-400 transition-colors duration-200 mb-4 tracking-tight">
              {article.title}
            </h1>
            
            {article.description && (
              <p className="text-gray-400 text-base line-clamp-2 mb-5 leading-relaxed max-w-2xl">
                {article.description}
              </p>
            )}

            {/* Read more + time */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center text-brand-400 font-bold text-sm group-hover:text-brand-300 transition-colors">
                Read Full Story
                <svg 
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <time className="text-xs text-gray-500 ml-auto" dateTime={article.pubDate}>
                {article.timeAgo}
              </time>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
