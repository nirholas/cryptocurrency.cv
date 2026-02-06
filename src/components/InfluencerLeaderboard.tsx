'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

interface InfluencerTopTicker {
  ticker: string;
  calls: number;
  accuracy: number;
  avgReturn: number;
}

interface Influencer {
  id: string;
  platform: 'twitter' | 'discord' | 'telegram' | 'youtube';
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  isVerified: boolean;
  trackedSince: string;
  lastActive: string;
  totalPosts: number;
  postsWithCalls: number;
  reliabilityScore: number;
  accuracyRate: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  sentimentBias: number;
  overallRank: number;
  topTickers: InfluencerTopTicker[];
}

interface TradingCall {
  id: string;
  influencerId: string;
  ticker: string;
  callType: 'long' | 'short' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  entryPrice: number;
  currentPrice: number;
  unrealizedReturn: number;
  status: 'open' | 'won' | 'lost' | 'expired';
  callTimestamp: string;
}

interface InfluencerStats {
  totalInfluencers: number;
  activeInfluencers: number;
  totalCalls: number;
  openCalls: number;
  avgAccuracy: number;
  avgReturn: number;
  topPerformers: Influencer[];
  worstPerformers: Influencer[];
  recentCalls: TradingCall[];
}

interface InfluencerLeaderboardProps {
  initialSort?: 'reliability' | 'accuracy' | 'returns' | 'sharpe';
  showStats?: boolean;
  showRecentCalls?: boolean;
  maxItems?: number;
  onInfluencerClick?: (influencer: Influencer) => void;
  onTickerClick?: (ticker: string) => void;
}

// =============================================================================
// Helper Components
// =============================================================================

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
          </div>
          <div className="w-20 h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-neutral-500 dark:text-neutral-400">{message}</p>
      <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
        Start tracking influencers to see reliability scores.
      </p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { icon: string; color: string; label: string }> = {
    twitter: { icon: '𝕏', color: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900', label: 'Twitter/X' },
    discord: { icon: '💬', color: 'bg-indigo-500 text-white', label: 'Discord' },
    telegram: { icon: '✈️', color: 'bg-blue-500 text-white', label: 'Telegram' },
    youtube: { icon: '▶️', color: 'bg-red-500 text-white', label: 'YouTube' },
  };

  const { icon, color, label } = config[platform] || { icon: '📱', color: 'bg-neutral-500', label: platform };

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}
      title={label}
    >
      {icon}
    </span>
  );
}

function ReliabilityScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 20) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg text-center ${getColor()}`}>
      <div className="text-lg font-bold">{score}</div>
      <div className="text-xs opacity-75">{getLabel()}</div>
    </div>
  );
}

function ScoreBar({ value, max = 100, color = 'purple' }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color] || colors.purple} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 w-12 text-right">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function ReturnBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
      isPositive 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    }`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function CallStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    open: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', label: 'Open' },
    won: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Won' },
    lost: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'Lost' },
    expired: { color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400', label: 'Expired' },
  };

  const { color, label } = config[status] || config.expired;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

// =============================================================================
// Stats Cards
// =============================================================================

