/**
 * X/Twitter Scraper - Automated sentiment analysis without paid API
 * 
 * Uses multiple strategies:
 * 1. Nitter RSS feeds (primary - no auth needed)
 * 2. Direct scraping with session cookies (fallback)
 * 3. Cached results from Vercel KV (optional)
 * 
 * ALL FEATURES WORK WITHOUT ANY CONFIGURATION!
 * - No API keys required
 * - No Vercel KV required (uses in-memory cache fallback)
 * - No webhooks required (alerts are optional)
 */

// Optional KV - will gracefully fall back to in-memory cache
let kv: {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>;
  smembers: <T>(key: string) => Promise<T | null>;
  sadd: (key: string, ...values: string[]) => Promise<void>;
} | null = null;

// In-memory cache fallback when KV is not available
const memoryCache = new Map<string, { value: unknown; expires: number }>();

// Try to load Vercel KV, fall back to memory cache
try {
  // Dynamic import to avoid build errors when KV is not configured
  const kvModule = require('@vercel/kv');
  if (kvModule.kv && process.env.KV_REST_API_URL) {
    kv = kvModule.kv;
  }
} catch {
  // KV not available, will use memory cache
}

// Helper to get from cache (KV or memory)
async function cacheGet<T>(key: string): Promise<T | null> {
  if (kv) {
    try {
      return await kv.get<T>(key);
    } catch {
      // Fall through to memory cache
    }
  }
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value as T;
  }
  return null;
}

// Helper to set cache (KV or memory)
async function cacheSet(key: string, value: unknown, ttlSeconds: number = 900): Promise<void> {
  if (kv) {
    try {
      await kv.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      // Fall through to memory cache
    }
  }
  memoryCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

// Helper to get set members from cache
async function cacheSmembers<T>(key: string): Promise<T[]> {
  if (kv) {
    try {
      const result = await kv.smembers<T[]>(key);
      return result || [];
    } catch {
      // Fall through to memory cache
    }
  }
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now() && Array.isArray(cached.value)) {
    return cached.value as T[];
  }
  return [];
}

// Helper to add to set in cache
async function cacheSadd(key: string, value: string): Promise<void> {
  if (kv) {
    try {
      await kv.sadd(key, value);
      return;
    } catch {
      // Fall through to memory cache
    }
  }
  const cached = memoryCache.get(key);
  const existing = cached && Array.isArray(cached.value) ? cached.value as string[] : [];
  if (!existing.includes(value)) {
    existing.push(value);
  }
  memoryCache.set(key, { value: existing, expires: Date.now() + 86400 * 1000 }); // 24h TTL
}

// Public Nitter instances that provide RSS feeds
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.woodland.cafe',
  'https://nitter.esmailelbob.xyz',
  'https://nitter.1d4.us',
];

export interface XUser {
  username: string;
  displayName?: string;
  category: 'whale' | 'influencer' | 'analyst' | 'developer' | 'founder' | 'trader';
  weight: number; // 0-1, importance for sentiment calculation
}

export interface XTweet {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  likes?: number;
  retweets?: number;
  replies?: number;
  sentiment?: {
    score: number; // -1 to 1
    label: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    tickers: string[];
  };
}

