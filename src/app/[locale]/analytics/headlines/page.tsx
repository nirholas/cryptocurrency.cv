'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeadlineChange {
  title: string;
  detectedAt: string;
  changeType: 'minor' | 'moderate' | 'major';
  sentiment_shift?: 'more_positive' | 'more_negative' | 'neutral';
}

interface HeadlineEvolution {
  articleId: string;
  originalTitle: string;
  currentTitle: string;
  changes: HeadlineChange[];
  totalChanges: number;
  firstSeen: string;
  lastChecked: string;
  url: string;
  source: string;
}

interface RecentChange {
  articleId: string;
  from: string;
  to: string;
  changedAt: string;
}

interface TrackingResult {
  tracked: HeadlineEvolution[];
  recentChanges: RecentChange[];
  stats: {
    totalTracked: number;
    withChanges: number;
    avgChangesPerArticle: number;
  };
  trackingStats?: {
    totalTracked: number;
    withChanges: number;
    totalChanges: number;
    avgChangesPerArticle: number;
    oldestTracked: string | null;
    newestTracked: string | null;
  };
  generatedAt: string;
}

const changeTypeColors = {
  minor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  major: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const sentimentColors = {
  more_positive: 'text-green-600 dark:text-green-400',
  more_negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400',
};

const sentimentIcons = {
  more_positive: '📈',
  more_negative: '📉',
  neutral: '➡️',
};

export default function HeadlinesPage() {
  const [data, setData] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(24);
  const [changesOnly, setChangesOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, [hours, changesOnly]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/analytics/headlines?hours=${hours}&changesOnly=${changesOnly}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">📝 Headline Tracker</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Track how article headlines change over time — detect spin, corrections, and clickbait adjustments
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-slate-400">Time range:</label>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value={6}>Last 6 hours</option>
                  <option value={12}>Last 12 hours</option>
                  <option value={24}>Last 24 hours</option>
                  <option value={48}>Last 48 hours</option>
                  <option value={72}>Last 3 days</option>
                  <option value={168}>Last week</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={changesOnly}
                  onChange={(e) => setChangesOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Show only changed headlines</span>
              </label>

              <button
                onClick={fetchData}
                disabled={loading}
                className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4 animate-pulse">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300">Tracking headlines...</h3>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.totalTracked}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Articles Tracked</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{data.stats.withChanges}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">With Changes</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.recentChanges.length}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Recent Mutations</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {data.stats.avgChangesPerArticle.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">Avg Changes/Article</div>
                </div>
              </div>

              {/* Recent Changes */}
              {data.recentChanges.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔄 Recent Headline Changes</h2>
                  <div className="space-y-4">
                    {data.recentChanges.slice(0, 10).map((change, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-red-500 font-mono text-sm">-</span>
                            <span className="text-gray-600 dark:text-slate-400 line-through">{change.from}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-500 font-mono text-sm">+</span>
                            <span className="text-gray-900 dark:text-white font-medium">{change.to}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            Changed {new Date(change.changedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles with Changes */}
              {data.tracked.filter(t => t.totalChanges > 0).length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Headline Evolution History</h2>
                  <div className="space-y-6">
                    {data.tracked
                      .filter(t => t.totalChanges > 0)
                      .slice(0, 10)
                      .map((article) => (
                        <div key={article.articleId} className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <Link
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {article.currentTitle}
                              </Link>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-slate-400">
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>{article.totalChanges} change{article.totalChanges > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>

                          {/* Change History */}
                          <div className="mt-3 space-y-2">
                            <div className="text-sm text-gray-500 dark:text-slate-500">
                              <span className="font-medium">Original:</span> {article.originalTitle}
                            </div>
                            {article.changes.map((change, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${changeTypeColors[change.changeType]}`}>
                                  {change.changeType}
                                </span>
                                {change.sentiment_shift && (
                                  <span className={sentimentColors[change.sentiment_shift]}>
                                    {sentimentIcons[change.sentiment_shift]}
                                  </span>
                                )}
                                <span className="text-gray-700 dark:text-slate-300">{change.title}</span>
                                <span className="text-gray-400 dark:text-slate-500 text-xs ml-auto">
                                  {new Date(change.detectedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* No Changes */}
              {data.stats.withChanges === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">No Headline Changes Detected</h3>
                  <p className="text-gray-500 dark:text-slate-400">
                    All tracked headlines have remained stable in the selected time period.
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                Last updated: {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!data && !loading && !error && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Headline Tracker</h3>
              <p className="text-gray-500 dark:text-slate-400">
                Monitor how news headlines evolve over time
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
