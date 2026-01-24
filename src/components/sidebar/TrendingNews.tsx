/**
 * Trending News Sidebar Widget
 * Displays numbered list of trending/hot stories
 */

import Link from 'next/link';
import { generateArticleId, generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  id?: string;
}

interface TrendingNewsProps {
  articles: Article[];
  title?: string;
  showRefreshIndicator?: boolean;
}

const sourceColors: Record<string, string> = {
  'CoinDesk': 'bg-blue-500',
  'The Block': 'bg-purple-500',
  'Decrypt': 'bg-emerald-500',
  'CoinTelegraph': 'bg-orange-500',
  'Bitcoin Magazine': 'bg-amber-500',
  'Blockworks': 'bg-indigo-500',
  'The Defiant': 'bg-pink-500',
};

export default function TrendingNews({ 
  articles, 
  title = 'Trending Now',
  showRefreshIndicator = true 
}: TrendingNewsProps) {
  const trendingArticles = articles.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-none dark:border dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🔥</span>
          {title}
        </h3>
        {showRefreshIndicator && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </div>
        )}
      </div>

      {/* Trending List */}
      <div className="space-y-1" role="list" aria-label="Trending news articles">
        {trendingArticles.map((article, index) => {
          const articleId = article.id || generateArticleId(article.link);
          const articleSlug = generateArticleSlug(article.title, article.pubDate);
          const sourceColor = sourceColors[article.source] || 'bg-gray-500';
          
          return (
            <Link
              key={articleId}
              href={`/article/${articleSlug}`}
              className="group flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus-ring"
              role="listitem"
            >
              {/* Rank Number */}
              <span 
                className={`
                  flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
                  ${index < 3 
                    ? 'bg-brand-500 text-black' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {index + 1}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${sourceColor}`} aria-hidden="true" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {article.source}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
                  <time 
                    className="text-xs text-gray-500 dark:text-gray-400"
                    dateTime={article.pubDate}
                  >
                    {article.timeAgo}
                  </time>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* See All Link */}
      <Link
        href="/trending"
        className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors focus-ring rounded-lg py-2 -mx-2"
      >
        See all trending
        <svg 
          className="w-4 h-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