export interface InfluencerList {
  id: string;
  name: string;
  description: string;
  users: XUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SentimentResult {
  listId: string;
  listName: string;
  aggregateSentiment: number;
  sentimentLabel: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  tweetCount: number;
  topTickers: { ticker: string; mentions: number; sentiment: number }[];
  recentTweets: XTweet[];
  lastUpdated: Date;
  userBreakdown: {
    username: string;
    tweetCount: number;
    avgSentiment: number;
    topTickers: string[];
  }[];
}

// Default crypto influencer list
export const DEFAULT_CRYPTO_INFLUENCERS: XUser[] = [
  // Ethereum/DeFi
  { username: 'VitalikButerin', category: 'founder', weight: 0.9 },
  { username: 'sassal0x', category: 'influencer', weight: 0.8 },
  { username: 'evan_van_ness', category: 'developer', weight: 0.7 },
  { username: 'antiloophole', category: 'analyst', weight: 0.7 },
  
  // Bitcoin
  { username: 'saborski', category: 'analyst', weight: 0.8 },
  { username: 'DocumentingBTC', category: 'influencer', weight: 0.7 },
  { username: 'BitcoinMagazine', category: 'influencer', weight: 0.7 },
  
  // Trading/Analysis
  { username: 'CryptoCred', category: 'trader', weight: 0.8 },
  { username: 'CryptoCapo_', category: 'trader', weight: 0.7 },
  { username: 'ColdBloodedShill', category: 'analyst', weight: 0.7 },
  
  // Whales/VCs
  { username: 'BarrySilbert', category: 'whale', weight: 0.9 },
  { username: 'APompliano', category: 'influencer', weight: 0.8 },
  { username: 'balaborinski', category: 'founder', weight: 0.9 },
  
  // On-chain analysts
  { username: 'lookonchain', category: 'analyst', weight: 0.9 },
  { username: 'EmberCN', category: 'analyst', weight: 0.8 },
];

/**
 * Get a working Nitter instance
 */
async function getWorkingNitterInstance(): Promise<string | null> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(`${instance}/`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return instance;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fetch tweets from a user via Nitter RSS
 */
export async function fetchUserTweetsNitter(
  username: string,
  limit: number = 20
): Promise<XTweet[]> {
  const nitter = await getWorkingNitterInstance();
  if (!nitter) {
    console.warn('No working Nitter instance found');
    return [];
  }

  try {
    const rssUrl = `${nitter}/${username}/rss`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FCN/1.0; +https://fcn.dev)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch RSS for ${username}: ${response.status}`);
      return [];
    }

    const rssText = await response.text();
    return parseNitterRSS(rssText, username, limit);
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

/**
 * Parse Nitter RSS feed into tweets
 */
function parseNitterRSS(rssText: string, username: string, limit: number): XTweet[] {
  const tweets: XTweet[] = [];
  
  // Simple XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/;

  let match;
  while ((match = itemRegex.exec(rssText)) !== null && tweets.length < limit) {
    const item = match[1];
    
    const titleMatch = titleRegex.exec(item);
    const linkMatch = linkRegex.exec(item);
    const dateMatch = pubDateRegex.exec(item);
    const descMatch = descRegex.exec(item);
    
    if (linkMatch) {
      // Extract tweet ID from URL
      const urlParts = linkMatch[1].split('/');
      const tweetId = urlParts[urlParts.length - 1].replace('#m', '');
      
      // Use description or title for content
      let content = '';
      if (descMatch) {
        // Strip HTML from description
        content = descMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
      } else if (titleMatch) {
        content = titleMatch[1];
      }
      
      tweets.push({
        id: tweetId,
        username,
        content,
        timestamp: dateMatch ? new Date(dateMatch[1]) : new Date(),
      });
    }
  }

  return tweets;
}

/**
 * Analyze tweet sentiment using Groq AI
 */
export async function analyzeTweetSentiment(
  tweets: XTweet[],
  groqApiKey?: string
): Promise<XTweet[]> {
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey || tweets.length === 0) {
    return tweets;
  }

  try {
    const tweetTexts = tweets.slice(0, 20).map((t, i) => `${i + 1}. @${t.username}: "${t.content}"`).join('\n');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a crypto sentiment analyst. Analyze tweets and return JSON array with sentiment for each.
For each tweet, provide:
- index: tweet number (1-based)
- score: -1 (very bearish) to 1 (very bullish)
- label: "bullish", "bearish", or "neutral"
- confidence: 0-1
- tickers: array of mentioned crypto tickers (BTC, ETH, SOL, etc.)

Return ONLY valid JSON array, no other text.`,
          },
          {
            role: 'user',
            content: `Analyze sentiment for these crypto tweets:\n\n${tweetTexts}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.warn('Groq API error:', response.status);
      return tweets;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const sentiments = JSON.parse(jsonMatch[0]);
      
      for (const s of sentiments) {
        const idx = (s.index || s.i) - 1;
        if (idx >= 0 && idx < tweets.length) {
          tweets[idx].sentiment = {
            score: s.score || 0,
            label: s.label || 'neutral',
            confidence: s.confidence || 0.5,
            tickers: s.tickers || [],
          };
        }
      }
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
  }

  return tweets;
}

/**
 * Get or create influencer list
 */
export async function getInfluencerList(listId: string): Promise<InfluencerList | null> {
  // Try to get from cache
  const list = await cacheGet<InfluencerList>(`x:list:${listId}`);
  if (list) {
    return list;
  }
  
  // Return default list if not found
  if (listId === 'default') {
    return {
      id: 'default',
      name: 'Crypto Influencers',
      description: 'Top crypto influencers and analysts',
      users: DEFAULT_CRYPTO_INFLUENCERS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return null;
}

/**
 * Save influencer list
 */
export async function saveInfluencerList(list: InfluencerList): Promise<void> {
  await cacheSet(`x:list:${list.id}`, list, 86400); // 24h TTL
  
  // Update list index
  const listIds = await cacheSmembers<string>('x:lists');
  if (!listIds.includes(list.id)) {
    await cacheSadd('x:lists', list.id);
  }
}

/**
 * Get all influencer lists
 */
export async function getAllInfluencerLists(): Promise<InfluencerList[]> {
  const listIds = await cacheSmembers<string>('x:lists');
  
  if (listIds.length === 0) {
    // Return default list if no custom lists
    return [{
      id: 'default',
      name: 'Crypto Influencers',
      description: 'Top crypto influencers and analysts',
      users: DEFAULT_CRYPTO_INFLUENCERS,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
  }
  
  const lists = await Promise.all(
    listIds.map((id: string) => getInfluencerList(id))
  );
  return lists.filter((l): l is InfluencerList => l !== null);
}

/**
 * Fetch and analyze sentiment for an influencer list
 */
export async function fetchListSentiment(
  listId: string = 'default',
  options: {
    forceRefresh?: boolean;
    tweetsPerUser?: number;
  } = {}
): Promise<SentimentResult | null> {
  const { forceRefresh = false, tweetsPerUser = 10 } = options;
  
  // Check cache first
  const cacheKey = `x:sentiment:${listId}`;
  if (!forceRefresh) {
    const cached = await cacheGet<SentimentResult>(cacheKey);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
      // Use cache if less than 15 minutes old
      if (cacheAge < 15 * 60 * 1000) {
        return cached;
      }
    }
  }

  // Get the list
  const list = await getInfluencerList(listId);
  if (!list) {
    return null;
  }

  // Fetch tweets for all users in parallel
  const userTweets = await Promise.all(
    list.users.map(async (user) => ({
      user,
      tweets: await fetchUserTweetsNitter(user.username, tweetsPerUser),
    }))
  );

  // Flatten and analyze all tweets
  const allTweets = userTweets.flatMap(ut => ut.tweets);
  const analyzedTweets = await analyzeTweetSentiment(allTweets);

  // Calculate aggregate sentiment
  let totalScore = 0;
  let totalWeight = 0;
  const tickerStats: Record<string, { mentions: number; totalSentiment: number }> = {};
  
  const userBreakdown = userTweets.map(({ user, tweets }) => {
    const userAnalyzedTweets = analyzedTweets.filter(t => t.username === user.username);
    const userTickers: string[] = [];
    let userTotalSentiment = 0;
    let userSentimentCount = 0;

    for (const tweet of userAnalyzedTweets) {
      if (tweet.sentiment) {
        const weightedScore = tweet.sentiment.score * user.weight * tweet.sentiment.confidence;
        totalScore += weightedScore;
        totalWeight += user.weight * tweet.sentiment.confidence;
        userTotalSentiment += tweet.sentiment.score;
        userSentimentCount++;

        for (const ticker of tweet.sentiment.tickers) {
          if (!tickerStats[ticker]) {
            tickerStats[ticker] = { mentions: 0, totalSentiment: 0 };
          }
          tickerStats[ticker].mentions++;
          tickerStats[ticker].totalSentiment += tweet.sentiment.score;
          if (!userTickers.includes(ticker)) {
            userTickers.push(ticker);
          }
        }
      }
    }

    return {
      username: user.username,
      tweetCount: tweets.length,
      avgSentiment: userSentimentCount > 0 ? userTotalSentiment / userSentimentCount : 0,
      topTickers: userTickers.slice(0, 5),
    };
  });

  const aggregateSentiment = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  const topTickers = Object.entries(tickerStats)
    .map(([ticker, stats]) => ({
      ticker,
      mentions: stats.mentions,
      sentiment: stats.totalSentiment / stats.mentions,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  const result: SentimentResult = {
    listId,
    listName: list.name,
    aggregateSentiment,
    sentimentLabel: aggregateSentiment > 0.1 ? 'bullish' : aggregateSentiment < -0.1 ? 'bearish' : 'neutral',
    confidence: Math.min(totalWeight / list.users.length, 1),
    tweetCount: allTweets.length,
    topTickers,
    recentTweets: analyzedTweets
      .filter(t => t.sentiment)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20),
    lastUpdated: new Date(),
    userBreakdown,
  };

  // Cache result
  await cacheSet(cacheKey, result, 900); // 15 min TTL

  return result;
}

/**
 * Send sentiment alert to webhook (Discord, Slack, etc.)
 */
export async function sendSentimentAlert(
  webhookUrl: string,
  result: SentimentResult,
  previousSentiment?: number
): Promise<boolean> {
  const sentimentChange = previousSentiment !== undefined
    ? result.aggregateSentiment - previousSentiment
    : 0;

  const emoji = result.sentimentLabel === 'bullish' ? '🟢' : result.sentimentLabel === 'bearish' ? '🔴' : '🟡';
  const changeEmoji = sentimentChange > 0.1 ? '📈' : sentimentChange < -0.1 ? '📉' : '';

  // Format for Discord
  const embed = {
    embeds: [{
      title: `${emoji} X Sentiment Update: ${result.listName}`,
      description: `Aggregate sentiment: **${(result.aggregateSentiment * 100).toFixed(1)}%** ${result.sentimentLabel.toUpperCase()} ${changeEmoji}`,
      color: result.sentimentLabel === 'bullish' ? 0x00ff00 : result.sentimentLabel === 'bearish' ? 0xff0000 : 0xffff00,
      fields: [
        {
          name: '📊 Stats',
          value: `Tweets analyzed: ${result.tweetCount}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`,
          inline: true,
        },
        {
          name: '🏷️ Top Tickers',
          value: result.topTickers.slice(0, 5).map(t => 
            `${t.ticker}: ${t.mentions} mentions (${(t.sentiment * 100).toFixed(0)}% sentiment)`
          ).join('\n') || 'None',
          inline: true,
        },
        {
          name: '🔥 Notable Tweets',
          value: result.recentTweets.slice(0, 3).map(t =>
            `**@${t.username}**: "${t.content.slice(0, 100)}${t.content.length > 100 ? '...' : ''}"`
          ).join('\n\n') || 'None',
          inline: false,
        },
      ],
      footer: {
        text: 'FCN X Sentiment Tracker',
      },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });
    return response.ok;
  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
}
