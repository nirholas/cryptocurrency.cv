'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

interface SocialTrend {
  ticker: string;
  name: string;
  mentions: number;
  mentionChange24h: number;
  uniqueAuthors: number;
  sentiment: number;
  sentimentChange24h: number;
  topChannels: Array<{
    name: string;
    platform: string;
    mentions: number;
  }>;
  topInfluencers: Array<{
    name: string;
    platform: string;
    followers?: number;
    reliabilityScore?: number;
  }>;
  relatedTickers: string[];
}

interface LunarCrushMetrics {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  galaxyScore: number;
  altRank: number;
  socialVolume: number;
  socialVolumeChange24h: number;
  socialScore: number;
  socialContributors: number;
  socialDominance: number;
  sentiment: number;
  bullishPosts: number;
  bearishPosts: number;
}

interface SantimentMetrics {
  slug: string;
  ticker: string;
  socialVolume: number;
  weightedSentiment: number;
  devActivity: number;
  timestamp: string;
}

interface SocialMessage {
  id: string;
  platform: 'discord' | 'telegram' | 'twitter' | 'reddit';
  channelName: string;
  authorName: string;
  content: string;
  timestamp: string;
  tickers: string[];
  sentiment: {
    score: number;
    label: string;
  };
  engagement: {
    reactions: number;
    replies: number;
  };
}

interface SocialIntelligenceData {
  trends: SocialTrend[];
  lunarcrush: LunarCrushMetrics[];
  santiment: SantimentMetrics[];
  messages: SocialMessage[];
  lastUpdated: string;
  sources: {
    discord: { enabled: boolean; channels: number };
    telegram: { enabled: boolean; channels: number };
    lunarcrush: { enabled: boolean; hasApiKey?: boolean };
    santiment: { enabled: boolean };
  };
}

interface SocialIntelligenceDashboardProps {
  initialView?: 'trends' | 'metrics' | 'messages' | 'full';
  refreshInterval?: number;
  showHeader?: boolean;
  compact?: boolean;
  maxItems?: number;
  onTickerClick?: (ticker: string) => void;
}

