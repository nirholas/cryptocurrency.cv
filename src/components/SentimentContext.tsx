'use client';

import { useState, useEffect } from 'react';

interface SentimentScore {
  overall: string;
  score: number;
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

interface SocialSentimentData {
  platform: string;
  sentiment: string;
  score: number;
  volume: number;
}

interface SentimentContextProps {
  tickers: string[];
  articleSentiment: string;
}

const sentimentLabels: Record<string, { label: string; emoji: string; color: string }> = {
  very_positive: { label: 'Very Bullish', emoji: '🟢', color: 'text-green-600 dark:text-green-400' },
  positive: { label: 'Bullish', emoji: '🟢', color: 'text-green-600 dark:text-green-400' },
  very_bullish: { label: 'Very Bullish', emoji: '🟢', color: 'text-green-600 dark:text-green-400' },
  bullish: { label: 'Bullish', emoji: '🟢', color: 'text-green-600 dark:text-green-400' },
  neutral: { label: 'Neutral', emoji: '⚪', color: 'text-gray-600 dark:text-gray-400' },
  negative: { label: 'Bearish', emoji: '🔴', color: 'text-red-600 dark:text-red-400' },
  very_negative: { label: 'Very Bearish', emoji: '🔴', color: 'text-red-600 dark:text-red-400' },
  bearish: { label: 'Bearish', emoji: '🔴', color: 'text-red-600 dark:text-red-400' },
  very_bearish: { label: 'Very Bearish', emoji: '🔴', color: 'text-red-600 dark:text-red-400' },
};

function SentimentBar({ score, label }: { score: number; label: string }) {
  // Normalize score: API may return -100 to 100 or 0 to 1
  const normalized = Math.abs(score) > 1 ? (score + 100) / 200 : score;
  const pct = Math.max(0, Math.min(100, normalized * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-slate-400">{label}</span>
        <span className="font-medium text-gray-700 dark:text-slate-300">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, #ef4444, #eab308 50%, #22c55e)`,
            backgroundSize: '200% 100%',
            backgroundPosition: `${100 - pct}% 0`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500">
        <span>Bearish</span>
        <span>Bullish</span>
      </div>
    </div>
  );
}

function isSentimentSimilar(a: string, b: string): boolean {
  const bullish = ['very_positive', 'positive', 'bullish', 'very_bullish'];
  const bearish = ['very_negative', 'negative', 'bearish', 'very_bearish'];
  const aIsBull = bullish.includes(a);
  const aIsBear = bearish.includes(a);
  const bIsBull = bullish.includes(b);
  const bIsBear = bearish.includes(b);
  if (aIsBull && bIsBull) return true;
  if (aIsBear && bIsBear) return true;
  if (a === 'neutral' || b === 'neutral') return true;
  return false;
}

export function SentimentContext({ tickers, articleSentiment }: SentimentContextProps) {
  const [marketData, setMarketData] = useState<SentimentScore | null>(null);
  const [socialData, setSocialData] = useState<SocialSentimentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const assetParam = tickers[0] || '';
      const [sentimentRes, socialRes] = await Promise.all([
        fetch(`/api/sentiment?asset=${encodeURIComponent(assetParam)}&limit=10`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/social?coin=${encodeURIComponent(assetParam.toLowerCase())}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (sentimentRes?.market) {
        setMarketData(sentimentRes.market);
      }
      
      if (socialRes) {
        // Normalize social data — API shape may vary
        const platforms: SocialSentimentData[] = [];
        if (socialRes.twitter || socialRes.sources?.twitter) {
          platforms.push({
            platform: 'X / Twitter',
            sentiment: socialRes.twitter?.sentiment || 'neutral',
            score: socialRes.twitter?.score || socialRes.sources?.twitter || 50,
            volume: socialRes.twitter?.volume || 0,
          });
        }
        if (socialRes.reddit || socialRes.sources?.reddit) {
          platforms.push({
            platform: 'Reddit',
            sentiment: socialRes.reddit?.sentiment || 'neutral',
            score: socialRes.reddit?.score || socialRes.sources?.reddit || 50,
            volume: socialRes.reddit?.volume || 0,
          });
        }
        if (platforms.length > 0) {
          setSocialData(platforms);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sentiment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tickers.length > 0) fetchSentiment();
  }, [tickers.join(',')]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-44 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-8 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
          <div className="h-8 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Sentiment Context</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
          <span>⚠️</span>
          <div className="flex-1 text-sm">{error}</div>
          <button
            onClick={fetchSentiment}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no data at all, show a minimal card
  if (!marketData && !socialData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Sentiment Context</h2>
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          Sentiment data not available for these tickers.
        </p>
      </div>
    );
  }

  const articleSent = sentimentLabels[articleSentiment] || sentimentLabels.neutral;
  const marketSent = marketData ? (sentimentLabels[marketData.overall] || sentimentLabels.neutral) : null;

  // Check for divergence
  const hasDivergence = marketData && !isSentimentSimilar(articleSentiment, marketData.overall);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Sentiment Context</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              How this article compares to market consensus
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 space-y-5">
        {/* Article Sentiment */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">This Article</span>
          <span className={`text-sm font-semibold ${articleSent.color}`}>
            {articleSent.emoji} {articleSent.label}
          </span>
        </div>

        {/* Market Sentiment */}
        {marketData && (
          <div>
            <SentimentBar
              score={marketData.score}
              label="Market News Sentiment"
            />
            {marketData.summary && (
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                {marketData.summary}
              </p>
            )}
          </div>
        )}

        {/* Social Sentiment */}
        {socialData && socialData.map((platform) => (
          <div key={platform.platform}>
            <SentimentBar
              score={platform.score}
              label={`${platform.platform} Sentiment`}
            />
            {platform.volume > 0 && (
              <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">
                {platform.volume.toLocaleString()} mentions
              </p>
            )}
          </div>
        ))}

        {/* Key Drivers */}
        {marketData?.keyDrivers && marketData.keyDrivers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">Key Drivers</h3>
            <div className="flex flex-wrap gap-1.5">
              {marketData.keyDrivers.map((driver, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg">
                  {driver}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divergence Alert */}
        {hasDivergence && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-600/50 rounded-xl">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-400">
                  Sentiment Divergence Detected
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-500 mt-1 leading-relaxed">
                  This article&apos;s sentiment ({articleSent.label.toLowerCase()}) differs from the broader
                  market consensus ({marketSent?.label.toLowerCase()}). This divergence could indicate
                  an emerging shift or a contrarian viewpoint worth monitoring.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-slate-400">
          🤖 Powered by AI sentiment analysis
        </span>
        <div className="flex gap-1">
          {tickers.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              ${t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
