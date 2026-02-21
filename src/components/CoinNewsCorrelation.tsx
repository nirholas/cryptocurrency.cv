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

// ---------------------------------------------------------------------------
// Onchain correlation types (from /api/onchain/correlate)
// ---------------------------------------------------------------------------

interface OnchainCorrelationEvent {
  type: string;
  coin: string;
  value: number;
  timestamp: string;
  significance: 'low' | 'medium' | 'high';
}

interface OnchainCorrelationEntry {
  event: OnchainCorrelationEvent;
  correlation: string;
  confidence: number;
  related_headlines: string[];
}

interface OnchainCorrelationData {
  correlations: OnchainCorrelationEntry[];
  computed_at: string;
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

  // Onchain correlation state — fetched independently; degraded gracefully
  const [onchainData, setOnchainData] = useState<OnchainCorrelationData | null>(null);

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

  // Onchain correlations — global (not coin-specific), best-effort
  useEffect(() => {
    let cancelled = false;
    fetch('/api/onchain/correlate')
      .then(r => r.ok ? r.json() : null)
      .then((json: OnchainCorrelationData | null) => {
        if (!cancelled && json && Array.isArray(json.correlations) && json.correlations.length > 0) {
          setOnchainData(json);
        }
      })
      .catch(() => { /* silently ignore */ });
    return () => { cancelled = true; };
  }, []);

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

      {/* Onchain ↔ News Correlation section — shown only when data is available */}
      {onchainData && onchainData.correlations.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
            <span>⛓️</span> On-Chain Anomalies
          </h4>
          <div className="space-y-3">
            {onchainData.correlations.map((entry, i) => {
              const conf = entry.confidence;
              const confColor =
                conf >= 0.7
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                  : conf >= 0.4
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600';
              const confBadge =
                conf >= 0.7
                  ? 'text-green-700 dark:text-green-400'
                  : conf >= 0.4
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : 'text-gray-500 dark:text-slate-400';
              const confLabel =
                conf >= 0.7 ? 'High' : conf >= 0.4 ? 'Med' : 'Low';

              return (
                <div key={i} className={`rounded-xl border p-3 ${confColor}`}>
                  {/* Event row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        {entry.event.type.replace(/_/g, ' ')} · {entry.event.coin}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.event.value.toLocaleString()} &nbsp;
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">
                          {new Date(entry.event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${confBadge}`}>
                      {confLabel} {Math.round(conf * 100)}%
                    </span>
                  </div>

                  {/* Visual connector + narrative */}
                  {entry.correlation && (
                    <div className="mt-2 flex items-start gap-2">
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className="w-px h-3 border-l-2 border-dashed border-gray-300 dark:border-slate-500" />
                        <span className="text-gray-400 dark:text-slate-500 text-xs leading-none">↓</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                        {entry.correlation}
                      </p>
                    </div>
                  )}

                  {/* Related headlines */}
                  {entry.related_headlines.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-dashed border-gray-300 dark:border-slate-600 space-y-1">
                      {entry.related_headlines.slice(0, 3).map((headline, j) => (
                        <p key={j} className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                          · {headline}
                        </p>
                      ))}
                    </div>
                  )}
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
