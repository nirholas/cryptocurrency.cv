# Prompt 10: Social & Sentiment Data Adapters

## Context

The codebase already has social routes:

**Existing social routes:**
- `/api/social/sentiment` → LunarCrush (`https://lunarcrush.com/api4/public`) — **`LUNARCRUSH_API_KEY`**
- `/api/social/influencers` → LunarCrush — **`LUNARCRUSH_API_KEY`**
- `/api/social/discord` → Discord API (`https://discord.com/api/v10`) — **`DISCORD_BOT_TOKEN`**
- `/api/social/trending-narratives` → AI-based (Groq/OpenAI) — AI keys
- `/api/social/coins` → LunarCrush per-coin social metrics
- `/api/social/monitor` → Discord + Telegram real-time

**Santiment API** defined in `src/lib/social-intelligence.ts`: `https://api.santiment.net/graphql`

**Provider framework category:**
- `social-metrics` — currently no adapters

## Task

### 1. Create Social Metrics Adapters

Create `src/lib/providers/adapters/social-metrics/`:

#### `src/lib/providers/adapters/social-metrics/lunarcrush.ts` (Primary)

```typescript
export interface SocialMetricsData {
  coin: string;
  socialVolume: number;        // mentions across platforms
  socialDominance: number;     // % of total crypto social volume
  sentiment: number;           // -1 to 1 scale
  sentimentLabel: string;      // 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish'
  galaxyScore: number;         // LunarCrush composite (0-100)
  altRank: number;             // social rank vs other coins
  tweetVolume24h: number;
  redditVolume24h: number;
  newsVolume24h: number;
  urlShares24h: number;
  contributors: number;        // unique people posting
  timestamp: string;
}

export const lunarcrushSocialProvider: DataProvider<SocialMetricsData[]> = {
  name: 'lunarcrush-social',
  category: 'social-metrics',
  priority: 1,
  weight: 0.4,
  baseUrl: 'https://lunarcrush.com/api4/public',

  async fetch(params: FetchParams): Promise<ProviderResult<SocialMetricsData[]>> {
    const key = process.env.LUNARCRUSH_API_KEY;
    if (!key) throw new Error('LUNARCRUSH_API_KEY required');

    // LunarCrush v4 API
    const coins = params.symbols?.join(',') || 'BTC,ETH,SOL';
    const response = await fetch(
      `${this.baseUrl}/coins/${coins}/v1`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const data = await response.json();

    const metrics: SocialMetricsData[] = (data.data || []).map((coin: any) => ({
      coin: coin.symbol,
      socialVolume: coin.social_volume || 0,
      socialDominance: coin.social_dominance || 0,
      sentiment: coin.sentiment || 0,
      sentimentLabel: classifySentiment(coin.sentiment || 0),
      galaxyScore: coin.galaxy_score || 0,
      altRank: coin.alt_rank || 0,
      tweetVolume24h: coin.tweet_volume_24h || 0,
      redditVolume24h: coin.reddit_volume_24h || 0,
      newsVolume24h: coin.news_volume_24h || 0,
      urlShares24h: coin.url_shares_24h || 0,
      contributors: coin.social_contributors || 0,
      timestamp: new Date().toISOString(),
    }));

    return { data: metrics, provider: this.name, timestamp: Date.now(), cached: false };
  },
};

function classifySentiment(score: number): string {
  if (score <= -0.6) return 'very_bearish';
  if (score <= -0.2) return 'bearish';
  if (score <= 0.2) return 'neutral';
  if (score <= 0.6) return 'bullish';
  return 'very_bullish';
}
```

#### `src/lib/providers/adapters/social-metrics/santiment.ts` (Secondary)

