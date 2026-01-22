/**
 * Market Data Service for Free Crypto News
 * Adapted from https://github.com/nirholas/crypto-market-data
 * 
 * Integrates CoinGecko and DeFiLlama APIs for live market data
 * 
 * @module market-data
 * @description Comprehensive cryptocurrency market data service with caching,
 * rate limiting, and Edge Runtime compatibility.
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';
const ALTERNATIVE_ME = 'https://api.alternative.me';

// =============================================================================
// CACHE TTL CONFIGURATION (in seconds)
// =============================================================================

/**
 * Cache duration settings based on data volatility
 */
export const CACHE_TTL = {
  /** Live prices - 30 seconds */
  prices: 30,
  /** 24h historical data - 1 minute */
  historical_1d: 60,
  /** Weekly historical data - 5 minutes */
  historical_7d: 300,
  /** Monthly historical data - 15 minutes */
  historical_30d: 900,
  /** 90+ day historical data - 30 minutes */
  historical_90d: 1800,
  /** Exchange/ticker data - 2 minutes */
  tickers: 120,
  /** Static data (categories, coin list) - 1 hour */
  static: 3600,
  /** Search results - 5 minutes */
  search: 300,
  /** Developer/community data - 30 minutes */
  social: 1800,
  /** Global data - 5 minutes */
  global: 300,
};

// =============================================================================
// TYPES - BASIC
// =============================================================================

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  last_updated: string;
  image?: string;
  sparkline_in_7d?: { price: number[] };
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  small: string;
  large: string;
  price_btc: number;
  score: number;
}

