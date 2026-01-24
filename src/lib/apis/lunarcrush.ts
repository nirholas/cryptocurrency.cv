/**
 * LunarCrush API Integration
 * 
 * Social intelligence for cryptocurrency markets.
 * Provides real social sentiment data from Twitter, Reddit, YouTube, etc.
 * 
 * @see https://lunarcrush.com/developers/api/endpoints
 * @module lib/apis/lunarcrush
 */

const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY || '';
const BASE_URL = 'https://lunarcrush.com/api4/public';

// =============================================================================
// Types
// =============================================================================

export interface SocialMetrics {
  symbol: string;
  name: string;
  socialVolume: number;
  socialVolume24h: number;
  socialVolumeChange: number;
  socialDominance: number;
  sentimentScore: number; // 0-5 scale
  sentimentLabel: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
  galaxyScore: number; // 0-100 LunarCrush proprietary score
  altRank: number;
  contributors: number;
  socialContributors24h: number;
  mentions: number;
  mentionsChange24h: number;
  bullishSentiment: number; // percentage
  bearishSentiment: number;
  newsArticles: number;
  newsPositive: number;
  newsNegative: number;
  redditPosts: number;
  redditComments: number;
  tweets: number;
  tweetSentiment: number;
  youtubeVideos: number;
  timestamp: string;
}

export interface InfluencerData {
  id: string;
  displayName: string;
  twitterHandle?: string;
  followers: number;
  engagementRate: number;
  influencerRank: number;
  postCount: number;
  avgLikes: number;
  avgRetweets: number;
  topMentions: string[];
  categories: string[];
  bullishPercent: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  mentionsChange: number;
  sentiment: number;
  relatedCoins: string[];
  trendScore: number;
}

