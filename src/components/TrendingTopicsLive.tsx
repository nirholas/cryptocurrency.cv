'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';

interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: string;
  change: number;
  relatedCoins: string[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function TrendingTopicsLive() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch('/api/trending?limit=10');
      if (!res.ok) return;
      const result = await res.json();
      const raw = result.topics || result.data?.topics || [];
      const parsed: TrendingTopic[] = raw.map((t: Record<string, unknown>) => ({
        topic: (t.topic as string) || (t.name as string) || '',
        count: Number(t.count || t.articleCount || 0),
        sentiment: (t.sentiment as string) || 'neutral',
        change: Number(t.change || t.changePercent || 0),
        relatedCoins: ((t.relatedCoins || t.coins || []) as string[]).slice(0, 3),
      })).filter((t: TrendingTopic) => t.topic);
      setTopics(parsed);
      setUpdatedAt(result.updatedAt || new Date().toISOString());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTopics();
    const interval = setInterval(fetchTopics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchTopics]);

  const timeSince = updatedAt ? (() => {
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  })() : '';

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800/50 -mx-4 px-4 py-4">
        <div className="animate-pulse flex gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-28 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) return null;

  const sentimentBorder: Record<string, string> = {
    positive: 'border-green-300 dark:border-green-600',
    bullish: 'border-green-300 dark:border-green-600',
    negative: 'border-red-300 dark:border-red-600',
    bearish: 'border-red-300 dark:border-red-600',
    neutral: 'border-gray-200 dark:border-slate-600',
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 -mx-4 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Trending Topics</h3>
        </div>
        {timeSince && (
          <span className="text-xs text-gray-500 dark:text-slate-400">Updated {timeSince}</span>
        )}
      </div>
      <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        <div className="flex gap-2 min-w-max pb-1">
          {topics.map((topic, i) => {
            const border = sentimentBorder[topic.sentiment] || sentimentBorder.neutral;
            return (
              <Link
                key={i}
                href={`/topic/${slugify(topic.topic)}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 ${border} bg-white dark:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all text-sm snap-start`}
              >
                <span className="font-medium text-gray-900 dark:text-white">{topic.topic}</span>
                {topic.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                    {topic.count}
                  </span>
                )}
                {topic.change !== 0 && (
                  <span className={`text-xs font-semibold ${topic.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {topic.change > 0 ? '↑' : '↓'}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