export interface GlobalMarketData {
  active_cryptocurrencies: number;
  markets: number;
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface FearGreedIndex {
  value: number;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface ProtocolTVL {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  category: string;
  logo: string;
  url: string;
}

export interface ChainTVL {
  name: string;
  tvl: number;
  tokenSymbol: string;
  gecko_id: string;
  chainId: number;
}

export interface MarketOverview {
  global: GlobalMarketData;
  fearGreed: FearGreedIndex | null;
  topCoins: TokenPrice[];
  trending: TrendingCoin[];
  btcPrice: number;
  ethPrice: number;
  btcChange24h: number;
  ethChange24h: number;
}

export interface SimplePrices {
  bitcoin: { usd: number; usd_24h_change: number };
  ethereum: { usd: number; usd_24h_change: number };
  solana: { usd: number; usd_24h_change: number };
}

// =============================================================================
// TYPES - HISTORICAL DATA
// =============================================================================

/**
 * Historical price data with market caps and volumes
 */
export interface HistoricalData {
  /** Array of [timestamp, price] tuples */
  prices: [number, number][];
  /** Array of [timestamp, market_cap] tuples */
  market_caps: [number, number][];
  /** Array of [timestamp, volume] tuples */
  total_volumes: [number, number][];
}

/**
 * OHLC candlestick data point
 */
export interface OHLCData {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Opening price */
  open: number;
  /** Highest price */
  high: number;
  /** Lowest price */
  low: number;
  /** Closing price */
  close: number;
}

/**
 * Historical price snapshot for a specific date
 */
export interface HistoricalSnapshot {
  /** Coin ID */
  id: string;
  /** Coin symbol */
  symbol: string;
  /** Coin name */
  name: string;
  /** Image URLs */
  image: {
    thumb: string;
    small: string;
  };
  /** Market data at the snapshot time */
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
  };
}

// =============================================================================
// TYPES - EXCHANGE & TICKER DATA
// =============================================================================

/**
 * Exchange trading pair data
 */
export interface TickerData {
  /** Name of the coin */
  name: string;
  /** Array of trading pairs */
  tickers: Ticker[];
}

/**
 * Individual trading pair ticker
 */
export interface Ticker {
  /** Base currency symbol */
  base: string;
  /** Target/quote currency symbol */
  target: string;
  /** Exchange information */
  market: {
    identifier: string;
    name: string;
    logo: string;
    has_trading_incentive: boolean;
  };
  /** Last traded price */
  last: number;
  /** 24h trading volume in base currency */
  volume: number;
  /** Trust score indicator */
  trust_score: 'green' | 'yellow' | 'red' | null;
  /** Bid-ask spread percentage */
  bid_ask_spread_percentage: number;
  /** Direct trade URL */
  trade_url: string;
  /** Price converted to common currencies */
  converted_last: {
    usd: number;
    btc: number;
    eth: number;
  };
  /** Volume converted to common currencies */
  converted_volume: {
    usd: number;
    btc: number;
    eth: number;
  };
  /** Timestamp of last trade */
  timestamp: string;
  /** Timestamp of last fetch */
  last_fetch_at: string;
  /** Whether price is anomalous */
  is_anomaly: boolean;
  /** Whether price is stale */
  is_stale: boolean;
}

/**
 * Cryptocurrency exchange information
 */
export interface Exchange {
  /** Exchange identifier */
  id: string;
  /** Exchange display name */
  name: string;
  /** Year the exchange was established */
  year_established: number | null;
  /** Country of incorporation */
  country: string | null;
  /** Exchange description */
  description: string;
  /** Exchange website URL */
  url: string;
  /** Exchange logo URL */
  image: string;
  /** Whether exchange has trading incentives */
  has_trading_incentive: boolean;
  /** Trust score (1-10) */
  trust_score: number;
  /** Trust score ranking */
  trust_score_rank: number;
  /** 24h trading volume in BTC */
  trade_volume_24h_btc: number;
  /** Normalized 24h trading volume in BTC */
  trade_volume_24h_btc_normalized: number;
}

/**
 * Detailed exchange information with tickers
 */
export interface ExchangeDetails extends Exchange {
  /** Facebook URL */
  facebook_url: string;
  /** Reddit URL */
  reddit_url: string;
  /** Telegram URL */
  telegram_url: string;
  /** Slack URL */
  slack_url: string;
  /** Other URL 1 */
  other_url_1: string;
  /** Other URL 2 */
  other_url_2: string;
  /** Twitter handle */
  twitter_handle: string;
  /** Whether exchange is centralized */
  centralized: boolean;
  /** Public notice */
  public_notice: string;
  /** Alert notice */
  alert_notice: string;
  /** Trading pairs tickers */
  tickers: Ticker[];
}

// =============================================================================
// TYPES - CATEGORIES
// =============================================================================

/**
 * Cryptocurrency category (e.g., DeFi, Gaming, L1)
 */
export interface Category {
  /** Category identifier */
  category_id: string;
  /** Category display name */
  name: string;
  /** Total market cap of category */
  market_cap: number;
  /** 24h market cap change percentage */
  market_cap_change_24h: number;
  /** Category description */
  content: string;
  /** Image URLs of top 3 coins in category */
  top_3_coins: string[];
  /** 24h trading volume */
  volume_24h: number;
  /** Last updated timestamp */
  updated_at: string;
}

// =============================================================================
// TYPES - SEARCH
// =============================================================================

/**
 * Search result from CoinGecko
 */
export interface SearchResult {
  /** Matching coins */
  coins: SearchCoin[];
  /** Matching exchanges */
  exchanges: SearchExchange[];
  /** Matching categories */
  categories: SearchCategory[];
  /** Matching NFTs */
  nfts: SearchNFT[];
}

/**
 * Coin search result
 */
export interface SearchCoin {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

/**
 * Exchange search result
 */
export interface SearchExchange {
  id: string;
  name: string;
  market_type: string;
  thumb: string;
  large: string;
}

/**
 * Category search result
 */
export interface SearchCategory {
  id: number;
  name: string;
}

/**
 * NFT search result
 */
export interface SearchNFT {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

// =============================================================================
// TYPES - COMPARE
// =============================================================================

/**
 * Coin comparison data
 */
export interface CompareData {
  coins: CompareCoin[];
  comparison_date: string;
}

/**
 * Individual coin data for comparison
 */
export interface CompareCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
}

// =============================================================================
// TYPES - COIN LIST
// =============================================================================

/**
 * Basic coin information for autocomplete/lists
 */
export interface CoinListItem {
  /** CoinGecko coin ID */
  id: string;
  /** Ticker symbol */
  symbol: string;
  /** Coin name */
  name: string;
}

// =============================================================================
// TYPES - DEVELOPER & COMMUNITY DATA
// =============================================================================

/**
 * Developer/GitHub statistics for a coin
 */
export interface DeveloperData {
  /** Number of repository forks */
  forks: number;
  /** Number of repository stars */
  stars: number;
  /** Number of repository subscribers/watchers */
  subscribers: number;
  /** Total number of issues */
  total_issues: number;
  /** Number of closed issues */
  closed_issues: number;
  /** Number of merged pull requests */
  pull_requests_merged: number;
  /** Number of pull request contributors */
  pull_request_contributors: number;
  /** Commit count in last 4 weeks */
  commit_count_4_weeks: number;
  /** Daily commit activity for last 4 weeks */
  last_4_weeks_commit_activity_series: number[];
  /** Code additions in last 4 weeks */
  code_additions_deletions_4_weeks: {
    additions: number | null;
    deletions: number | null;
  };
}

/**
 * Community/social statistics for a coin
 */
export interface CommunityData {
  /** Twitter follower count */
  twitter_followers: number | null;
  /** Reddit subscriber count */
  reddit_subscribers: number | null;
  /** Average Reddit posts in last 48h */
  reddit_average_posts_48h: number;
  /** Average Reddit comments in last 48h */
  reddit_average_comments_48h: number;
  /** Reddit active accounts in last 48h */
  reddit_accounts_active_48h: number;
  /** Telegram channel user count */
  telegram_channel_user_count: number | null;
  /** Facebook likes */
  facebook_likes: number | null;
}

// =============================================================================
// TYPES - GLOBAL DEFI
// =============================================================================

/**
 * Global DeFi market statistics
 */
export interface GlobalDeFi {
  /** Total DeFi market cap */
  defi_market_cap: string;
  /** ETH market cap */
  eth_market_cap: string;
  /** DeFi to ETH ratio */
  defi_to_eth_ratio: string;
  /** DeFi 24h trading volume */
  trading_volume_24h: string;
  /** DeFi dominance percentage */
  defi_dominance: string;
  /** Top DeFi coin name */
  top_coin_name: string;
  /** Top DeFi coin DeFi dominance */
  top_coin_defi_dominance: number;
}

// =============================================================================
// TYPES - DERIVATIVES
// =============================================================================

/**
 * Derivatives market ticker
 */
export interface DerivativeTicker {
  /** Exchange/market identifier */
  market: string;
  /** Trading pair symbol */
  symbol: string;
  /** Index ID */
  index_id: string;
  /** Current price */
  price: string;
  /** Price percentage change in 24h */
  price_percentage_change_24h: number;
  /** Contract type (perpetual, futures) */
  contract_type: string;
  /** Index price */
  index: number | null;
  /** Basis percentage */
  basis: number;
  /** Spread percentage */
  spread: number | null;
  /** Funding rate */
  funding_rate: number;
  /** Open interest in USD */
  open_interest: number | null;
  /** 24h trading volume */
  volume_24h: number;
  /** Last traded timestamp */
  last_traded_at: number;
  /** Expiry date (for futures) */
  expired_at: string | null;
}

// =============================================================================
// CACHE (Smart caching with variable TTL)
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleTimestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data with stale-while-revalidate support
 * @param key - Cache key
 * @returns Cached data or null if not found/expired
 */
function getCached<T>(key: string): { data: T; isStale: boolean } | null {
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!cached) {
    return null;
  }
  
