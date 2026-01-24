/**
 * Popular Stories Sidebar Widget
 * Shows most read articles with view count estimates and time filter
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface PopularStoriesProps {
  articles: Article[];
}

type TimeFilter = '24h' | '7d';

const sourceColors: Record<string, string> = {
  'CoinDesk': 'from-blue-500 to-blue-600',
  'The Block': 'from-purple-500 to-purple-600',
  'Decrypt': 'from-emerald-500 to-emerald-600',
  'CoinTelegraph': 'from-orange-500 to-orange-600',
  'Bitcoin Magazine': 'from-amber-500 to-amber-600',
  'Blockworks': 'from-indigo-500 to-indigo-600',
  'The Defiant': 'from-pink-500 to-pink-600',
};

interface ViewData {
  [articleId: string]: { views: number; views24h: number; views7d: number };
}

export default function PopularStories({ articles }: PopularStoriesProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [viewData, setViewData] = useState<ViewData>({});
  const popularArticles = articles.slice(0, 5);

  /**
   * Fetch view counts from the /api/views endpoint
   */
  const fetchViewCounts = useCallback(async () => {
    try {
      const articleIds = popularArticles.map(a => a.id || generateArticleId(a.link));
      const response = await fetch(`/api/views?ids=${articleIds.join(',')}`);
      
      if (response.ok) {
        const data = await response.json();
        const viewMap: ViewData = {};
        for (const item of (data.views || [])) {
          viewMap[item.id] = {
            views: item.views || 0,
            views24h: item.views24h || 0,
            views7d: item.views7d || 0,
          };
        }
        setViewData(viewMap);
      }
    } catch (error) {
      console.error('Failed to fetch view counts:', error);
    }
  }, [popularArticles]);

  useEffect(() => {
    if (popularArticles.length > 0) {
      fetchViewCounts();
    }
  }, [popularArticles.length]); // Only refetch when article count changes

  /**
   * Get formatted view count for display
   */
  function getViewCount(articleId: string): string {
    const data = viewData[articleId];
    if (!data) {
      // Return a placeholder based on position for initial render
      return '-';
    }
    
    const views = timeFilter === '24h' ? data.views24h : data.views7d;
    
    if (views >= 10000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toLocaleString();
  }

  /**
   * Track article view when clicked
   */
  async function trackView(articleId: string) {
    try {
      await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
    } catch (error) {
      // Silent fail - don't block navigation
      console.error('Failed to track view:', error);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-none dark:border dark:border-gray-800 p-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📈</span>
          Most Read
        </h3>
        
        {/* Time Filter Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setTimeFilter('24h')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              timeFilter === '24h'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={timeFilter === '24h'}
          >
            24h
          </button>
          <button
            onClick={() => setTimeFilter('7d')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              timeFilter === '7d'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={timeFilter === '7d'}
          >
            7d
          </button>
        </div>
      </div>

      {/* Popular Articles List */}
      <div className="space-y-3" role="list" aria-label="Most read articles">
        {popularArticles.map((article, index) => {
          const articleId = article.id || generateArticleId(article.link);
          const articleSlug = generateArticleSlug(article.title, article.pubDate);
          const gradient = sourceColors[article.source] || 'from-gray-500 to-gray-600';
          const views = getViewCount(articleId);
          
          return (
            <Link
              key={articleId}
              href={`/article/${articleSlug}`}
              className="group flex gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus-ring"
              role="listitem"
              onClick={() => trackView(articleId)}
            >
              {/* Gradient Thumbnail Placeholder */}
              <div 
                className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} relative overflow-hidden`}
                aria-hidden="true"
              >
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1 right-1 w-6 h-6 border border-white/30 rounded-full" />
                  <div className="absolute bottom-2 left-1 w-3 h-3 bg-white/20 rounded-full" />
                </div>
                {/* View count overlay */}
                <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span className="text-[10px] font-medium text-white flex items-center gap-0.5">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {views}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-0.5">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {article.source}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
