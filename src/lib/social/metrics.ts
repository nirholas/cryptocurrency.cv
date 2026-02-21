/**
 * Social Metrics Service
 * 
 * Integrates with LunarCrush and Santiment APIs to provide
 * social sentiment, volume, and influencer metrics for cryptocurrencies.
 */

// Types for social metrics data
export interface SocialMetrics {
  symbol: string;
  name: string;
  timestamp: Date;
  // Volume metrics
  socialVolume: number;
  socialVolumeChange24h: number;
  socialDominance: number;
  // Sentiment metrics
  sentiment: number; // -1 to 1
  sentimentChange24h: number;
  bullishPercent: number;
  bearishPercent: number;
  // Engagement metrics
  twitterFollowers: number;
  twitterFollowersChange24h: number;
  twitterMentions: number;
  redditSubscribers: number;
  redditActiveUsers: number;
  telegramMembers: number;
  // Influencer metrics
  influencerMentions: number;
  topInfluencers: InfluencerMention[];
  // Market correlation
  socialVolumeToPrice: number;
  sentimentToPrice: number;
  // Galaxy Score (LunarCrush specific)
  galaxyScore?: number;
  altRank?: number;
}

export interface InfluencerMention {
  username: string;
  platform: 'twitter' | 'youtube' | 'reddit' | 'telegram';
  followers: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  postUrl?: string;
  timestamp: Date;
}

export interface SocialTrend {
  symbol: string;
  name: string;
  trendScore: number;
  volumeSpike: boolean;
  sentimentShift: boolean;
  reason: string;
  timeframe: '1h' | '4h' | '24h' | '7d';
}