  const now = Date.now();
  const isExpired = now - cached.timestamp > cached.ttl * 1000;
  const isStale = now - cached.timestamp > cached.staleTimestamp * 1000;
  
  // If completely expired (past stale window), return null
  if (isExpired && now - cached.timestamp > cached.ttl * 2 * 1000) {
    cache.delete(key);
    return null;
  }
  
  return { data: cached.data, isStale };
}

/**
 * Set cache with variable TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds
 */
function setCache<T>(key: string, data: T, ttlSeconds: number = CACHE_TTL.prices): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds,
    staleTimestamp: ttlSeconds * 0.8, // Mark as stale at 80% of TTL
  });
}

/**
 * Get appropriate cache TTL based on days parameter for historical data
 */
function getHistoricalCacheTTL(days: number): number {
  if (days <= 1) return CACHE_TTL.historical_1d;
  if (days <= 7) return CACHE_TTL.historical_7d;
  if (days <= 30) return CACHE_TTL.historical_30d;
  return CACHE_TTL.historical_90d;
}

// =============================================================================
// RATE LIMITING (CoinGecko free tier: ~10-30 calls/minute)
// =============================================================================

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  retryAfter: number;
}

const rateLimitState: RateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  retryAfter: 0,
};

const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 25; // Conservative limit for free tier