// =============================================================================
// Helper Components
// =============================================================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function SentimentBadge({ score, label }: { score: number; label?: string }) {
  const getColor = () => {
    if (score > 0.3) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score < -0.3) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
  };

  const getLabel = () => {
    if (label) return label.replace('_', ' ');
    if (score > 0.5) return 'very bullish';
    if (score > 0.1) return 'bullish';
    if (score < -0.5) return 'very bearish';
    if (score < -0.1) return 'bearish';
    return 'neutral';
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getColor()}`}>
      {getLabel()}
    </span>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'discord':
      return <span className="text-indigo-500">💬</span>;
    case 'telegram':
      return <span className="text-blue-500">✈️</span>;
    case 'twitter':
      return <span className="text-sky-500">🐦</span>;
    case 'reddit':
      return <span className="text-orange-500">🔴</span>;
    default:
      return <span>📱</span>;
  }
}

function ChangeIndicator({ value, showPercent = true }: { value: number; showPercent?: boolean }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <span className={`flex items-center text-sm ${
      isNeutral ? 'text-neutral-500' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }`}>
      {isNeutral ? '–' : isPositive ? '↑' : '↓'}
      {Math.abs(value).toFixed(1)}{showPercent && '%'}
    </span>
  );
}

function GalaxyScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 w-8">
        {score}
      </span>
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

function TabButton({ active, onClick, children, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
          active ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// Main Views
// =============================================================================

function TrendsView({ 
  trends, 
  onTickerClick,
  compact 
}: { 
  trends: SocialTrend[]; 
  onTickerClick?: (ticker: string) => void;
  compact?: boolean;
}) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        No trending data available. Configure social integrations to see trends.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
            <th className="pb-3 font-medium">#</th>
            <th className="pb-3 font-medium">Asset</th>
            <th className="pb-3 font-medium text-right">Mentions</th>
            <th className="pb-3 font-medium text-right">24h Change</th>
            <th className="pb-3 font-medium text-center">Sentiment</th>
            {!compact && <th className="pb-3 font-medium text-right">Authors</th>}
            {!compact && <th className="pb-3 font-medium">Top Channels</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {trends.map((trend, index) => (
            <tr 
              key={trend.ticker}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              onClick={() => onTickerClick?.(trend.ticker)}
            >
              <td className="py-3 text-neutral-500 dark:text-neutral-400">{index + 1}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{trend.ticker}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{trend.name}</span>
                </div>
              </td>
              <td className="py-3 text-right font-medium text-neutral-900 dark:text-white">
                {trend.mentions.toLocaleString()}
              </td>
              <td className="py-3 text-right">
                <ChangeIndicator value={trend.mentionChange24h} />
              </td>
              <td className="py-3 text-center">
                <SentimentBadge score={trend.sentiment} />
              </td>
              {!compact && (
                <td className="py-3 text-right text-neutral-600 dark:text-neutral-400">
                  {trend.uniqueAuthors.toLocaleString()}
                </td>
              )}
              {!compact && (
                <td className="py-3">
                  <div className="flex gap-1 flex-wrap">
                    {trend.topChannels.slice(0, 3).map((channel, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs"
                      >
                        <PlatformIcon platform={channel.platform} />
                        {channel.name}
                      </span>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricsView({ 
  lunarcrush, 
  santiment,
  onTickerClick 
}: { 
  lunarcrush: LunarCrushMetrics[];
  santiment: SantimentMetrics[];
  onTickerClick?: (ticker: string) => void;
}) {
  const [sortBy, setSortBy] = useState<'galaxyScore' | 'socialVolume' | 'sentiment'>('galaxyScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedMetrics = useMemo(() => {
    return [...lunarcrush].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [lunarcrush, sortBy, sortDir]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  if (lunarcrush.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        No metrics data available. LunarCrush data requires API configuration.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LunarCrush Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          🌙 LunarCrush Social Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                <th className="pb-3 font-medium">Asset</th>
                <th className="pb-3 font-medium text-right">Price</th>
                <th 
                  className="pb-3 font-medium text-center cursor-pointer hover:text-purple-600"
                  onClick={() => handleSort('galaxyScore')}
                >
                  Galaxy Score {sortBy === 'galaxyScore' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="pb-3 font-medium text-right">Alt Rank</th>
                <th 
                  className="pb-3 font-medium text-right cursor-pointer hover:text-purple-600"
                  onClick={() => handleSort('socialVolume')}
                >
                  Social Vol {sortBy === 'socialVolume' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="pb-3 font-medium text-center cursor-pointer hover:text-purple-600"
                  onClick={() => handleSort('sentiment')}
                >
                  Sentiment {sortBy === 'sentiment' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="pb-3 font-medium text-right">Bulls/Bears</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sortedMetrics.map((metric) => (
                <tr 
                  key={metric.symbol}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  onClick={() => onTickerClick?.(metric.symbol)}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-white">{metric.symbol}</span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">{metric.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-neutral-900 dark:text-white">
                        ${metric.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      <ChangeIndicator value={metric.priceChange24h} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <GalaxyScoreBar score={metric.galaxyScore} />
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-sm font-medium">
                      #{metric.altRank}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {metric.socialVolume.toLocaleString()}
                      </span>
                      <ChangeIndicator value={metric.socialVolumeChange24h} />
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <SentimentBadge score={metric.sentiment / 100} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <span className="text-green-600 dark:text-green-400">{metric.bullishPosts}</span>
                      <span className="text-neutral-400">/</span>
                      <span className="text-red-600 dark:text-red-400">{metric.bearishPosts}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Santiment Metrics */}
      {santiment.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            📊 Santiment On-Chain Social
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {santiment.map((metric) => (
              <div 
                key={metric.slug}
                role="button"
                tabIndex={0}
                className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={() => onTickerClick?.(metric.ticker)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTickerClick?.(metric.ticker); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-neutral-900 dark:text-white">{metric.ticker}</span>
                  <SentimentBadge score={metric.weightedSentiment} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Social Volume</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{metric.socialVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Dev Activity</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{metric.devActivity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessagesView({ 
  messages,
  onTickerClick 
}: { 
  messages: SocialMessage[];
  onTickerClick?: (ticker: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        <p className="mb-2">No messages available.</p>
        <p className="text-sm">
          Configure Discord and Telegram integrations to see real-time social messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id}
          className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={message.platform} />
              <span className="font-medium text-neutral-900 dark:text-white">{message.authorName}</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">in {message.channelName}</span>
            </div>
            <div className="flex items-center gap-2">
              <SentimentBadge score={message.sentiment.score} label={message.sentiment.label} />
              <span className="text-xs text-neutral-400">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <p className="text-neutral-700 dark:text-neutral-300 mb-3">{message.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {message.tickers.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => onTickerClick?.(ticker)}
                  className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  ${ticker}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
              <span>❤️ {message.engagement.reactions}</span>
              <span>💬 {message.engagement.replies}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SocialIntelligenceDashboard({
  initialView = 'trends',
  refreshInterval = 60000,
  showHeader = true,
  compact = false,
  maxItems = 20,
  onTickerClick,
}: SocialIntelligenceDashboardProps) {
  const [data, setData] = useState<SocialIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'trends' | 'metrics' | 'messages'>(initialView === 'full' ? 'trends' : initialView);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`/api/social?view=full&limit=${maxItems}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch social data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      setData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('[SocialIntelligence] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load social data');
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, refreshInterval]);

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <ErrorDisplay message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🧠</div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Social Intelligence
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Real-time social sentiment & trends
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Source indicators */}
              <div className="hidden sm:flex items-center gap-2">
                {data?.sources.discord.enabled && (
                  <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                    Discord
                  </span>
                )}
                {data?.sources.telegram.enabled && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    Telegram
                  </span>
                )}
                {data?.sources.lunarcrush.enabled && (
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    LunarCrush
                  </span>
                )}
                {data?.sources.santiment.enabled && (
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    Santiment
                  </span>
                )}
              </div>
              {lastUpdated && (
                <span className="text-xs text-neutral-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
        <div className="flex gap-2">
          <TabButton
            active={activeView === 'trends'}
            onClick={() => setActiveView('trends')}
            count={data?.trends.length}
          >
            📈 Trends
          </TabButton>
          <TabButton
            active={activeView === 'metrics'}
            onClick={() => setActiveView('metrics')}
            count={data?.lunarcrush.length}
          >
            🌙 Metrics
          </TabButton>
          <TabButton
            active={activeView === 'messages'}
            onClick={() => setActiveView('messages')}
            count={data?.messages.length}
          >
            💬 Messages
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-neutral-900/50 flex items-center justify-center z-10">
            <LoadingSpinner />
          </div>
        )}
        
        {activeView === 'trends' && (
          <TrendsView 
            trends={data?.trends || []} 
            onTickerClick={onTickerClick}
            compact={compact}
          />
        )}
        
        {activeView === 'metrics' && (
          <MetricsView 
            lunarcrush={data?.lunarcrush || []}
            santiment={data?.santiment || []}
            onTickerClick={onTickerClick}
          />
        )}
        
        {activeView === 'messages' && (
          <MessagesView 
            messages={data?.messages || []}
            onTickerClick={onTickerClick}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center justify-between">
          <span>
            Data from {[
              data?.sources.lunarcrush.enabled && 'LunarCrush',
              data?.sources.santiment.enabled && 'Santiment',
              data?.sources.discord.enabled && 'Discord',
              data?.sources.telegram.enabled && 'Telegram',
            ].filter(Boolean).join(', ') || 'configured sources'}
          </span>
          <button 
            onClick={fetchData}
            className="hover:text-purple-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SocialIntelligenceDashboard;