```typescript
// Santiment — on-chain + social analytics via GraphQL
// https://api.santiment.net/graphql
// Requires SANTIMENT_API_KEY (free tier: limited historical data)
// Excellent for: social volume, development activity, whale behavior correlation

export const santimentSocialProvider: DataProvider<SocialMetricsData[]> = {
  name: 'santiment-social',
  category: 'social-metrics',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://api.santiment.net/graphql',

  async fetch(params: FetchParams): Promise<ProviderResult<SocialMetricsData[]>> {
    const key = process.env.SANTIMENT_API_KEY;
    if (!key) throw new Error('SANTIMENT_API_KEY required');

    const slug = params.symbol?.toLowerCase() || 'bitcoin';

    const query = `{
      getMetric(metric: "social_volume_total") {
        timeseriesData(
          slug: "${slug}"
          from: "${new Date(Date.now() - 86400_000).toISOString()}"
          to: "${new Date().toISOString()}"
          interval: "1d"
        ) {
          datetime
          value
        }
      }
      sentiment: getMetric(metric: "sentiment_balance_total") {
        timeseriesData(
          slug: "${slug}"
          from: "${new Date(Date.now() - 86400_000).toISOString()}"
          to: "${new Date().toISOString()}"
          interval: "1d"
        ) {
          datetime
          value
        }
      }
    }`;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Apikey ${key}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const socialVolume = data.data?.getMetric?.timeseriesData?.at(-1)?.value || 0;
    const sentimentScore = data.data?.sentiment?.timeseriesData?.at(-1)?.value || 0;

    return {
      data: [{
        coin: slug,
        socialVolume,
        socialDominance: 0,
        sentiment: sentimentScore,
        sentimentLabel: classifySentiment(sentimentScore),
        galaxyScore: 0,
        altRank: 0,
        tweetVolume24h: 0,
        redditVolume24h: 0,
        newsVolume24h: 0,
        urlShares24h: 0,
        contributors: 0,
        timestamp: new Date().toISOString(),
      }],
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/social-metrics/cryptopanic.ts` (News Sentiment)

```typescript
// CryptoPanic — curated crypto news with community sentiment votes
// https://cryptopanic.com/api/v1/posts/?auth_token=KEY
// Requires CRYPTOPANIC_API_KEY (free tier available)
// Unique value: community-voted sentiment on each news article

export const cryptopanicSocialProvider: DataProvider<SocialMetricsData[]> = {
  name: 'cryptopanic-news-sentiment',
  category: 'social-metrics',
  priority: 3,
  weight: 0.15,
  baseUrl: 'https://cryptopanic.com/api/v1',

  async fetch(params: FetchParams): Promise<ProviderResult<SocialMetricsData[]>> {
    const key = process.env.CRYPTOPANIC_API_KEY;
    if (!key) throw new Error('CRYPTOPANIC_API_KEY required');

    const currencies = params.symbol?.toUpperCase() || 'BTC';
    const response = await fetch(
      `${this.baseUrl}/posts/?auth_token=${key}&currencies=${currencies}&kind=news&filter=hot`
    );
    const data = await response.json();

    // Aggregate sentiment from voted articles
    const posts = data.results || [];
    const bullish = posts.filter((p: any) => p.votes?.positive > p.votes?.negative).length;
    const bearish = posts.filter((p: any) => p.votes?.negative > p.votes?.positive).length;
    const total = posts.length || 1;
    const sentimentScore = (bullish - bearish) / total;

    return {
      data: [{
        coin: currencies,
        socialVolume: total,
        socialDominance: 0,
        sentiment: sentimentScore,
        sentimentLabel: classifySentiment(sentimentScore),
        galaxyScore: 0,
        altRank: 0,
        tweetVolume24h: 0,
        redditVolume24h: 0,
        newsVolume24h: total,
        urlShares24h: 0,
        contributors: 0,
        timestamp: new Date().toISOString(),
      }],
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/social-metrics/farcaster.ts` (Web3 Native)

