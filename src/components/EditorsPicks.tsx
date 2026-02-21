/**
 * Editor's Choice / Featured Stories
 * Inspired by CoinDesk's "Featured Stories" section with horizontal card layout
 * Shows trending picks in a visually prominent editorial grid
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
  category?: string;
}

interface EditorsPicksProps {
  articles: Article[];
}

const sourceColors: Record<string, { accent: string; badge: string; bg: string }> = {
  'CoinDesk': { accent: 'border-l-blue-500', badge: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'The Block': { accent: 'border-l-purple-500', badge: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  'Decrypt': { accent: 'border-l-emerald-500', badge: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'CoinTelegraph': { accent: 'border-l-amber-500', badge: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'Bitcoin Magazine': { accent: 'border-l-orange-500', badge: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  'Blockworks': { accent: 'border-l-indigo-500', badge: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  'The Defiant': { accent: 'border-l-pink-500', badge: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
};

const defaultStyle = { accent: 'border-l-gray-400', badge: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' };

export default function EditorsPicks({ articles }: EditorsPicksProps) {
  const picks = articles.slice(0, 5);

  if (picks.length === 0) return null;

  // First two articles are the featured picks (side by side), rest are smaller cards below
  const featured = picks.slice(0, 2);
  const rest = picks.slice(2);

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Featured Stories
        </h2>
        <Link 
          href="/trending" 
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          View all stories
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Featured row - CoinDesk style with large cards side by side */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {featured.map((article) => {
          const articleSlug = generateArticleSlug(article.title, article.pubDate);
          const style = sourceColors[article.source] || defaultStyle;

          return (
            <Link
              key={article.link}
              href={`/article/${articleSlug}`}
              className="group block"
            >
              <div className={`relative h-full bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 border-l-4 ${style.accent}`}>
                <div className="p-5 md:p-6">
                  {/* Category label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                      {article.category || 'Markets'}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug mb-3 line-clamp-3">
                    {article.title}
                  </h3>

                  {/* Description */}
                  {article.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {article.description}
                    </p>
                  )}

                  {/* Source and time */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-auto">
                    <span className={`font-semibold ${style.badge}`}>{article.source}</span>
                    <span>·</span>
                    <time dateTime={article.pubDate}>{article.timeAgo}</time>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary stories row - smaller horizontal cards like CoinDesk's bottom row */}
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {rest.map((article) => {
            const articleSlug = generateArticleSlug(article.title, article.pubDate);
            const style = sourceColors[article.source] || defaultStyle;

            return (
              <Link
                key={article.link}
                href={`/article/${articleSlug}`}
                className="group block"
              >
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 h-full">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${style.badge} mb-2 block`}>
                    {article.category || 'Markets'}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug text-[15px] mb-2">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <span className={`font-semibold ${style.badge}`}>{article.source}</span>
                    <span>·</span>
                    <time dateTime={article.pubDate}>{article.timeAgo}</time>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
