/**
 * @fileoverview Related Articles Component
 * 
 * Shows related articles based on shared topics/tickers.
 * 
 * @module components/RelatedArticlesSection
 */
'use client';

import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  source: string;
  timeAgo: string;
  description?: string;
}

interface RelatedArticlesSectionProps {
  articles: Article[];
  title?: string;
  className?: string;
}

const sourceColors: Record<string, string> = {
  'CoinDesk': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'The Block': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Decrypt': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'CoinTelegraph': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Bitcoin Magazine': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Blockworks': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'The Defiant': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function RelatedArticlesSection({ 
  articles, 
  title = 'Related Articles',
  className = '' 
}: RelatedArticlesSectionProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {title}
      </h2>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(0, 6).map((article) => {
          const articleId = generateArticleId(article.link);
          const sourceColor = sourceColors[article.source] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
          
          return (
            <Link
              key={article.link}
              href={`/article/${articleId}`}
              className="group block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-amber-500/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sourceColor}`}>
                  {article.source}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {article.timeAgo}
                </span>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