/**
 * Check if we can make a request based on rate limiting
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  
  // Check if we're in a retry backoff period
  if (rateLimitState.retryAfter > now) {
    return false;
  }
  
  // Reset window if expired
  if (now - rateLimitState.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = now;
  }
  
  return rateLimitState.requestCount < MAX_REQUESTS_PER_WINDOW;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(): void {
  rateLimitState.requestCount++;
}

/**
 * Handle rate limit error with exponential backoff
 */
function handleRateLimitError(retryAfterHeader?: string): void {
  const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
  const backoffMs = Math.min(retryAfterSeconds * 1000, 120000); // Max 2 minutes
  rateLimitState.retryAfter = Date.now() + backoffMs;
  console.warn(`Rate limited. Backing off for ${backoffMs / 1000} seconds`);
}

// =============================================================================
// FETCH HELPERS
// =============================================================================

/**
 * Custom error for API failures
 */
export class MarketDataError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRateLimited: boolean = false
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}

/**
 * Fetch with timeout, rate limiting, and error handling
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Response object
 */
async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  // Check rate limit before making request
  if (!canMakeRequest()) {
    throw new MarketDataError('Rate limit exceeded. Please try again later.', 429, true);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    recordRequest();
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FreeCryptoNews/2.0',
      },
      next: { revalidate: 60 }, // Next.js cache for 60 seconds
    });
    
    // Handle rate limiting from API
    if (response.status === 429) {
      handleRateLimitError(response.headers.get('retry-after') || undefined);
      throw new MarketDataError('Rate limited by CoinGecko API', 429, true);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with caching and stale-while-revalidate pattern
 * @param url - URL to fetch
 * @param cacheKey - Key for caching
 * @param ttl - Cache TTL in seconds
 * @param fallbackValue - Value to return on error
 */
async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  ttl: number,
  fallbackValue: T
): Promise<T> {
  // Check cache first
  const cached = getCached<T>(cacheKey);
  
  if (cached) {
    // If data is stale, trigger background refresh
    if (cached.isStale) {
      // Background refresh (non-blocking)
      fetchAndCache<T>(url, cacheKey, ttl).catch(() => {
        // Silently fail on background refresh
      });
    }
    return cached.data;
  }
  
  // No cache, fetch fresh data
  return fetchAndCache<T>(url, cacheKey, ttl, fallbackValue);
}

/**
 * Fetch and cache data
 */
async function fetchAndCache<T>(
  url: string,
  cacheKey: string,
  ttl: number,
  fallbackValue?: T
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new MarketDataError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }
    
    const data = await response.json() as T;
    setCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    // If we have cached stale data, return it on error
    const cached = getCached<T>(cacheKey);
    if (cached) {
      return cached.data;
    }
    
    // Return fallback value if provided
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw error;
  }
}

// =============================================================================
// COINGECKO API
// =============================================================================

/**
 * Get simple prices for major coins (fast endpoint)
 * @returns Simple price data for BTC, ETH, and SOL
 */
export async function getSimplePrices(): Promise<SimplePrices> {
  const cacheKey = 'simple-prices';
  const cached = getCached<SimplePrices>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    
    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.prices);
    return data;
  } catch (error) {
    console.error('Error fetching simple prices:', error);
    // Return fallback data
    return {
      bitcoin: { usd: 0, usd_24h_change: 0 },
      ethereum: { usd: 0, usd_24h_change: 0 },
      solana: { usd: 0, usd_24h_change: 0 },
    };
  }
}

/**
 * Get top coins by market cap
 * @param limit - Number of coins to fetch (max 250)
 * @returns Array of top coins sorted by market cap
 */
export async function getTopCoins(limit = 50): Promise<TokenPrice[]> {
  const cacheKey = `top-coins-${limit}`;
  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=7d`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch top coins');
    }
    
    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.prices);
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
}

/**
 * Get trending coins
 * @returns Array of trending coins
 */
export async function getTrending(): Promise<TrendingCoin[]> {
  const cacheKey = 'trending';
  const cached = getCached<TrendingCoin[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/search/trending`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending');
    }
    
    const data = await response.json();
    const trending = data.coins.map((c: { item: TrendingCoin }) => c.item);
    setCache(cacheKey, trending, CACHE_TTL.global);
    return trending;
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
}

