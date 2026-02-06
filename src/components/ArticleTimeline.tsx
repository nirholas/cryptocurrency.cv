'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OriginSource {
  name: string;
  type: 'official' | 'press-release' | 'social' | 'blog' | 'government';
  confidence: 'high' | 'medium' | 'low';
  matchedText?: string;
}

interface TimelineArticle {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  description?: string;
  timeAgo?: string;
}

interface OriginResult {
  found: boolean;
  sources: OriginSource[];
  article: TimelineArticle;
}

interface OriginsData {
  withOrigins: OriginResult[];
  withoutOrigins: OriginResult[];
  stats: Record<string, { count: number; type: string }>;
}

interface ArticleTimelineProps {
  tickers: string[];
}

const typeColors: Record<string, { dot: string; line: string; badge: string; label: string }> = {
  official: { dot: 'bg-blue-500', line: 'border-blue-300 dark:border-blue-700', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'Official' },
  'press-release': { dot: 'bg-purple-500', line: 'border-purple-300 dark:border-purple-700', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', label: 'Press Release' },
  social: { dot: 'bg-cyan-500', line: 'border-cyan-300 dark:border-cyan-700', badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400', label: 'Social' },
  blog: { dot: 'bg-gray-400', line: 'border-gray-300 dark:border-gray-600', badge: 'bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400', label: 'Blog' },
  government: { dot: 'bg-red-500', line: 'border-red-300 dark:border-red-700', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'Government' },
};

const confidenceMap: Record<string, { icon: string; label: string }> = {
  high: { icon: '🟢', label: 'High confidence' },
  medium: { icon: '🟡', label: 'Medium confidence' },
  low: { icon: '⚪', label: 'Low confidence' },
};

function getTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export function ArticleTimeline({ tickers }: ArticleTimelineProps) {
  const [data, setData] = useState<OriginsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrigins = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = tickers.join(' ');
      const params = new URLSearchParams({ q: query, limit: '10' });
      const response = await fetch(`/api/origins?${params}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story origins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tickers.length > 0) fetchOrigins();
  }, [tickers.join(',')]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-44 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded-full" />
                <div className="w-0.5 h-12 bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex-1 h-14 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🕵️</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Story Origins</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
          <span>⚠️</span>
          <div className="flex-1 text-sm">{error}</div>
          <button
            onClick={fetchOrigins}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allItems = data.withOrigins || [];
  if (allItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕵️</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Story Origins</h2>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          No traceable origins found for this story.
        </p>
      </div>
    );
  }

  // Build aggregated source stats
  const topSources = data.stats
    ? Object.entries(data.stats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
    : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕵️</span>
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Story Origins</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tracing where this story started
            </p>
          </div>
        </div>

        {/* Top originating sources */}
        {topSources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {topSources.map(([name, info]) => {
              const tc = typeColors[info.type] || typeColors.official;
              return (
                <span key={name} className={`text-xs px-2 py-1 rounded-lg ${tc.badge}`}>
                  {name} ({info.count})
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        <div className="relative">
          {allItems.map((item, index) => {
            const primarySource = item.sources[0];
            const tc = primarySource ? (typeColors[primarySource.type] || typeColors.official) : typeColors.official;
            const conf = primarySource ? (confidenceMap[primarySource.confidence] || confidenceMap.low) : confidenceMap.low;
            const isLast = index === allItems.length - 1;

            return (
              <div key={index} className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-4 ring-white dark:ring-slate-800 ${tc.dot}`} />
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-600 min-h-[2rem]" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {/* Source type badge */}
                    {primarySource && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tc.badge}`}>
                        {tc.label}
                      </span>
                    )}
                    {/* Confidence */}
                    <span className="text-xs text-gray-500 dark:text-slate-400" title={conf.label}>
                      {conf.icon}
                    </span>
                    {/* Time */}
                    {item.article.pubDate && (
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {getTimeAgo(item.article.pubDate)}
                      </span>
                    )}
                  </div>

                  <a
                    href={item.article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                  >
                    {item.article.title}
                  </a>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {item.article.source}
                    </span>
                    {item.sources.length > 1 && (
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        +{item.sources.length - 1} more source{item.sources.length > 2 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <Link
          href={`/origins`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all story origins →
        </Link>
      </div>
    </div>
  );
}
