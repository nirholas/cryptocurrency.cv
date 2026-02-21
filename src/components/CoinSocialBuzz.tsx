'use client';

import { useState, useEffect, useCallback } from 'react';

interface SocialMetrics {
  score: number;
  change24h: number;
  mentions: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
  topKeywords: string[];
}

interface Influencer {
  name: string;
  handle: string;
  platform: string;
  followers: number;
  recentMention?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface SocialData {
  metrics: SocialMetrics;
  influencers: Influencer[];
}

interface CoinSocialBuzzProps {
  coinId: string;
  coinSymbol: string;
}

function formatFollowers(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

export function CoinSocialBuzz({ coinId, coinSymbol }: CoinSocialBuzzProps) {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [socialRes, influencersRes] = await Promise.all([
        fetch(`/api/social?coin=${coinSymbol.toLowerCase()}&view=metrics`),
        fetch(`/api/influencers?coin=${coinSymbol.toLowerCase()}&limit=5`),
      ]);

      let metrics: SocialMetrics = {
        score: 0,
        change24h: 0,
        mentions: 0,
        positivePercent: 50,
        negativePercent: 20,
        neutralPercent: 30,
        topKeywords: [],
      };

      if (socialRes.ok) {
        const socialResult = await socialRes.json();
        const raw = socialResult.data || socialResult;
        metrics = {
          score: Number(raw.socialScore || raw.score || 0),
          change24h: Number(raw.change24h || raw.sentimentChange || 0),
          mentions: Number(raw.mentions || raw.totalMentions || 0),
          positivePercent: Number(raw.positivePercent || raw.positive || 50),
          negativePercent: Number(raw.negativePercent || raw.negative || 20),
          neutralPercent: Number(raw.neutralPercent || raw.neutral || 30),
          topKeywords: (raw.topKeywords || raw.keywords || []) as string[],
        };
      }

      let influencers: Influencer[] = [];
      if (influencersRes.ok) {
        const inflResult = await influencersRes.json();
        const rawInfluencers = inflResult.data?.influencers || inflResult.influencers || [];
        influencers = rawInfluencers.slice(0, 5).map((inf: Record<string, unknown>) => ({
          name: (inf.name as string) || (inf.displayName as string) || 'Unknown',
          handle: (inf.handle as string) || (inf.username as string) || '',
          platform: (inf.platform as string) || 'X',
          followers: Number(inf.followers || inf.followersCount || 0),
          recentMention: (inf.recentMention as string) || (inf.latestPost as string) || undefined,
          sentiment: (inf.sentiment as Influencer['sentiment']) || undefined,
        }));
      }

      setData({ metrics, influencers });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [coinSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-36 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-20 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">🔥</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Social Buzz</h3>
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

  const sentimentBarTotal = data.metrics.positivePercent + data.metrics.negativePercent + data.metrics.neutralPercent;
  const pPos = sentimentBarTotal > 0 ? (data.metrics.positivePercent / sentimentBarTotal) * 100 : 33;
  const pNeg = sentimentBarTotal > 0 ? (data.metrics.negativePercent / sentimentBarTotal) * 100 : 33;
  const pNeutral = 100 - pPos - pNeg;

  const sentimentEmojis = { positive: '😊', negative: '😟', neutral: '😐' } as const;

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Social Buzz</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.score}</span>
            <div className={`text-xs font-medium ${data.metrics.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {data.metrics.change24h >= 0 ? '▲' : '▼'} {Math.abs(data.metrics.change24h).toFixed(1)}% 24h
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">{data.metrics.mentions.toLocaleString()} mentions</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-green-500 transition-all" style={{ width: `${pPos}%` }} title={`Positive: ${pPos.toFixed(0)}%`} />
          <div className="bg-gray-400 dark:bg-slate-500 transition-all" style={{ width: `${pNeutral}%` }} title={`Neutral: ${pNeutral.toFixed(0)}%`} />
          <div className="bg-red-500 transition-all" style={{ width: `${pNeg}%` }} title={`Negative: ${pNeg.toFixed(0)}%`} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span>😊 {pPos.toFixed(0)}%</span>
          <span>😐 {pNeutral.toFixed(0)}%</span>
          <span>😟 {pNeg.toFixed(0)}%</span>
        </div>
      </div>

      {/* Keywords */}
      {data.metrics.topKeywords.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {data.metrics.topKeywords.slice(0, 6).map((kw, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium">
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Influencers */}
      {data.influencers.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">Key Influencers</h4>
          <div className="space-y-2">
            {data.influencers.map((inf, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {inf.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{inf.name}</span>
                    {inf.sentiment && (
                      <span className="text-xs">{sentimentEmojis[inf.sentiment]}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-slate-400">@{inf.handle} · {formatFollowers(inf.followers)}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400 uppercase">{inf.platform}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Social data aggregated from X, Reddit, Telegram. Refreshes every 2 min.
        </p>
      </div>
    </div>
  );
}