/**
 * Get global market data
 * @returns Global cryptocurrency market statistics
 */
export async function getGlobalMarketData(): Promise<GlobalMarketData | null> {
  const cacheKey = 'global';
  const cached = getCached<GlobalMarketData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/global`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch global data');
    }
    
    const data = await response.json();
    setCache(cacheKey, data.data, CACHE_TTL.global);
    return data.data;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    return null;
  }
}

/**
 * Get coin details
 * @param coinId - CoinGecko coin ID
 * @returns Detailed coin information
 */
export async function getCoinDetails(coinId: string) {
  const cacheKey = `coin-${coinId}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch coin details');
    }
    
    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error('Error fetching coin details:', error);
    return null;
  }
}

// =============================================================================
// ALTERNATIVE.ME API (Fear & Greed Index)
// =============================================================================

/**
 * Get Fear & Greed Index
 * @returns Current fear and greed index data
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex | null> {
  const cacheKey = 'fear-greed';
  const cached = getCached<FearGreedIndex>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${ALTERNATIVE_ME}/fng/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch fear & greed index');
    }
    
    const data = await response.json();
    const fng = data.data?.[0];
    if (fng) {
      setCache(cacheKey, fng, CACHE_TTL.global);
    }
    return fng || null;
  } catch (error) {
    console.error('Error fetching fear & greed index:', error);
    return null;
  }
}

// =============================================================================
// DEFILLAMA API
// =============================================================================

/**
 * Get top DeFi protocols by TVL
 * @param limit - Number of protocols to return
 * @returns Array of protocols sorted by TVL
 */
export async function getTopProtocols(limit = 20): Promise<ProtocolTVL[]> {
  const cacheKey = `protocols-${limit}`;
  const cached = getCached<ProtocolTVL[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${DEFILLAMA_BASE}/protocols`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch protocols');
    }
    
    const data = await response.json();
    const top = data
      .filter((p: ProtocolTVL) => p.tvl > 0)
      .sort((a: ProtocolTVL, b: ProtocolTVL) => b.tvl - a.tvl)
      .slice(0, limit);
    
    setCache(cacheKey, top, CACHE_TTL.global);
    return top;
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return [];
  }
}

/**
 * Get top chains by TVL
 * @param limit - Number of chains to return
 * @returns Array of chains sorted by TVL
 */
export async function getTopChains(limit = 20): Promise<ChainTVL[]> {
  const cacheKey = `chains-${limit}`;
  const cached = getCached<ChainTVL[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${DEFILLAMA_BASE}/v2/chains`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chains');
    }
    
    const data = await response.json();
    const top = data
      .sort((a: ChainTVL, b: ChainTVL) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);
    
    setCache(cacheKey, top, CACHE_TTL.global);
    return top;
  } catch (error) {
    console.error('Error fetching chains:', error);
    return [];
  }
}

// =============================================================================
// COMBINED MARKET OVERVIEW
// =============================================================================

/**
 * Get comprehensive market overview (combines multiple endpoints)
 */
export async function getMarketOverview(): Promise<MarketOverview> {
  const [prices, global, fearGreed, topCoins, trending] = await Promise.all([
    getSimplePrices(),
    getGlobalMarketData(),
    getFearGreedIndex(),
    getTopCoins(10),
    getTrending(),
  ]);

  return {
    global: global || {
      active_cryptocurrencies: 0,
      markets: 0,
      total_market_cap: {},
      total_volume: {},
      market_cap_percentage: {},
      market_cap_change_percentage_24h_usd: 0,
      updated_at: Date.now(),
    },
    fearGreed,
    topCoins,
    trending,
    btcPrice: prices.bitcoin?.usd || 0,
    ethPrice: prices.ethereum?.usd || 0,
    btcChange24h: prices.bitcoin?.usd_24h_change || 0,
    ethChange24h: prices.ethereum?.usd_24h_change || 0,
  };
}

// =============================================================================
// HISTORICAL DATA
// =============================================================================

