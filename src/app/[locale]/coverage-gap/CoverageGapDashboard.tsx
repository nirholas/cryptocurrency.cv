'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// Types
interface CoverageGap {
  id: string;
  topic: string;
  type: 'asset' | 'category' | 'event' | 'narrative';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  marketImpact: number;
  suggestedAngle: string;
  relatedArticles: string[];
  detectedAt: string;
  lastChecked: string;
}

interface CoverageData {
  topic: string;
  articleCount: number;
  sources: string[];
  lastCovered: string | null;
  averageAge: number;
  marketRelevance: number;
  coverageScore: number;
}

interface TopicTrend {
  topic: string;
  trend: 'rising' | 'falling' | 'stable';
  currentMentions: number;
  previousMentions: number;
  changePercent: number;
  needsMoreCoverage: boolean;
}

interface SourceData {
  name: string;
  count: number;
  percentage: number;
}

interface CoverageReport {
  timestamp: string;
  period: '24h' | '7d' | '30d';
  totalArticles: number;
  totalTopics: number;
  gaps: CoverageGap[];
  underCovered: CoverageData[];
  overCovered: CoverageData[];
  sourceDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  recommendations: string[];
}

export default function CoverageGapDashboard() {
  const t = useTranslations();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'trends' | 'sources'>('overview');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [trends, setTrends] = useState<TopicTrend[]>([]);
  const [sources, setSources] = useState<{ sources: SourceData[]; diversity: number; recommendations: string[] } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [reportRes, trendsRes, sourcesRes] = await Promise.all([
        fetch(`/api/coverage-gap?action=report&period=${period}`),
        fetch('/api/coverage-gap?action=trends'),
        fetch('/api/coverage-gap?action=sources'),
      ]);

      if (reportRes.ok) {
        const data = await reportRes.json();
        setReport(data.data);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data || []);
      }

      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSources(data.data);
      }
    } catch (err) {
      setError('Failed to load coverage data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSeverityColor = (severity: CoverageGap['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getTrendIcon = (trend: TopicTrend['trend']) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'falling': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = (trend: TopicTrend['trend']) => {
    switch (trend) {
      case 'rising': return 'text-green-400';
      case 'falling': return 'text-red-400';
      case 'stable': return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white rounded-lg hover:bg-gray-100 text-black transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {(['overview', 'gaps', 'trends', 'sources'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                period === p
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Articles</p>
            <p className="text-2xl font-bold text-white">{report.totalArticles}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Topics Tracked</p>
            <p className="text-2xl font-bold text-white">{report.totalTopics}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Coverage Gaps</p>
            <p className="text-2xl font-bold text-white">{report.gaps.length}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Source Diversity</p>
            <p className="text-2xl font-bold text-green-400">{sources?.diversity || 0}%</p>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && report && (
        <div className="space-y-6">
          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-gray-800/20 border border-gray-600/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="text-gray-300">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Under-covered Topics */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Under-Covered Topics</h3>
            <div className="grid gap-3">
              {report.underCovered.slice(0, 5).map((topic) => (
                <div
                  key={topic.topic}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white capitalize">{topic.topic}</p>
                    <p className="text-sm text-gray-400">
                      {topic.articleCount} articles from {topic.sources.length} sources
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${topic.coverageScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{topic.coverageScore}% coverage</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(report.categoryDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="text-center p-3 bg-gray-900/50 rounded-lg"
                  >
                    <p className="text-xl font-bold text-gray-300">{count}</p>
                    <p className="text-sm text-gray-400 capitalize">{category}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Gaps Tab */}
      {activeTab === 'gaps' && report && (
        <div className="space-y-4">
          {report.gaps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-4">✅</p>
              <p>No significant coverage gaps detected</p>
            </div>
          ) : (
            report.gaps.map((gap) => (
              <div
                key={gap.id}
                className={`p-4 rounded-xl border ${getSeverityColor(gap.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {gap.severity}
                    </span>
                    <h4 className="text-lg font-semibold text-white capitalize mt-1">
                      {gap.topic}
                    </h4>
                  </div>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                    {gap.type}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-3">{gap.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span>Market Impact: {gap.marketImpact > 0 ? '+' : ''}{gap.marketImpact}%</span>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Suggested Angle</p>
                  <p className="text-gray-200">{gap.suggestedAngle}</p>
                </div>

                {gap.relatedArticles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">Related Coverage</p>
                    <ul className="text-sm text-gray-400">
                      {gap.relatedArticles.map((article, i) => (
                        <li key={i} className="truncate">• {article}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {trends.map((trend) => (
              <div
                key={trend.topic}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTrendIcon(trend.trend)}</span>
                  <div>
                    <p className="font-medium text-white capitalize">{trend.topic}</p>
                    <p className="text-sm text-gray-400">
                      {trend.currentMentions} mentions (was {trend.previousMentions})
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>
                    {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                  </p>
                  {trend.needsMoreCoverage && (
                    <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded">
                      Needs Coverage
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && sources && (
        <div className="space-y-6">
          {/* Diversity Score */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Source Diversity Score</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${sources.diversity * 3.52} 352`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{sources.diversity}%</span>
              </div>
            </div>
            {sources.diversity >= 70 ? (
              <p className="text-green-400">Excellent source diversity</p>
            ) : sources.diversity >= 50 ? (
              <p className="text-yellow-400">Moderate source diversity</p>
            ) : (
              <p className="text-red-400">Low source diversity - consider adding more sources</p>
            )}
          </div>

          {/* Source Breakdown */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Source Breakdown</h3>
            <div className="space-y-3">
              {sources.sources.map((source) => (
                <div key={source.name} className="flex items-center gap-3">
                  <div className="w-24 truncate text-sm text-gray-300">{source.name}</div>
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-gray-400">
                    {source.count} ({source.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {sources.recommendations.length > 0 && (
            <div className="bg-gray-800/20 border border-gray-600/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Source Recommendations</h3>
              <ul className="space-y-2">
                {sources.recommendations.map((rec, i) => (
                  <li key={i} className="text-gray-300">⚠️ {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {report && (
        <p className="text-center text-sm text-gray-500">
          Last updated: {new Date(report.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
