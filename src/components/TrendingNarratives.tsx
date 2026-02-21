'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  relatedTickers: string[];
  emerging: boolean;
  articles: { title: string; link: string; source: string }[];
}

const sentimentColors: Record<string, { border: string; text: string; badge: string }> = {
  bullish: { border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  bearish: { border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  neutral: { border: 'border-gray-300 dark:border-slate-600', text: 'text-gray-600 dark:text-gray-400', badge: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400' },
};

function StrengthRing({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 14;
  const color = pct >= 70 ? 'stroke-green-500' : pct >= 40 ? 'stroke-yellow-500' : 'stroke-red-500';

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-gray-200 dark:stroke-slate-600" />
        <circle
          cx="18" cy="18" r="14" fill="none" strokeWidth="3"
          className={color}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-slate-300">
        {pct}
      </span>
    </div>
  );
}

export function TrendingNarratives() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const res = await fetch('/api/narratives?limit=8');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const result = await res.json();
        setNarratives(result.narratives || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="mb-10" aria-label="Trending Narratives">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">🔥 Trending Narratives</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[280px] bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-5 w-36 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-3 w-full bg-gray-100 dark:bg-slate-700/50 rounded mb-2" />
              <div className="h-3 w-2/3 bg-gray-100 dark:bg-slate-700/50 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || narratives.length === 0) return null;

  return (
    <section className="mb-10" aria-label="Trending Narratives">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">🔥 Trending Narratives</h2>
        </div>
        <Link
          href="/narratives"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
          {narratives.map((narrative) => {
            const colors = sentimentColors[narrative.sentiment] || sentimentColors.neutral;
            return (
              <Link
                key={narrative.id}
                href="/narratives"
                className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start bg-white dark:bg-slate-800 rounded-2xl border-2 ${colors.border} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{narrative.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                        {narrative.sentiment}
                      </span>
                      {narrative.emerging && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                          🆕 Emerging
                        </span>
                      )}
                    </div>
                  </div>
                  <StrengthRing value={narrative.strength} />
                </div>

                <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {narrative.description}
                </p>

                {narrative.relatedTickers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {narrative.relatedTickers.slice(0, 4).map(ticker => (
                      <span
                        key={ticker}
                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full font-medium"
                      >
                        ${ticker}
                      </span>
                    ))}
                    {narrative.relatedTickers.length > 4 && (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        +{narrative.relatedTickers.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {narrative.articles.length} article{narrative.articles.length !== 1 ? 's' : ''}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