/**
 * Get historical price data for a coin
 * @param coinId - CoinGecko coin ID
 * @param days - Number of days (1, 7, 14, 30, 90, 180, 365, or 'max')
 * @param interval - Data interval: 'minutely' (1d), 'hourly' (1-90d), 'daily' (90d+)
 * @returns Historical price, market cap, and volume data
 */
export async function getHistoricalPrices(
  coinId: string,
  days: number | 'max',
  interval?: 'minutely' | 'hourly' | 'daily'
): Promise<HistoricalData> {
  const daysParam = days === 'max' ? 'max' : days.toString();
  const intervalParam = interval ? `&interval=${interval}` : '';
  const cacheKey = `historical-${coinId}-${daysParam}-${interval || 'auto'}`;
  const cacheTTL = typeof days === 'number' ? getHistoricalCacheTTL(days) : CACHE_TTL.historical_90d;
  
  const cached = getCached<HistoricalData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${daysParam}${intervalParam}`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch historical prices', response.status);
    }
    
    const data: HistoricalData = await response.json();
    setCache(cacheKey, data, cacheTTL);
    return data;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return { prices: [], market_caps: [], total_volumes: [] };
  }
}

/**
 * Get OHLC candlestick data for a coin
 * @param coinId - CoinGecko coin ID
 * @param days - Number of days (1, 7, 14, 30, 90, 180, 365)
 * @returns Array of OHLC data points
 */
export async function getOHLC(coinId: string, days: number): Promise<OHLCData[]> {
  // Validate days parameter (CoinGecko only supports specific values)
  const validDays = [1, 7, 14, 30, 90, 180, 365];
  const normalizedDays = validDays.reduce((prev, curr) => 
    Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
  );
  
  const cacheKey = `ohlc-${coinId}-${normalizedDays}`;
  const cacheTTL = getHistoricalCacheTTL(normalizedDays);
  
  const cached = getCached<OHLCData[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${normalizedDays}`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch OHLC data', response.status);
    }
    
    // CoinGecko returns [[timestamp, open, high, low, close], ...]
    const rawData: [number, number, number, number, number][] = await response.json();
    const ohlcData: OHLCData[] = rawData.map(([timestamp, open, high, low, close]) => ({
      timestamp,
      open,
      high,
      low,
      close,
    }));
    
    setCache(cacheKey, ohlcData, cacheTTL);
    return ohlcData;
  } catch (error) {
    console.error('Error fetching OHLC data:', error);
    return [];
  }
}

/**
 * Get historical price at a specific date
 * @param coinId - CoinGecko coin ID
 * @param date - Date in DD-MM-YYYY format
 * @returns Historical snapshot data
 */
export async function getHistoricalPrice(
  coinId: string,
  date: string
): Promise<HistoricalSnapshot | null> {
  const cacheKey = `historical-snapshot-${coinId}-${date}`;
  
  const cached = getCached<HistoricalSnapshot>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/history?date=${date}&localization=false`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch historical price', response.status);
    }
    
    const data: HistoricalSnapshot = await response.json();
    // Historical snapshots are immutable, cache for a long time
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return null;
  }
}

// =============================================================================
// EXCHANGE & TICKER DATA
// =============================================================================

/**
 * Get trading pairs/tickers for a coin
 * @param coinId - CoinGecko coin ID
 * @param page - Page number for pagination
 * @returns Ticker data with exchange information
 */
export async function getCoinTickers(
  coinId: string,
  page: number = 1
): Promise<TickerData> {
  const cacheKey = `tickers-${coinId}-${page}`;
  
  const cached = getCached<TickerData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/tickers?page=${page}&include_exchange_logo=true&order=volume_desc`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch coin tickers', response.status);
    }
    
    const data: TickerData = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error('Error fetching coin tickers:', error);
    return { name: coinId, tickers: [] };
  }
}

/**
 * Get list of all exchanges
 * @param perPage - Number of exchanges per page (max 250)
 * @param page - Page number
 * @returns Array of exchanges
 */