function StatsCards({ stats }: { stats: InfluencerStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
          {stats.activeInfluencers}
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Active Influencers
        </div>
      </div>
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
          {stats.totalCalls.toLocaleString()}
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Total Calls Tracked
        </div>
      </div>
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div className={`text-2xl font-bold ${stats.avgAccuracy >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {stats.avgAccuracy.toFixed(1)}%
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Avg Accuracy
        </div>
      </div>
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
        <div className={`text-2xl font-bold ${stats.avgReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(2)}%
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Avg Return
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Recent Calls Section
// =============================================================================

function RecentCalls({ 
  calls, 
  influencers,
  onTickerClick 
}: { 
  calls: TradingCall[];
  influencers: Influencer[];
  onTickerClick?: (ticker: string) => void;
}) {
  const getInfluencer = (id: string) => influencers.find(i => i.id === id);

  if (calls.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        📢 Recent Calls
      </h3>
      <div className="space-y-3">
        {calls.slice(0, 10).map((call) => {
          const influencer = getInfluencer(call.influencerId);
          return (
            <div 
              key={call.id}
              className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {influencer && <PlatformBadge platform={influencer.platform} />}
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {influencer?.displayName || 'Unknown'}
                  </span>
                </div>
                <span className="text-neutral-400">→</span>
                <button
                  onClick={() => onTickerClick?.(call.ticker)}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  ${call.ticker}
                </button>
                <span className={`text-sm ${
                  call.callType === 'long' ? 'text-green-600' : call.callType === 'short' ? 'text-red-600' : 'text-neutral-500'
                }`}>
                  {call.callType.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ReturnBadge value={call.unrealizedReturn * 100} />
                <CallStatusBadge status={call.status} />
                <span className="text-xs text-neutral-400">
                  {new Date(call.callTimestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function InfluencerLeaderboard({
  initialSort = 'reliability',
  showStats = true,
  showRecentCalls = true,
  maxItems = 20,
  onInfluencerClick,
  onTickerClick,
}: InfluencerLeaderboardProps) {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reliability' | 'accuracy' | 'returns' | 'sharpe'>(initialSort);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [influencersRes, statsRes] = await Promise.all([
        fetch(`/api/influencers?sortBy=${sortBy}&limit=${maxItems}`),
        showStats ? fetch('/api/influencers?view=stats') : Promise.resolve(null),
      ]);

      if (influencersRes.ok) {
        const data = await influencersRes.json();
        if (data.success) {
          setInfluencers(data.data.influencers);
        }
      }

      if (statsRes?.ok) {
        const data = await statsRes.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('[InfluencerLeaderboard] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, maxItems, showStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedInfluencers = useMemo(() => {
    return [...influencers].sort((a, b) => {
      switch (sortBy) {
        case 'accuracy':
          return b.accuracyRate - a.accuracyRate;
        case 'returns':
          return b.avgReturn - a.avgReturn;
        case 'sharpe':
          return b.sharpeRatio - a.sharpeRatio;
        default:
          return b.reliabilityScore - a.reliabilityScore;
      }
    });
  }, [influencers, sortBy]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-gray-500/10 via-gray-400/10 to-gray-300/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Influencer Leaderboard
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Reliability scores based on historical accuracy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="reliability">Reliability Score</option>
              <option value="accuracy">Accuracy Rate</option>
              <option value="returns">Avg Return</option>
              <option value="sharpe">Sharpe Ratio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && stats && (
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <StatsCards stats={stats} />
        </div>
      )}

      {/* Leaderboard */}
      <div className="p-6">
        {sortedInfluencers.length === 0 ? (
          <EmptyState message="No influencers tracked yet." />
        ) : (
          <div className="space-y-4">
            {sortedInfluencers.map((influencer, index) => (
              <div
                key={influencer.id}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
              >
                {/* Main Row */}
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => {
                    setExpandedId(expandedId === influencer.id ? null : influencer.id);
                    onInfluencerClick?.(influencer);
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-600 dark:text-neutral-400">
                    {index + 1}
                  </div>

                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {influencer.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {influencer.displayName}
                        </span>
                        <PlatformBadge platform={influencer.platform} />
                        {influencer.isVerified && (
                          <span className="text-blue-500" title="Verified">✓</span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        @{influencer.username} · {influencer.postsWithCalls} calls tracked
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Accuracy</div>
                      <div className={`font-bold ${influencer.accuracyRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {influencer.accuracyRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Avg Return</div>
                      <ReturnBadge value={influencer.avgReturn} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Sharpe</div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {influencer.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Reliability Score */}
                  <ReliabilityScore score={influencer.reliabilityScore} />

                  {/* Expand Indicator */}
                  <div className={`transform transition-transform ${expandedId === influencer.id ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === influencer.id && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Performance Metrics */}
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white mb-3">
                          📈 Performance Metrics
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-500">Accuracy Rate</span>
                              <span className="font-medium">{influencer.accuracyRate}%</span>
                            </div>
                            <ScoreBar value={influencer.accuracyRate} color="green" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-500">Reliability Score</span>
                              <span className="font-medium">{influencer.reliabilityScore}</span>
                            </div>
                            <ScoreBar value={influencer.reliabilityScore} color="purple" />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Max Drawdown</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              -{influencer.maxDrawdown.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Tickers */}
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white mb-3">
                          🎯 Top Tickers
                        </h4>
                        {influencer.topTickers.length > 0 ? (
                          <div className="space-y-2">
                            {influencer.topTickers.slice(0, 5).map((ticker) => (
                              <div 
                                key={ticker.ticker}
                                className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTickerClick?.(ticker.ticker);
                                }}
                              >
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  ${ticker.ticker}
                                </span>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-neutral-500">{ticker.calls} calls</span>
                                  <span className={ticker.accuracy >= 50 ? 'text-green-600' : 'text-red-600'}>
                                    {ticker.accuracy.toFixed(0)}% acc
                                  </span>
                                  <ReturnBadge value={ticker.avgReturn} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">No ticker data yet</p>
                        )}
                      </div>

                      {/* Activity Info */}
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white mb-3">
                          📊 Activity
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Followers</span>
                            <span className="font-medium">{influencer.followers.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Total Posts</span>
                            <span className="font-medium">{influencer.totalPosts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Posts with Calls</span>
                            <span className="font-medium">{influencer.postsWithCalls}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Tracked Since</span>
                            <span className="font-medium">
                              {new Date(influencer.trackedSince).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Sentiment Bias</span>
                            <span className={`font-medium ${
                              influencer.sentimentBias > 0.2 ? 'text-green-600' : 
                              influencer.sentimentBias < -0.2 ? 'text-red-600' : 'text-neutral-600'
                            }`}>
                              {influencer.sentimentBias > 0.2 ? 'Bullish' : 
                               influencer.sentimentBias < -0.2 ? 'Bearish' : 'Neutral'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Calls */}
        {showRecentCalls && stats?.recentCalls && (
          <RecentCalls 
            calls={stats.recentCalls} 
            influencers={influencers}
            onTickerClick={onTickerClick}
          />
        )}
      </div>
    </div>
  );
}

export default InfluencerLeaderboard;
