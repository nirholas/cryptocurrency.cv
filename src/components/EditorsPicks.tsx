/**
 * Trending Stories - Horizontal row of 3 medium article cards
 * Secondary featured section below the hero
 * Shows top trending articles based on source reputation and recency
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
}

interface EditorsPicksProps {
  articles: Article[];
}

const sourceColors: Record<string, { bg: string; light: string; text: string; darkLight: string; darkText: string }> = {
  'CoinDesk': { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', darkLight: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300' },
  'The Block': { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', darkLight: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'Decrypt': { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', darkLight: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
  'CoinTelegraph': { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', darkLight: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  'Bitcoin Magazine': { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', darkLight: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  'Blockworks': { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', darkLight: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-300' },
  'The Defiant': { bg: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-700', darkLight: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-300' },
};

const defaultStyle = { bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-700', darkLight: 'dark:bg-gray-800', darkText: 'dark:text-gray-300' };

export default function EditorsPicks({ articles }: EditorsPicksProps) {
  // Take only first 3 articles
  const picks = articles.slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            🔥 Trending Stories
          </h2>
        </div>
        <Link 
          href="/trending" 
          className="text-sm font-semibold text-brand-600 dark:text-amber-400 hover:text-brand-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          See all trending
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {picks.map((article, index) => {
          const articleSlug = generateArticleSlug(article.title, article.pubDate);
          const style = sourceColors[article.source] || defaultStyle;

          return (
            <article key={article.link} className="group">
              <Link 
                href={`/article/${articleSlug}`}
                className="block h-full"
              >
                <div className="relative h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-2xl hover:border-brand-200 dark:hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300">
                  {/* Top accent bar */}
                  <div className={`h-1 ${style.bg}`} />
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Number badge */}
                    <div className="flex items-start justify-between mb-4">
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${style.light} ${style.darkLight} ${style.text} ${style.darkText}`}>
                        {article.source}
                      </span>
                      <span className="text-4xl font-bold text-gray-100 dark:text-slate-700 group-hover:text-brand-100 dark:group-hover:text-amber-900/50 transition-colors">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors line-clamp-3 mb-3 leading-snug">
                      {article.title}
                    </h3>

                    {article.description && (
                      <p className="text-gray-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                        {article.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                      <time className="text-xs text-gray-400 dark:text-slate-500" dateTime={article.pubDate}>
                        {article.timeAgo}
                      </time>
                      <span className="text-brand-600 dark:text-amber-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Read
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