export interface SocialAlert {
  id: string;
  symbol: string;
  alertType: 'volume_spike' | 'sentiment_shift' | 'influencer_mention' | 'viral_content';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// API Configuration
const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY || '';
const LUNARCRUSH_BASE_URL = 'https://lunarcrush.com/api4';

const SANTIMENT_API_KEY = process.env.SANTIMENT_API_KEY || '';
const SANTIMENT_BASE_URL = 'https://api.santiment.net/graphql';

// Cache for API responses
const metricsCache = new Map<string, { data: SocialMetrics; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch social metrics from LunarCrush
 */
export async function fetchLunarCrushMetrics(symbol: string): Promise<SocialMetrics | null> {
  if (!LUNARCRUSH_API_KEY) {
    console.warn('LunarCrush API key not configured - social metrics unavailable');
    return null;
  }

  try {
    const response = await fetch(
      `${LUNARCRUSH_BASE_URL}/public/coins/${symbol.toLowerCase()}/time-series/v2`,
      {
        headers: {
          'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }

    const data = await response.json();
    return transformLunarCrushData(data, symbol);
  } catch (error) {
    console.error('LunarCrush fetch error:', error);
    return null;
  }
}

/**
 * Fetch social metrics from Santiment
 */
export async function fetchSantimentMetrics(symbol: string): Promise<Partial<SocialMetrics> | null> {
  if (!SANTIMENT_API_KEY) {
    console.warn('Santiment API key not configured');
    return null;
  }

  const query = `
    query {
      getMetric(metric: "social_volume_total") {
        timeseriesData(
          slug: "${symbol.toLowerCase()}"
          from: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
          to: "${new Date().toISOString()}"
          interval: "1h"
        ) {
          datetime
          value
        }
      }
      sentiment: getMetric(metric: "sentiment_balance") {
        timeseriesData(
          slug: "${symbol.toLowerCase()}"
          from: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
          to: "${new Date().toISOString()}"
          interval: "1h"
        ) {
          datetime
          value
        }
      }
    }
  `;

  try {
    const response = await fetch(SANTIMENT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${SANTIMENT_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Santiment API error: ${response.status}`);
    }

    const data = await response.json();
    return transformSantimentData(data, symbol);
  } catch (error) {
    console.error('Santiment fetch error:', error);
    return null;
  }
}

/**
 * Get combined social metrics from all sources
 */
export async function getSocialMetrics(symbol: string): Promise<SocialMetrics> {
  // Check cache first
  const cacheKey = `metrics:${symbol.toUpperCase()}`;
  const cached = metricsCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Fetch from all sources in parallel
  const [lunarCrush, santiment] = await Promise.all([
    fetchLunarCrushMetrics(symbol),
    fetchSantimentMetrics(symbol),
  ]);

  // If no data from any source, return null
  if (!lunarCrush && !santiment) {
    console.warn(`No social metrics available for ${symbol} - API keys may not be configured`);
    return null as unknown as SocialMetrics;
  }

  // Merge data from available sources
  const baseMetrics: SocialMetrics = {
    symbol: symbol.toUpperCase(),
    name: symbol,
    timestamp: new Date(),
    socialVolume: 0,
    socialVolumeChange24h: 0,
    socialDominance: 0,
    sentiment: 0,
    sentimentChange24h: 0,
    bullishPercent: 50,
    bearishPercent: 50,
    twitterFollowers: 0,
    twitterFollowersChange24h: 0,
    twitterMentions: 0,
    redditSubscribers: 0,
    redditActiveUsers: 0,
    telegramMembers: 0,
    influencerMentions: 0,
    topInfluencers: [],
    socialVolumeToPrice: 0,
    sentimentToPrice: 0,
  };

  const metrics: SocialMetrics = {
    ...baseMetrics,
    ...lunarCrush,
    ...santiment,
    timestamp: new Date(),
  };

  // Cache the result
  metricsCache.set(cacheKey, {
    data: metrics,
    expires: Date.now() + CACHE_TTL,
  });

  return metrics;
}

/**
 * Get social metrics for multiple coins
 */
export async function getBatchSocialMetrics(symbols: string[]): Promise<Map<string, SocialMetrics>> {
  const results = new Map<string, SocialMetrics>();
  
  // Fetch in batches of 10
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => getSocialMetrics(symbol));
    const batchResults = await Promise.all(promises);
    
    batch.forEach((symbol, index) => {
      results.set(symbol.toUpperCase(), batchResults[index]);
    });
  }

  return results;
}

/**
 * Get trending coins by social metrics
 */
export async function getSocialTrends(limit = 20): Promise<SocialTrend[]> {
  if (!LUNARCRUSH_API_KEY) {
    console.warn('LunarCrush API key not configured - social trends unavailable');
    return [];
  }

  try {
    const response = await fetch(
      `${LUNARCRUSH_BASE_URL}/public/coins/list/v2?sort=galaxy_score&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }

    const data = await response.json();
    return transformTrendData(data);
  } catch (error) {
    console.error('Social trends fetch error:', error);
    return [];
  }
}

/**
 * Get social alerts for monitoring
 */
export async function getSocialAlerts(symbols: string[]): Promise<SocialAlert[]> {
  const alerts: SocialAlert[] = [];
  
  const metrics = await getBatchSocialMetrics(symbols);
  
  for (const [symbol, data] of metrics) {
    // Volume spike detection
    if (data.socialVolumeChange24h > 200) {
      alerts.push({
        id: `vol_${symbol}_${Date.now()}`,
        symbol,
        alertType: 'volume_spike',
        severity: data.socialVolumeChange24h > 500 ? 'high' : 'medium',
        message: `${symbol} social volume up ${data.socialVolumeChange24h.toFixed(0)}% in 24h`,
        data: { change: data.socialVolumeChange24h, volume: data.socialVolume },
        timestamp: new Date(),
      });
    }

    // Sentiment shift detection
    if (Math.abs(data.sentimentChange24h) > 0.3) {
      const direction = data.sentimentChange24h > 0 ? 'bullish' : 'bearish';
      alerts.push({
        id: `sent_${symbol}_${Date.now()}`,
        symbol,
        alertType: 'sentiment_shift',
        severity: Math.abs(data.sentimentChange24h) > 0.5 ? 'high' : 'medium',
        message: `${symbol} sentiment shifted ${direction} (${(data.sentimentChange24h * 100).toFixed(0)}%)`,
        data: { change: data.sentimentChange24h, current: data.sentiment },
        timestamp: new Date(),
      });
    }

    // Influencer mention detection
    if (data.influencerMentions > 5) {
      const topInfluencer = data.topInfluencers[0];
      alerts.push({
        id: `inf_${symbol}_${Date.now()}`,
        symbol,
        alertType: 'influencer_mention',
        severity: data.influencerMentions > 10 ? 'high' : 'low',
        message: `${symbol} mentioned by ${data.influencerMentions} influencers${topInfluencer ? ` including @${topInfluencer.username}` : ''}`,
        data: { count: data.influencerMentions, top: topInfluencer },
        timestamp: new Date(),
      });
    }
  }

  return alerts.sort((a, b) => 
    b.severity === 'high' ? 1 : a.severity === 'high' ? -1 : 0
  );
}

// Helper functions for data transformation

function transformLunarCrushData(data: Record<string, unknown>, symbol: string): SocialMetrics {
  // Transform LunarCrush API response to our SocialMetrics format
  const timeSeries = (data.timeSeries as Array<Record<string, number>>) || [];
  const latest = timeSeries[timeSeries.length - 1] || {};
  const previous = timeSeries[timeSeries.length - 2] || {};

  return {
    symbol: symbol.toUpperCase(),
    name: (data.name as string) || symbol,
    timestamp: new Date(),
    socialVolume: latest.social_volume || 0,
    socialVolumeChange24h: calculateChange(latest.social_volume, previous.social_volume),
    socialDominance: latest.social_dominance || 0,
    sentiment: normalizeSentiment(latest.sentiment),
    sentimentChange24h: calculateChange(latest.sentiment, previous.sentiment),
    bullishPercent: latest.bullish_sentiment || 50,
    bearishPercent: latest.bearish_sentiment || 50,
    twitterFollowers: latest.twitter_followers || 0,
    twitterFollowersChange24h: calculateChange(latest.twitter_followers, previous.twitter_followers),
    twitterMentions: latest.tweets || 0,
    redditSubscribers: latest.reddit_subscribers || 0,
    redditActiveUsers: latest.reddit_active_users || 0,
    telegramMembers: latest.telegram_members || 0,
    influencerMentions: latest.influencer_mentions || 0,
    topInfluencers: [],
    socialVolumeToPrice: latest.social_volume_price_correlation || 0,
    sentimentToPrice: latest.sentiment_price_correlation || 0,
    galaxyScore: latest.galaxy_score,
    altRank: latest.alt_rank,
  };
}

function transformSantimentData(data: Record<string, unknown>, symbol: string): Partial<SocialMetrics> {
  const dataObj = data as any;
  const volumeData = (dataObj.data?.getMetric?.timeseriesData as Array<{ value: number }>) || [];
  const sentimentData = (dataObj.data?.sentiment?.timeseriesData as Array<{ value: number }>) || [];

  const totalVolume = volumeData.reduce((sum, d) => sum + (d.value || 0), 0);
  const avgSentiment = sentimentData.length > 0
    ? sentimentData.reduce((sum, d) => sum + (d.value || 0), 0) / sentimentData.length
    : 0;

  return {
    socialVolume: totalVolume,
    sentiment: avgSentiment,
  };
}

function transformTrendData(data: Record<string, unknown>): SocialTrend[] {
  const coins = (data.data as Array<Record<string, unknown>>) || [];
  
  return coins.map(coin => ({
    symbol: (coin.symbol as string)?.toUpperCase() || '',
    name: (coin.name as string) || '',
    trendScore: (coin.galaxy_score as number) || 0,
    volumeSpike: ((coin.social_volume_24h_change as number) || 0) > 100,
    sentimentShift: Math.abs((coin.sentiment_24h_change as number) || 0) > 0.2,
    reason: determineTrendReason(coin),
    timeframe: '24h',
  }));
}

function determineTrendReason(coin: Record<string, unknown>): string {
  const volumeChange = (coin.social_volume_24h_change as number) || 0;
  const sentimentChange = (coin.sentiment_24h_change as number) || 0;
  
  if (volumeChange > 200) return `Social volume surged ${volumeChange.toFixed(0)}%`;
  if (sentimentChange > 0.3) return 'Strong bullish sentiment shift';
  if (sentimentChange < -0.3) return 'Strong bearish sentiment shift';
  if ((coin.galaxy_score as number) > 80) return 'High Galaxy Score';
  return 'Trending on social media';
}

function calculateChange(current?: number, previous?: number): number {
  if (!current || !previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function normalizeSentiment(value?: number): number {
  if (!value) return 0;
  // LunarCrush sentiment is 0-100, normalize to -1 to 1
  return (value - 50) / 50;
}