export interface SocialFeed {
  posts: Array<{
    id: string;
    platform: 'twitter' | 'reddit' | 'youtube' | 'news';
    author: string;
    authorFollowers: number;
    content: string;
    sentiment: number;
    engagement: number;
    timestamp: string;
    url: string;
  }>;
  totalPosts: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Check if LunarCrush API is configured
 */
export function isLunarCrushConfigured(): boolean {
  return !!LUNARCRUSH_API_KEY;
}

/**
 * Make authenticated request to LunarCrush API
 */
async function lunarCrushFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!LUNARCRUSH_API_KEY) {
    console.warn('LunarCrush API key not configured');
    return null;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`LunarCrush API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('LunarCrush API request failed:', error);
    return null;
  }
}

/**
 * Get social metrics for a cryptocurrency
 */
export async function getSocialMetrics(symbol: string): Promise<SocialMetrics | null> {
  const data = await lunarCrushFetch<{
    symbol: string;
    name: string;
    social_volume: number;
    social_volume_24h: number;
    social_volume_change_24h: number;
    social_dominance: number;
    average_sentiment: number;
    galaxy_score: number;
    alt_rank: number;
    social_contributors: number;
    social_contributors_24h: number;
    bullish_sentiment: number;
    bearish_sentiment: number;
    news: number;
    news_positive: number;
    news_negative: number;
    reddit_posts: number;
    reddit_comments: number;
    tweets: number;
    tweet_sentiment: number;
    youtube: number;
  }>(`/coins/${symbol.toLowerCase()}/meta`);

  if (!data) return null;

  const sentimentScore = data.average_sentiment || 3;
  let sentimentLabel: SocialMetrics['sentimentLabel'] = 'neutral';
  if (sentimentScore >= 4.5) sentimentLabel = 'very_bullish';
  else if (sentimentScore >= 3.5) sentimentLabel = 'bullish';
  else if (sentimentScore >= 2.5) sentimentLabel = 'neutral';
  else if (sentimentScore >= 1.5) sentimentLabel = 'bearish';
  else sentimentLabel = 'very_bearish';

  return {
    symbol: data.symbol,
    name: data.name,
    socialVolume: data.social_volume || 0,
    socialVolume24h: data.social_volume_24h || 0,
    socialVolumeChange: data.social_volume_change_24h || 0,
    socialDominance: data.social_dominance || 0,
    sentimentScore,
    sentimentLabel,
    galaxyScore: data.galaxy_score || 0,
    altRank: data.alt_rank || 0,
    contributors: data.social_contributors || 0,
    socialContributors24h: data.social_contributors_24h || 0,
    mentions: data.social_volume || 0,
    mentionsChange24h: data.social_volume_change_24h || 0,
    bullishSentiment: data.bullish_sentiment || 50,
    bearishSentiment: data.bearish_sentiment || 50,
    newsArticles: data.news || 0,
    newsPositive: data.news_positive || 0,
    newsNegative: data.news_negative || 0,
    redditPosts: data.reddit_posts || 0,
    redditComments: data.reddit_comments || 0,
    tweets: data.tweets || 0,
    tweetSentiment: data.tweet_sentiment || 0,
    youtubeVideos: data.youtube || 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get social metrics for multiple coins
 */
export async function getBulkSocialMetrics(symbols: string[]): Promise<SocialMetrics[]> {
  const results = await Promise.all(
    symbols.slice(0, 20).map(symbol => getSocialMetrics(symbol))
  );
  return results.filter((r): r is SocialMetrics => r !== null);
}

/**
 * Get top coins by social volume
 */
export async function getTopSocialCoins(limit: number = 50): Promise<SocialMetrics[]> {
  const data = await lunarCrushFetch<Array<{
    symbol: string;
    name: string;
    social_volume: number;
    average_sentiment: number;
    galaxy_score: number;
    alt_rank: number;
  }>>('/coins/list', { sort: 'social_volume', limit: limit.toString() });

  if (!data || !Array.isArray(data)) return [];

  return data.map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    socialVolume: coin.social_volume || 0,
    socialVolume24h: 0,
    socialVolumeChange: 0,
    socialDominance: 0,
    sentimentScore: coin.average_sentiment || 3,
    sentimentLabel: 'neutral' as const,
    galaxyScore: coin.galaxy_score || 0,
    altRank: coin.alt_rank || 0,
    contributors: 0,
    socialContributors24h: 0,
    mentions: coin.social_volume || 0,
    mentionsChange24h: 0,
    bullishSentiment: 50,
    bearishSentiment: 50,
    newsArticles: 0,
    newsPositive: 0,
    newsNegative: 0,
    redditPosts: 0,
    redditComments: 0,
    tweets: 0,
    tweetSentiment: 0,
    youtubeVideos: 0,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get top crypto influencers
 */
export async function getTopInfluencers(limit: number = 50): Promise<InfluencerData[]> {
  const data = await lunarCrushFetch<Array<{
    id: string;
    display_name: string;
    twitter_screen_name?: string;
    followers: number;
    engagement_rate: number;
    influencer_rank: number;
    post_count: number;
    avg_likes: number;
    avg_retweets: number;
    top_mentions: string[];
    categories: string[];
    bullish_percent: number;
  }>>('/influencers', { limit: limit.toString() });

  if (!data || !Array.isArray(data)) return [];

  return data.map(inf => ({
    id: inf.id,
    displayName: inf.display_name,
    twitterHandle: inf.twitter_screen_name,
    followers: inf.followers || 0,
    engagementRate: inf.engagement_rate || 0,
    influencerRank: inf.influencer_rank || 0,
    postCount: inf.post_count || 0,
    avgLikes: inf.avg_likes || 0,
    avgRetweets: inf.avg_retweets || 0,
    topMentions: inf.top_mentions || [],
    categories: inf.categories || [],
    bullishPercent: inf.bullish_percent || 50,
  }));
}

/**
 * Get trending topics in crypto
 */
export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  const data = await lunarCrushFetch<Array<{
    topic: string;
    mentions: number;
    mentions_change: number;
    sentiment: number;
    related_coins: string[];
    trend_score: number;
  }>>('/topics/trending');

  if (!data || !Array.isArray(data)) return [];

  return data.map(topic => ({
    topic: topic.topic,
    mentions: topic.mentions || 0,
    mentionsChange: topic.mentions_change || 0,
    sentiment: topic.sentiment || 0,
    relatedCoins: topic.related_coins || [],
    trendScore: topic.trend_score || 0,
  }));
}

/**
 * Get social feed for a coin
 */
export async function getSocialFeed(symbol: string, limit: number = 50): Promise<SocialFeed> {
  const data = await lunarCrushFetch<{
    posts: Array<{
      id: string;
      type: string;
      creator_name: string;
      creator_followers: number;
      body: string;
      sentiment: number;
      interactions: number;
      time: number;
      url: string;
    }>;
    total: number;
  }>(`/coins/${symbol.toLowerCase()}/feeds`, { limit: limit.toString() });

  if (!data) {
    return { posts: [], totalPosts: 0 };
  }

  const platformMap: Record<string, 'twitter' | 'reddit' | 'youtube' | 'news'> = {
    twitter: 'twitter',
    tweet: 'twitter',
    reddit: 'reddit',
    reddit_post: 'reddit',
    youtube: 'youtube',
    news: 'news',
    article: 'news',
  };

  return {
    posts: (data.posts || []).map(post => ({
      id: post.id,
      platform: platformMap[post.type?.toLowerCase()] || 'news',
      author: post.creator_name || 'Unknown',
      authorFollowers: post.creator_followers || 0,
      content: post.body || '',
      sentiment: post.sentiment || 0,
      engagement: post.interactions || 0,
      timestamp: new Date(post.time * 1000).toISOString(),
      url: post.url || '',
    })),
    totalPosts: data.total || 0,
  };
}

/**
 * Calculate market sentiment from social data
 */
export async function getMarketSentiment(): Promise<{
  overallSentiment: number;
  sentimentLabel: string;
  topBullish: SocialMetrics[];
  topBearish: SocialMetrics[];
  socialDominance: Record<string, number>;
  trendingTopics: TrendingTopic[];
}> {
  const [topCoins, trending] = await Promise.all([
    getTopSocialCoins(100),
    getTrendingTopics(),
  ]);

  if (topCoins.length === 0) {
    return {
      overallSentiment: 3,
      sentimentLabel: 'neutral',
      topBullish: [],
      topBearish: [],
      socialDominance: {},
      trendingTopics: [],
    };
  }

  // Calculate weighted average sentiment
  const totalVolume = topCoins.reduce((sum, c) => sum + c.socialVolume, 0);
  const weightedSentiment = topCoins.reduce(
    (sum, c) => sum + (c.sentimentScore * c.socialVolume / totalVolume),
    0
  );

  let sentimentLabel = 'neutral';
  if (weightedSentiment >= 4) sentimentLabel = 'bullish';
  else if (weightedSentiment >= 4.5) sentimentLabel = 'very bullish';
  else if (weightedSentiment <= 2) sentimentLabel = 'bearish';
  else if (weightedSentiment <= 1.5) sentimentLabel = 'very bearish';

  // Get top bullish and bearish coins
  const sortedBySentiment = [...topCoins].sort((a, b) => b.sentimentScore - a.sentimentScore);
  const topBullish = sortedBySentiment.slice(0, 10);
  const topBearish = sortedBySentiment.slice(-10).reverse();

  // Calculate social dominance
  const socialDominance: Record<string, number> = {};
  topCoins.slice(0, 20).forEach(coin => {
    socialDominance[coin.symbol] = (coin.socialVolume / totalVolume) * 100;
  });

  return {
    overallSentiment: weightedSentiment,
    sentimentLabel,
    topBullish,
    topBearish,
    socialDominance,
    trendingTopics: trending.slice(0, 20),
  };
}
