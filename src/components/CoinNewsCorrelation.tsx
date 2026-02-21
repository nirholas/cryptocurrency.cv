'use client';

import { useState, useEffect, useCallback } from 'react';

interface CorrelationEntry {
  articleId?: string;
  title: string;
  publishedAt: string;
  priceAtPublish: number;
  priceAfter: number;
  impact: number;
  direction: 'up' | 'down' | 'neutral';
  source?: string;
}

interface CorrelationData {
  correlationScore: number;
  entries: CorrelationEntry[];
  articlesAnalyzed: number;
  summary: string;
}

interface CoinNewsCorrelationProps {
  coinId: string;
  coinSymbol: string;
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatPctChange(before: number, after: number): string {
  if (before === 0) return '0.00%';
  const pct = ((after - before) / before) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function CoinNewsCorrelation({ coinId, coinSymbol }: CoinNewsCorrelationProps) {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/ai/correlation?coin=${coinId}&limit=10`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      const correlations = result.correlations || [];
      const entries: CorrelationEntry[] = correlations.slice(0, 8).map((c: Record<string, unknown>) => {
        const priceAtPublish = Number(c.priceAtPublish || c.priceBefore || 0);
        const priceAfter = Number(c.priceAfter || c.priceAfterPublish || 0);
        const impact = Number(c.impact || c.priceImpact || 0);

        return {
          articleId: c.articleId as string | undefined,
          title: (c.title as string) || (c.headline as string) || 'Untitled',
          publishedAt: (c.publishedAt as string) || (c.date as string) || new Date().toISOString(),
          priceAtPublish,
          priceAfter,
          impact,
          direction: impact > 0.5 ? 'up' : impact < -0.5 ? 'down' : 'neutral',
          source: (c.source as string) || undefined,
        };
      });

      setData({
        correlationScore: Number(result.summary?.correlationStrength || result.correlationScore || 0),
        entries,
        articlesAnalyzed: Number(result.articlesAnalyzed || entries.length),
        summary: (result.summary?.description || result.summary?.text || result.summary || '') as string,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-44 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">📰</span>
          <h3 className="font-bold text-gray-900 dark:text-white">News × Price</h3>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Correlation score ring
  const scorePercent = Math.min(Math.abs(data.correlationScore) * 100, 100);
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - scorePercent / 100);

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📰</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">News × Price</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">{data.articlesAnalyzed} articles</span>
        </div>

        {/* Score + Summary */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-slate-700" />
              <circle
                cx="36" cy="36" r={ringRadius} fill="none"
                strokeWidth="4" strokeLinecap="round"
                stroke={scorePercent > 60 ? '#22c55e' : scorePercent > 30 ? '#eab308' : '#6b7280'}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
              {scorePercent.toFixed(0)}%
            </span>
          </div>
          {typeof data.summary === 'string' && data.summary.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">{data.summary}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {data.entries.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-3">Impact Timeline</h4>
          <div className="space-y-2">
            {data.entries.map((entry, i) => {
              const impactColor = entry.direction === 'up'
                ? 'border-l-green-500'
                : entry.direction === 'down'
                ? 'border-l-red-500'
                : 'border-l-gray-400';
              const pctChange = formatPctChange(entry.priceAtPublish, entry.priceAfter);

              return (
                <div key={i} className={`border-l-2 ${impactColor} pl-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-r-lg`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-1 flex-1">{entry.title}</p>
                    <span className={`text-xs font-mono font-bold flex-shrink-0 ${
                      entry.direction === 'up' ? 'text-green-600 dark:text-green-400'
                      : entry.direction === 'down' ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {pctChange}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    <span>{formatTimeSince(entry.publishedAt)}</span>
                    {entry.source && <span>· {entry.source}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          AI-powered analysis. Correlation ≠ causation. Not financial advice.
        </p>
      </div>
    </div>
  );
}