```typescript
// Farcaster — decentralized social protocol (Web3 Twitter)
// Neynar API: https://api.neynar.com/v2/farcaster
// Requires NEYNAR_API_KEY (free tier: 100 req/min)
// Growing crypto-native audience, valuable signal for sentiment

export const farcasterSocialProvider: DataProvider<SocialMetricsData[]> = {
  name: 'farcaster-social',
  category: 'social-metrics',
  priority: 4,
  weight: 0.15,
  baseUrl: 'https://api.neynar.com/v2/farcaster',

  async fetch(params: FetchParams): Promise<ProviderResult<SocialMetricsData[]>> {
    const key = process.env.NEYNAR_API_KEY;
    if (!key) throw new Error('NEYNAR_API_KEY required');

    const query = params.symbol?.toLowerCase() || 'bitcoin';

    // Search casts mentioning the coin
    const response = await fetch(
      `${this.baseUrl}/cast/search?q=${query}&limit=100`,
      { headers: { api_key: key } }
    );
    const data = await response.json();
    const casts = data.result?.casts || [];

    // Analyze sentiment from cast text and reactions
    const totalReactions = casts.reduce(
      (sum: number, c: any) => sum + (c.reactions?.likes_count || 0),
      0
    );

    return {
      data: [{
        coin: query,
        socialVolume: casts.length,
        socialDominance: 0,
        sentiment: 0, // would need NLP analysis
        sentimentLabel: 'neutral',
        galaxyScore: 0,
        altRank: 0,
        tweetVolume24h: 0,
        redditVolume24h: 0,
        newsVolume24h: 0,
        urlShares24h: casts.length,
        contributors: new Set(casts.map((c: any) => c.author?.fid)).size,
        timestamp: new Date().toISOString(),
      }],
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 2. Create Fear & Greed Adapter

Create `src/lib/providers/adapters/fear-greed/`:

#### `src/lib/providers/adapters/fear-greed/alternative-me.ts`

```typescript
export interface FearGreedData {
  value: number;               // 0-100
  classification: string;      // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  timestamp: string;
  previousClose: number;
  weekAgo: number;
  monthAgo: number;
}

// Alternative.me Fear & Greed Index — free, no key needed
// https://api.alternative.me/fng/?limit=30
export const alternativeMeFearGreedProvider: DataProvider<FearGreedData> = {
  name: 'alternative-me-fear-greed',
  category: 'fear-greed',
  priority: 1,
  weight: 0.5,
  baseUrl: 'https://api.alternative.me/fng',
};
```

#### `src/lib/providers/adapters/fear-greed/composite.ts`

```typescript
// Build a composite fear/greed from multiple signals:
// - Alternative.me index
// - Social sentiment (from social-metrics chain)
// - Market volatility (BTC 30d realized vol)
// - Funding rates (from funding-rate chain)
// - Exchange flows (from on-chain chain)
// Weighted average produces a more robust signal
```

### 3. Register Provider Chains

```typescript
// src/lib/providers/chains/social.ts

export const socialMetricsChain = createProviderChain('social-metrics', {
  providers: [
    lunarcrushSocialProvider,
    santimentSocialProvider,
    cryptopanicSocialProvider,
    farcasterSocialProvider,
  ],
  strategy: 'broadcast',          // collect signals from all platforms
  ttl: 120_000,                  // 2min cache
});

export const fearGreedChain = createProviderChain('fear-greed', {
  providers: [alternativeMeFearGreedProvider],
  strategy: 'fallback',
  ttl: 300_000,                  // 5min cache
});
```

### Environment Variables

```bash
# Existing
LUNARCRUSH_API_KEY=             # Social metrics (free tier available at lunarcrush.com)
DISCORD_BOT_TOKEN=              # Discord channel monitoring
TELEGRAM_BOT_TOKEN=             # Telegram monitoring

# New — sign up for these
SANTIMENT_API_KEY=              # On-chain + social analytics (free tier at santiment.net)
CRYPTOPANIC_API_KEY=            # News sentiment (free tier at cryptopanic.com/developers/api)
NEYNAR_API_KEY=                 # Farcaster/Warpcast data (free tier at neynar.com, 100 req/min)
```

## Success Criteria

- [ ] 4 social-metrics adapters (LunarCrush, Santiment, CryptoPanic, Farcaster)
- [ ] 1 fear-greed adapter (Alternative.me) plus composite builder
- [ ] Provider chains with `broadcast` strategy for social data
- [ ] Existing `/api/social/*` routes migrated to use chains
- [ ] Sentiment normalization: all providers output -1 to 1 scale
- [ ] Social volume aggregation: deduplicated cross-platform counts
- [ ] Fear & Greed composite incorporates social + market + on-chain signals
- [ ] Unit tests with mocked GraphQL/REST responses
- [ ] Rate limiting respects per-provider limits (especially CryptoPanic, Neynar)