export async function getExchanges(
  perPage: number = 100,
  page: number = 1
): Promise<Exchange[]> {
  const cacheKey = `exchanges-${perPage}-${page}`;
  
  const cached = getCached<Exchange[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/exchanges?per_page=${perPage}&page=${page}`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch exchanges', response.status);
    }
    
    const data: Exchange[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    return [];
  }
}

/**
 * Get detailed exchange information with tickers
 * @param exchangeId - CoinGecko exchange ID
 * @returns Detailed exchange information
 */
export async function getExchangeDetails(
  exchangeId: string
): Promise<ExchangeDetails | null> {
  const cacheKey = `exchange-${exchangeId}`;
  
  const cached = getCached<ExchangeDetails>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/exchanges/${exchangeId}`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch exchange details', response.status);
    }
    
    const data: ExchangeDetails = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error('Error fetching exchange details:', error);
    return null;
  }
}

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * Get list of all coin categories (DeFi, Gaming, L1, L2, etc.)
 * @returns Array of categories with market data
 */
export async function getCategories(): Promise<Category[]> {
  const cacheKey = 'categories';
  
  const cached = getCached<Category[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/categories`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch categories', response.status);
    }
    
    const data: Category[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get coins in a specific category
 * @param categoryId - Category ID from getCategories()
 * @param perPage - Number of coins per page
 * @param page - Page number
 * @returns Array of coins in the category
 */
export async function getCategoryCoins(
  categoryId: string,
  perPage: number = 100,
  page: number = 1
): Promise<TokenPrice[]> {
  const cacheKey = `category-coins-${categoryId}-${perPage}-${page}`;
  
  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&category=${encodeURIComponent(categoryId)}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch category coins', response.status);
    }
    
    const data: TokenPrice[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error('Error fetching category coins:', error);
    return [];
  }
}

// =============================================================================
// SEARCH & DISCOVERY
// =============================================================================

/**
 * Search for coins, exchanges, and categories
 * @param query - Search query string
 * @returns Search results across different asset types
 */
export async function searchCoins(query: string): Promise<SearchResult> {
  if (!query || query.length < 2) {
    return { coins: [], exchanges: [], categories: [], nfts: [] };
  }
  
  const cacheKey = `search-${query.toLowerCase()}`;
  
  const cached = getCached<SearchResult>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to search coins', response.status);
    }
    
    const data: SearchResult = await response.json();
    setCache(cacheKey, data, CACHE_TTL.search);
    return data;
  } catch (error) {
    console.error('Error searching coins:', error);
    return { coins: [], exchanges: [], categories: [], nfts: [] };
  }
}

/**
 * Compare multiple coins side by side
 * @param coinIds - Array of CoinGecko coin IDs (max 25)
 * @returns Comparison data for all coins
 */
export async function compareCoins(coinIds: string[]): Promise<CompareData> {
  if (coinIds.length === 0) {
    return { coins: [], comparison_date: new Date().toISOString() };
  }
  
  // Limit to 25 coins to avoid API limits
  const limitedIds = coinIds.slice(0, 25);
  const cacheKey = `compare-${limitedIds.sort().join(',')}`;
  
  const cached = getCached<CompareData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${limitedIds.join(',')}&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=7d,30d`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to compare coins', response.status);
    }
    
    const rawData = await response.json();
    const coins: CompareCoin[] = rawData.map((coin: Record<string, unknown>) => ({
      id: coin.id as string,
      symbol: coin.symbol as string,
      name: coin.name as string,
      image: coin.image as string,
      current_price: coin.current_price as number,
      market_cap: coin.market_cap as number,
      market_cap_rank: coin.market_cap_rank as number,
      total_volume: coin.total_volume as number,
      price_change_percentage_24h: coin.price_change_percentage_24h as number,
      price_change_percentage_7d: coin.price_change_percentage_7d_in_currency as number || 0,
      price_change_percentage_30d: coin.price_change_percentage_30d_in_currency as number || 0,
      circulating_supply: coin.circulating_supply as number,
      total_supply: coin.total_supply as number | null,
      max_supply: coin.max_supply as number | null,
      ath: coin.ath as number,
      ath_change_percentage: coin.ath_change_percentage as number,
      ath_date: coin.ath_date as string,
      atl: coin.atl as number,
      atl_change_percentage: coin.atl_change_percentage as number,
      atl_date: coin.atl_date as string,
    }));
    
    const result: CompareData = {
      coins,
      comparison_date: new Date().toISOString(),
    };
    
    setCache(cacheKey, result, CACHE_TTL.prices);
    return result;
  } catch (error) {
    console.error('Error comparing coins:', error);
    return { coins: [], comparison_date: new Date().toISOString() };
  }
}

/**
 * Get list of all coins (for autocomplete)
 * @returns Array of all coins with basic info
 */
export async function getCoinsList(): Promise<CoinListItem[]> {
  const cacheKey = 'coins-list';
  
  const cached = getCached<CoinListItem[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/list`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch coins list', response.status);
    }
    
    const data: CoinListItem[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error('Error fetching coins list:', error);
    return [];
  }
}

// =============================================================================
// DEVELOPER & COMMUNITY DATA
// =============================================================================

/**
 * Get developer/GitHub statistics for a coin
 * @param coinId - CoinGecko coin ID
 * @returns Developer data including commits, forks, stars
 */
export async function getCoinDeveloperData(
  coinId: string
): Promise<DeveloperData | null> {
  const cacheKey = `developer-${coinId}`;
  
  const cached = getCached<DeveloperData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=true&sparkline=false`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch developer data', response.status);
    }
    
    const data = await response.json();
    const developerData: DeveloperData = data.developer_data || {
      forks: 0,
      stars: 0,
      subscribers: 0,
      total_issues: 0,
      closed_issues: 0,
      pull_requests_merged: 0,
      pull_request_contributors: 0,
      commit_count_4_weeks: 0,
      last_4_weeks_commit_activity_series: [],
      code_additions_deletions_4_weeks: { additions: null, deletions: null },
    };
    
    setCache(cacheKey, developerData, CACHE_TTL.social);
    return developerData;
  } catch (error) {
    console.error('Error fetching developer data:', error);
    return null;
  }
}

/**
 * Get community/social statistics for a coin
 * @param coinId - CoinGecko coin ID
 * @returns Community data including Twitter, Reddit, Telegram stats
 */
export async function getCoinCommunityData(
  coinId: string
): Promise<CommunityData | null> {
  const cacheKey = `community-${coinId}`;
  
  const cached = getCached<CommunityData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch community data', response.status);
    }
    
    const data = await response.json();
    const communityData: CommunityData = data.community_data || {
      twitter_followers: null,
      reddit_subscribers: null,
      reddit_average_posts_48h: 0,
      reddit_average_comments_48h: 0,
      reddit_accounts_active_48h: 0,
      telegram_channel_user_count: null,
      facebook_likes: null,
    };
    
    setCache(cacheKey, communityData, CACHE_TTL.social);
    return communityData;
  } catch (error) {
    console.error('Error fetching community data:', error);
    return null;
  }
}

// =============================================================================
// GLOBAL DEFI DATA
// =============================================================================

/**
 * Get global DeFi market statistics
 * @returns Global DeFi market data
 */
export async function getGlobalDeFiData(): Promise<GlobalDeFi | null> {
  const cacheKey = 'global-defi';
  
  const cached = getCached<GlobalDeFi>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/global/decentralized_finance_defi`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch global DeFi data', response.status);
    }
    
    const { data }: { data: GlobalDeFi } = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error('Error fetching global DeFi data:', error);
    return null;
  }
}

// =============================================================================
// DERIVATIVES DATA
// =============================================================================

/**
 * Get derivatives market tickers (futures, perpetuals)
 * @returns Array of derivatives tickers
 */
export async function getDerivativesTickers(): Promise<DerivativeTicker[]> {
  const cacheKey = 'derivatives-tickers';
  
  const cached = getCached<DerivativeTicker[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/derivatives`
    );
    
    if (!response.ok) {
      throw new MarketDataError('Failed to fetch derivatives tickers', response.status);
    }
    
    const data: DerivativeTicker[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error('Error fetching derivatives tickers:', error);
    return [];
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '$0.00';
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '0';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

export function formatPercent(num: number | null | undefined): string {
  if (num == null) return '0.00%';
  const sign = num >= 0 ? '+' : '';
  return sign + num.toFixed(2) + '%';
}

export function getFearGreedColor(value: number): string {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-500';
  if (value <= 55) return 'text-yellow-500';
  if (value <= 75) return 'text-lime-500';
  return 'text-green-500';
}

export function getFearGreedBgColor(value: number): string {
  if (value <= 25) return 'bg-red-500';
  if (value <= 45) return 'bg-orange-500';
  if (value <= 55) return 'bg-yellow-500';
  if (value <= 75) return 'bg-lime-500';
  return 'bg-green-500';
}
