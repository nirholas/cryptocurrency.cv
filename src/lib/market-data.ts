/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Market Data Service for Crypto Vision News
 * Adapted from https://github.com/nirholas/crypto-market-data
 *
 * Integrates multiple free APIs for live market data:
 * - CoinGecko     (primary — free without key, key optional for higher limits)
 * - CoinCap       (fallback for prices, trending, history, search — no key, any coin)
 * - CoinPaprika   (fallback for coin details + global market data — no key)
 * - Binance       (fallback for OHLC/klines + real-time prices — no key)
 * - CryptoCompare (fallback for real-time prices — no key on free tier)
 * - DeFiLlama     (DeFi TVL data — no key)
 * - Alternative.me (Fear & Greed — no key)
 *
 * @module market-data
 * @description Comprehensive cryptocurrency market data service with caching,
 * rate limiting, fallback sources, and Edge Runtime compatibility.
 */

import {
  COINGECKO_BASE,
  COINCAP_BASE,
  DEFILLAMA_BASE,
  ALTERNATIVE_ME_BASE,
  CRYPTOCOMPARE_BASE,
  BINANCE_BASE,
  COINPAPRIKA_BASE,
} from "./constants";

/**
 * Whether we are in a CI/build environment.
 * When true, all external API calls return empty/fallback data immediately
 * to prevent rate limiting during static page generation.
 */
const IS_BUILD =
  !!(process.env.VERCEL_ENV === "production" && process.env.CI) ||
  !!process.env.NEXT_PHASE?.includes("build");

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
  /** 90+ day historical data - 1 hour */
  historical_90d: 3600,
  /** Exchange/ticker data - 2 minutes */
  tickers: 120,
  /** Static data (categories, coin list) - 1 hour */
  static: 3600,
  /** Search results - 5 minutes */
  search: 300,
  /** Developer/community data - 30 minutes */
  social: 1800,
  /** Coin details / global data - 5 minutes */
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
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_60d_in_currency?: number;
  price_change_percentage_90d_in_currency?: number;
  price_change_percentage_200d_in_currency?: number;
  high_24h?: number;
  low_24h?: number;
  fully_diluted_valuation?: number | null;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
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
  /** Extended price data from CoinGecko API (may not always be present) */
  data?: {
    price?: number;
    price_btc?: string;
    price_change_percentage_24h?: {
      usd?: number;
      btc?: number;
    };
    market_cap?: string;
    market_cap_btc?: string;
    total_volume?: string;
    total_volume_btc?: string;
    sparkline?: string;
    content?: {
      title?: string;
      description?: string;
    } | null;
  };
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
  slug: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  category: string;
  logo: string;
  url: string;
  description?: string;
  twitter?: string;
  audit_links?: string[];
  mcap?: number;
  fdv?: number;
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
  [key: string]: { usd: number; usd_24h_change: number };
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
  trust_score: "green" | "yellow" | "red" | null;
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
const MAX_CACHE_ENTRIES = 500;

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
  const age = now - cached.timestamp;
  const isStale = age > cached.staleTimestamp * 1000;

  // NEVER hard-delete cache entries — serve stale data forever on errors.
  // Background refresh handles keeping data fresh when APIs are healthy.
  // Only mark as stale; callers decide whether to trigger a refresh.
  return { data: cached.data, isStale };
}

/**
 * Set cache with variable TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds
 */
function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.prices,
): void {
  // Evict oldest entry if at capacity
  if (cache.size >= MAX_CACHE_ENTRIES) {
    let oldest = Infinity;
    let oldestKey = '';
    for (const [k, v] of cache) {
      if (v.timestamp < oldest) {
        oldest = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
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
const MAX_REQUESTS_PER_WINDOW = 50; // Allow more requests since we have fallbacks

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
  const retryAfterSeconds = retryAfterHeader
    ? parseInt(retryAfterHeader, 10)
    : 60;
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
    public isRateLimited: boolean = false,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}

/**
 * Fetch with timeout, rate limiting, and error handling
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @param skipRateLimit - Skip internal rate limit check (for fallback APIs)
 * @returns Response object
 */
async function fetchWithTimeout(
  url: string,
  timeout = 10000,
  skipRateLimit = false,
): Promise<Response> {
  // Check rate limit before making request (only for primary CoinGecko API)
  if (!skipRateLimit && url.includes("coingecko.com") && !canMakeRequest()) {
    throw new MarketDataError(
      "Rate limit exceeded. Please try again later.",
      429,
      true,
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    if (!skipRateLimit && url.includes("coingecko.com")) {
      recordRequest();
    }

    // Build headers — include CoinGecko demo API key when available
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "FreeCryptoNews/2.0",
    };
    if (url.includes("coingecko.com") && process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      next: { revalidate: 120 }, // Next.js cache for 2 minutes
    } as RequestInit & { next?: { revalidate?: number } });

    // Handle rate limiting from API
    if (response.status === 429) {
      if (url.includes("coingecko.com")) {
        handleRateLimitError(response.headers.get("retry-after") || undefined);
      }
      throw new MarketDataError("Rate limited by API", 429, true);
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
  fallbackValue: T,
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
  fallbackValue?: T,
): Promise<T> {
  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new MarketDataError(
        `API request failed: ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as T;
    setCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    // Always serve stale cache on error — never show an error page.
    // Since getCached never hard-deletes, this will work even if the entry
    // is hours/days old. Stale data beats a broken page.
    const cached = getCached<T>(cacheKey);
    if (cached) {
      console.warn(
        `[cache] serving stale data for ${cacheKey} due to fetch error`,
      );
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
  if (IS_BUILD) {
    return {
      bitcoin: { usd: 0, usd_24h_change: 0 },
      ethereum: { usd: 0, usd_24h_change: 0 },
      solana: { usd: 0, usd_24h_change: 0 },
    };
  }
  const cacheKey = "simple-prices";
  const cached = getCached<SimplePrices>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.prices);
    return data;
  } catch (error) {
    console.error("Error fetching simple prices:", error);
    return await getSimplePricesFallback();
  }
}

/**
 * Get prices for specific coins
 * @param coinIds - Array of coin IDs to fetch
 * @param vsCurrency - Target currency (default: 'usd')
 * @returns Price data for requested coins
 */
export async function getPricesForCoins(
  coinIds: string[],
  vsCurrency = "usd",
): Promise<
  Record<string, { price: number; change_24h: number; last_updated: string }>
> {
  const ids = coinIds.join(",");
  const cacheKey = `prices-${ids}-${vsCurrency}`;
  const cached =
    getCached<
      Record<
        string,
        { price: number; change_24h: number; last_updated: string }
      >
    >(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_last_updated_at=true`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();

    // Transform to consistent format
    const result: Record<
      string,
      { price: number; change_24h: number; last_updated: string }
    > = {};
    for (const coinId of coinIds) {
      if (data[coinId]) {
        result[coinId] = {
          price: data[coinId][vsCurrency] || 0,
          change_24h: data[coinId][`${vsCurrency}_24h_change`] || 0,
          last_updated: data[coinId].last_updated_at
            ? new Date(data[coinId].last_updated_at * 1000).toISOString()
            : new Date().toISOString(),
        };
      }
    }

    setCache(cacheKey, result, CACHE_TTL.prices);
    return result;
  } catch (error) {
    console.error("Error fetching prices for coins:", error);
    // Try Binance fallback for major coins
    return await getPricesFromBinanceFallback(coinIds);
  }
}

/**
 * Fallback: Get prices from Binance API
 * Only works for coins with USDT pairs on Binance
 */
async function getPricesFromBinanceFallback(
  coinIds: string[],
): Promise<
  Record<string, { price: number; change_24h: number; last_updated: string }>
> {
  // Map CoinGecko IDs to Binance symbols
  const idToSymbol: Record<string, string> = {
    bitcoin: "BTCUSDT",
    ethereum: "ETHUSDT",
    solana: "SOLUSDT",
    ripple: "XRPUSDT",
    cardano: "ADAUSDT",
    dogecoin: "DOGEUSDT",
    polkadot: "DOTUSDT",
    avalanche: "AVAXUSDT",
    chainlink: "LINKUSDT",
    polygon: "MATICUSDT",
    uniswap: "UNIUSDT",
    litecoin: "LTCUSDT",
    "binance-coin": "BNBUSDT",
    tron: "TRXUSDT",
    shiba: "SHIBUSDT",
  };

  const result: Record<
    string,
    { price: number; change_24h: number; last_updated: string }
  > = {};

  try {
    // Fetch 24hr ticker for all symbols at once
    const response = await fetchWithTimeout(`${BINANCE_BASE}/ticker/24hr`);
    if (!response.ok) return {};

    const tickers = await response.json();
    type BinanceTicker = {
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    };
    const tickerMap = new Map<string, BinanceTicker>(
      tickers.map((t: BinanceTicker) => [t.symbol, t]),
    );

    for (const coinId of coinIds) {
      const symbol = idToSymbol[coinId];
      if (symbol && tickerMap.has(symbol)) {
        const ticker = tickerMap.get(symbol)!;
        result[coinId] = {
          price: parseFloat(ticker.lastPrice) || 0,
          change_24h: parseFloat(ticker.priceChangePercent) || 0,
          last_updated: new Date().toISOString(),
        };
      }
    }

    return result;
  } catch (error) {
    console.error("Binance fallback error:", error);
    return {};
  }
}

/**
 * Get real-time price from multiple sources with fallback
 * Uses Binance for real-time, CoinGecko for accuracy
 */
export async function getRealTimePrice(
  symbol: string,
): Promise<{ price: number; source: string } | null> {
  const symbolUpper = symbol.toUpperCase();
  const binanceSymbol = `${symbolUpper}USDT`;

  // Try Binance first (fastest, most real-time)
  try {
    const response = await fetchWithTimeout(
      `${BINANCE_BASE}/ticker/price?symbol=${binanceSymbol}`,
    );
    if (response.ok) {
      const data = await response.json();
      return { price: parseFloat(data.price), source: "binance" };
    }
  } catch {
    // Continue to fallback
  }

  // Try CryptoCompare as second option
  try {
    const response = await fetchWithTimeout(
      `${CRYPTOCOMPARE_BASE}/price?fsym=${symbolUpper}&tsyms=USD`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.USD) {
        return { price: data.USD, source: "cryptocompare" };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fall back to CoinGecko
  try {
    const idMap: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      XRP: "ripple",
      ADA: "cardano",
      DOGE: "dogecoin",
      DOT: "polkadot",
      AVAX: "avalanche",
      LINK: "chainlink",
    };
    const coinId = idMap[symbolUpper];
    if (coinId) {
      const response = await fetchWithTimeout(
        `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data[coinId]?.usd) {
          return { price: data[coinId].usd, source: "coingecko" };
        }
      }
    }
  } catch {
    // All sources failed
  }

  return null;
}

/**
 * Get top coins by market cap
 * @param limit - Number of coins to fetch (max 250)
 * @returns Array of top coins sorted by market cap
 */
export async function getTopCoins(limit = 50): Promise<TokenPrice[]> {
  if (IS_BUILD) return [];
  const cacheKey = `top-coins-${limit}`;
  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h%2C7d%2C30d%2C60d%2C90d`,
    );

    if (!response.ok) {
      // Try fallback to CoinPaprika
      console.warn("CoinGecko failed, trying CoinPaprika fallback...");
      return await getTopCoinsFallback(limit);
    }

    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.prices);
    return data;
  } catch (error) {
    console.error("Error fetching top coins from CoinGecko:", error);
    // Try fallback source
    return await getTopCoinsFallback(limit);
  }
}

/**
 * Fallback: Get top coins from CoinPaprika API
 * @param limit - Number of coins to fetch
 * @returns Array of top coins
 */
async function getTopCoinsFallback(limit: number): Promise<TokenPrice[]> {
  try {
    const response = await fetchWithTimeout(
      `${COINPAPRIKA_BASE}/tickers?limit=${limit}`,
    );

    if (!response.ok) {
      console.error("CoinPaprika fallback also failed");
      return [];
    }

    const data = await response.json();

    // Transform CoinPaprika format to our TokenPrice format
    interface CoinPaprikaCoin {
      id: string;
      symbol: string;
      name: string;
      rank: number;
      circulating_supply: number;
      total_supply: number | null;
      max_supply: number | null;
      quotes?: {
        USD?: {
          price: number;
          market_cap: number;
          volume_24h: number;
          percent_change_24h: number;
          percent_change_7d: number;
        };
      };
    }

    return data.map((coin: CoinPaprikaCoin) => ({
      id: coin.id,
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      current_price: coin.quotes?.USD?.price || 0,
      market_cap: coin.quotes?.USD?.market_cap || 0,
      market_cap_rank: coin.rank,
      total_volume: coin.quotes?.USD?.volume_24h || 0,
      price_change_24h:
        (coin.quotes?.USD?.price || 0) *
        ((coin.quotes?.USD?.percent_change_24h || 0) / 100),
      price_change_percentage_24h: coin.quotes?.USD?.percent_change_24h || 0,
      price_change_percentage_7d_in_currency:
        coin.quotes?.USD?.percent_change_7d || 0,
      circulating_supply: coin.circulating_supply || 0,
      total_supply: coin.total_supply,
      max_supply: coin.max_supply,
      ath: 0, // Not available from CoinPaprika
      ath_change_percentage: 0,
      last_updated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("CoinPaprika fallback error:", error);
    return [];
  }
}

/**
 * Get trending coins
 * @returns Array of trending coins
 */
export async function getTrending(): Promise<TrendingCoin[]> {
  if (IS_BUILD) return [];
  const cacheKey = "trending";
  const cached = getCached<TrendingCoin[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/search/trending`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trending");
    }

    const data = await response.json();
    const trending = data.coins.map((c: { item: TrendingCoin }) => c.item);
    setCache(cacheKey, trending, CACHE_TTL.global);
    return trending;
  } catch (error) {
    console.error("Error fetching trending:", error);
    return await getTrendingFallback();
  }
}

/**
 * Get global market data
 * @returns Global cryptocurrency market statistics
 */
export async function getGlobalMarketData(): Promise<GlobalMarketData | null> {
  if (IS_BUILD) return null;
  const cacheKey = "global";
  const cached = getCached<GlobalMarketData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/global`);

    if (!response.ok) {
      throw new Error("Failed to fetch global data");
    }

    const data = await response.json();
    setCache(cacheKey, data.data, CACHE_TTL.global);
    return data.data;
  } catch (error) {
    console.error("Error fetching global market data:", error);
    return await getGlobalMarketDataFallback();
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
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      5000, // 5 s — leaves budget for CoinPaprika + CoinCap fallbacks within maxDuration
    );

    if (!response.ok) {
      console.warn(`CoinGecko failed for ${coinId}, trying CoinPaprika...`);
      const paprikaResult = await getCoinDetailsFallback(coinId);
      if (paprikaResult) return paprikaResult;
      console.warn(`CoinPaprika failed for ${coinId}, trying CoinCap...`);
      return await getCoinDetailsCoinCap(coinId);
    }

    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error("Error fetching coin details:", error);
    // Try fallback chain: CoinPaprika → CoinCap
    const paprikaResult = await getCoinDetailsFallback(coinId);
    if (paprikaResult) return paprikaResult;
    return await getCoinDetailsCoinCap(coinId);
  }
}

/**
 * Fallback: Get coin details from CoinPaprika API
 * @param coinId - Coin ID (will be mapped to CoinPaprika format)
 * @returns Coin details in CoinGecko-compatible format
 */
async function getCoinDetailsFallback(
  coinId: string,
): Promise<Record<string, unknown> | null> {
  try {
    // CoinPaprika uses different IDs, try common mappings
    // Note: CoinCap fallback (below) covers ANY coin without a map.
    // This map just gives richer data (ATH, supply, links) from CoinPaprika for top coins.
    const paprikaIdMap: Record<string, string> = {
      // --- Tier 1: Top 10 ---
      bitcoin: "btc-bitcoin",
      ethereum: "eth-ethereum",
      tether: "usdt-tether",
      binancecoin: "bnb-binance-coin",
      "usd-coin": "usdc-usd-coin",
      ripple: "xrp-xrp",
      solana: "sol-solana",
      "staked-ether": "steth-lido-staked-ether",
      dogecoin: "doge-dogecoin",
      "the-open-network": "ton-the-open-network",
      toncoin: "ton-the-open-network",
      // --- Tier 2: Top 11-30 ---
      cardano: "ada-cardano",
      "shiba-inu": "shib-shiba-inu",
      "wrapped-bitcoin": "wbtc-wrapped-bitcoin",
      avalanche: "avax-avalanche",
      "avalanche-2": "avax-avalanche",
      chainlink: "link-chainlink",
      "bitcoin-cash": "bch-bitcoin-cash",
      polkadot: "dot-polkadot",
      litecoin: "ltc-litecoin",
      "leo-token": "leo-leo-token",
      uniswap: "uni-uniswap",
      "near-protocol": "near-near-protocol",
      near: "near-near-protocol",
      "dai-2": "dai-dai",
      dai: "dai-dai",
      polygon: "matic-polygon",
      "matic-network": "matic-polygon",
      pepe: "pepe-pepe",
      kaspa: "kas-kaspa",
      // --- Tier 3: Top 31-60 ---
      tron: "trx-tron",
      "internet-computer": "icp-internet-computer",
      "ethereum-classic": "etc-ethereum-classic",
      monero: "xmr-monero",
      cosmos: "atom-cosmos",
      aptos: "apt-aptos",
      stellar: "xlm-stellar",
      "render-token": "rndr-render-token",
      render: "rndr-render-token",
      "hedera-hashgraph": "hbar-hedera",
      hbar: "hbar-hedera",
      filecoin: "fil-filecoin",
      immutable: "imx-immutable-x",
      "immutable-x": "imx-immutable-x",
      optimism: "op-optimism",
      arbitrum: "arb-arbitrum",
      vechain: "vet-vechain",
      "injective-protocol": "inj-injective-protocol",
      injective: "inj-injective-protocol",
      "fetch-ai": "fet-fetch-ai",
      "artificial-superintelligence-alliance": "fet-fetch-ai",
      okb: "okb-okb",
      sui: "sui-sui",
      celestia: "tia-celestia",
      "sei-network": "sei-sei-network",
      sei: "sei-sei-network",
      algorand: "algo-algorand",
      // --- Tier 4: Top 61-100 ---
      apecoin: "ape-apecoin",
      aave: "aave-aave",
      maker: "mkr-maker",
      "the-sandbox": "sand-the-sandbox",
      decentraland: "mana-decentraland",
      "pancakeswap-token": "cake-pancakeswap",
      "curve-dao-token": "crv-curve-dao-token",
      "lido-dao": "ldo-lido-dao",
      "worldcoin-wld": "wld-worldcoin",
      wld: "wld-worldcoin",
      "floki-inu": "floki-floki-inu",
      floki: "floki-floki-inu",
      bonk: "bonk-bonk",
      dogwifhat: "wif-dogwifhat",
      wif: "wif-dogwifhat",
      gala: "gala-gala",
      "axie-infinity": "axs-axie-infinity",
      "theta-token": "theta-theta-token",
      flow: "flow-flow",
      chiliz: "chz-chiliz",
      kava: "kava-kava",
      thorchain: "rune-thorchain",
      osmosis: "osmo-osmosis",
      "dydx-chain": "dydx-dydx",
      helium: "hnt-helium",
      "crypto-com-chain": "cro-crypto-com-chain",
      cronos: "cro-crypto-com-chain",
      kusama: "ksm-kusama",
      "elrond-erd-2": "egld-elrond",
      multiversx: "egld-elrond",
      harmony: "one-harmony",
      "mina-protocol": "mina-mina-protocol",
      "bitcoin-sv": "bsv-bitcoin-sv",
      zcash: "zec-zcash",
      iota: "miota-iota",
      neo: "neo-neo",
      dash: "dash-dash",
      // --- Tier 5: DeFi & Web3 ---
      compound: "comp-compound",
      sushi: "sushi-sushiswap",
      "yearn-finance": "yfi-yearn-finance",
      "synthetix-network-token": "snx-synthetix-network-token",
      synthetix: "snx-synthetix-network-token",
      "0x": "zrx-0x",
      loopring: "lrc-loopring",
      "basic-attention-token": "bat-basic-attention-token",
      "the-graph": "grt-the-graph",
      "ocean-protocol": "ocean-ocean-protocol",
      decred: "dcr-decred",
      ontology: "ont-ontology",
      enjincoin: "enj-enjincoin",
      storj: "storj-storj",
      "blur-token": "blur-blur",
      blur: "blur-blur",
      "mask-network": "mask-mask-network",
      gmx: "gmx-gmx",
      raydium: "ray-raydium",
      "jito-governance-token": "jto-jito",
      jito: "jto-jito",
      // --- Tier 6: Stablecoins & wrapped ---
      trueusd: "tusd-trueusd",
      "pax-gold": "paxg-pax-gold",
      frax: "frax-frax",
      "bitcoin-gold": "btg-bitcoin-gold",
      waves: "waves-waves",
      nano: "nano-nano",
      digibyte: "dgb-digibyte",
      wax: "waxp-wax",
    };

    const paprikaId = paprikaIdMap[coinId];

    // If no known mapping, don't attempt CoinPaprika (bad IDs always 404)
    if (!paprikaId) {
      return null;
    }

    // Fetch coin info and ticker in parallel
    const [coinResponse, tickerResponse] = await Promise.all([
      fetchWithTimeout(`${COINPAPRIKA_BASE}/coins/${paprikaId}`, 5000, true),
      fetchWithTimeout(`${COINPAPRIKA_BASE}/tickers/${paprikaId}`, 5000, true),
    ]);

    if (!coinResponse.ok || !tickerResponse.ok) {
      console.error(`CoinPaprika fallback also failed for ${coinId}`);
      return null;
    }

    const [coinInfo, tickerInfo] = await Promise.all([
      coinResponse.json(),
      tickerResponse.json(),
    ]);

    // Transform to CoinGecko-compatible format
    const quotes = tickerInfo.quotes?.USD || {};

    const result = {
      id: coinId,
      symbol: coinInfo.symbol?.toLowerCase() || coinId,
      name: coinInfo.name || coinId,
      image: {
        large:
          coinInfo.logo ||
          `https://static.coinpaprika.com/coin/${paprikaId}/logo.png`,
        small:
          coinInfo.logo ||
          `https://static.coinpaprika.com/coin/${paprikaId}/logo.png`,
        thumb:
          coinInfo.logo ||
          `https://static.coinpaprika.com/coin/${paprikaId}/logo.png`,
      },
      market_cap_rank: tickerInfo.rank || null,
      categories: coinInfo.tags?.map((t: { name: string }) => t.name) || [],
      description: { en: coinInfo.description || "" },
      links: {
        homepage: coinInfo.links?.website ? [coinInfo.links.website] : [],
        blockchain_site: coinInfo.links?.explorer
          ? [coinInfo.links.explorer]
          : [],
        twitter_screen_name:
          coinInfo.links?.twitter?.[0]?.replace("https://twitter.com/", "") ||
          "",
        subreddit_url: coinInfo.links?.reddit?.[0] || "",
      },
      genesis_date: coinInfo.started_at?.split("T")[0] || null,
      market_data: {
        current_price: { usd: quotes.price || 0 },
        price_change_percentage_24h: quotes.percent_change_24h || 0,
        price_change_percentage_1h_in_currency: {
          usd: quotes.percent_change_1h || 0,
        },
        price_change_percentage_7d: quotes.percent_change_7d || 0,
        price_change_percentage_30d: quotes.percent_change_30d || 0,
        price_change_percentage_1y: quotes.percent_change_1y || 0,
        market_cap: { usd: quotes.market_cap || 0 },
        total_volume: { usd: quotes.volume_24h || 0 },
        high_24h: {
          usd:
            quotes.price * (1 + Math.abs(quotes.percent_change_24h || 0) / 100),
        },
        low_24h: {
          usd:
            quotes.price * (1 - Math.abs(quotes.percent_change_24h || 0) / 100),
        },
        ath: { usd: quotes.ath_price || quotes.price },
        ath_date: { usd: quotes.ath_date || new Date().toISOString() },
        ath_change_percentage: { usd: quotes.percent_from_price_ath || 0 },
        circulating_supply: tickerInfo.circulating_supply || 0,
        total_supply: tickerInfo.total_supply || null,
        max_supply: tickerInfo.max_supply || null,
      },
      last_updated: tickerInfo.last_updated || new Date().toISOString(),
    };

    // Cache the fallback result
    setCache(`coin-${coinId}`, result, CACHE_TTL.global);
    return result;
  } catch (error) {
    console.error("CoinPaprika fallback error:", error);
    return null;
  }
}

/**
 * Fallback: Get coin details from CoinCap API (api.coincap.io)
 * Completely free, no API key required. Works for ANY coin.
 *
 * Strategy:
 *   1. Direct /assets/{coinId} lookup  (works for most CoinGecko IDs)
 *   2. If that 404s → search /assets?search={stripped-id} and pick best match
 *      e.g. "avalanche-2" → searches "avalanche", "wrapped-bitcoin" → "wrapped bitcoin"
 */
async function getCoinDetailsCoinCap(
  coinId: string,
): Promise<Record<string, unknown> | null> {
  // Shared helper: build CoinGecko-compatible object from a CoinCap asset blob
  const buildResult = (d: Record<string, unknown>): Record<string, unknown> => {
    const price = parseFloat(d.priceUsd as string) || 0;
    const changePercent24h = parseFloat(d.changePercent24Hr as string) || 0;
    const marketCap = parseFloat(d.marketCapUsd as string) || 0;
    const volume24h = parseFloat(d.volumeUsd24Hr as string) || 0;
    const supply = parseFloat(d.supply as string) || 0;
    const maxSupply = d.maxSupply ? parseFloat(d.maxSupply as string) : null;
    const logoUrl = `https://assets.coincap.io/assets/icons/${(d.symbol as string).toLowerCase()}@2x.png`;
    return {
      id: coinId,
      symbol: (d.symbol as string).toLowerCase(),
      name: d.name,
      image: { large: logoUrl, small: logoUrl, thumb: logoUrl },
      market_cap_rank: d.rank ? parseInt(d.rank as string, 10) : null,
      categories: [],
      description: { en: "" },
      links: {
        homepage: [],
        blockchain_site: d.explorer ? [d.explorer] : [],
        twitter_screen_name: "",
        subreddit_url: "",
      },
      genesis_date: null,
      market_data: {
        current_price: { usd: price },
        price_change_percentage_24h: changePercent24h,
        price_change_percentage_1h_in_currency: { usd: 0 },
        price_change_percentage_7d: 0,
        price_change_percentage_30d: 0,
        price_change_percentage_1y: 0,
        market_cap: { usd: marketCap },
        total_volume: { usd: volume24h },
        high_24h: { usd: price * (1 + Math.abs(changePercent24h) / 100) },
        low_24h: { usd: price * (1 - Math.abs(changePercent24h) / 100) },
        ath: { usd: price },
        ath_date: { usd: new Date().toISOString() },
        ath_change_percentage: { usd: 0 },
        atl: { usd: 0 },
        atl_date: { usd: new Date().toISOString() },
        atl_change_percentage: { usd: 0 },
        circulating_supply: supply,
        total_supply: supply || null,
        max_supply: maxSupply,
        fully_diluted_valuation: maxSupply ? { usd: price * maxSupply } : null,
      },
      last_updated: new Date().toISOString(),
    };
  };

  try {
    // --- Step 1: Direct lookup by CoinGecko ID (works for ~90% of coins) ---
    const directRes = await fetchWithTimeout(
      `${COINCAP_BASE}/assets/${coinId}`,
      5000, // 5 s — keep total fallback chain under page maxDuration
      true,
    );

    if (directRes.ok) {
      const json = await directRes.json();
      if (json.data) {
        const result = buildResult(json.data as Record<string, unknown>);
        setCache(`coin-${coinId}`, result, CACHE_TTL.global);
        return result;
      }
    }

    // --- Step 2: Search fallback for any ID that didn't match directly ---
    // "avalanche-2" → "avalanche"  |  "wrapped-bitcoin" → "wrapped bitcoin"
    const searchQuery = coinId
      .replace(/-\d+$/, "") // strip trailing version suffix (-2, -3 …)
      .replace(/-/g, " ") // hyphens → spaces for CoinCap search
      .trim();

    const searchRes = await fetchWithTimeout(
      `${COINCAP_BASE}/assets?search=${encodeURIComponent(searchQuery)}&limit=5`,
      5000, // 5 s — keep total fallback chain under page maxDuration
      true,
    );

    if (!searchRes.ok) return null;

    const searchJson = await searchRes.json();
    const assets: Record<string, unknown>[] = searchJson.data ?? [];
    if (!assets.length) return null;

    // Pick the closest match: exact ID/name win; otherwise take highest-ranked result
    const normalised = coinId
      .replace(/-\d+$/, "")
      .replace(/-/g, "")
      .toLowerCase();
    const best =
      assets.find(
        (a) =>
          (a.id as string).replace(/-/g, "").toLowerCase() === normalised ||
          (a.name as string).replace(/\s+/g, "").toLowerCase() === normalised,
      ) ?? assets[0];

    const result = buildResult(best);
    setCache(`coin-${coinId}`, result, CACHE_TTL.global);
    return result;
  } catch (error) {
    console.error("CoinCap fallback error:", error);
    return null;
  }
}

// =============================================================================
// FREE API FALLBACKS — CoinCap, CoinPaprika global, Binance klines
// All keyless, no registration required
// =============================================================================

/** CoinCap fallback for getSimplePrices — returns real prices instead of zeros */
async function getSimplePricesFallback(): Promise<SimplePrices> {
  const empty: SimplePrices = {
    bitcoin: { usd: 0, usd_24h_change: 0 },
    ethereum: { usd: 0, usd_24h_change: 0 },
    solana: { usd: 0, usd_24h_change: 0 },
  };
  try {
    const response = await fetchWithTimeout(
      `${COINCAP_BASE}/assets?ids=bitcoin,ethereum,solana`,
      10000,
      true,
    );
    if (!response.ok) return empty;
    const { data } = await response.json();
    const result: SimplePrices = { ...empty };
    for (const asset of data as Array<{
      id: string;
      priceUsd: string;
      changePercent24Hr: string;
    }>) {
      if (asset.id in result) {
        result[asset.id] = {
          usd: parseFloat(asset.priceUsd) || 0,
          usd_24h_change: parseFloat(asset.changePercent24Hr) || 0,
        };
      }
    }
    setCache("simple-prices", result, CACHE_TTL.prices);
    return result;
  } catch {
    return empty;
  }
}

/** CoinCap fallback for getTrending — top-10 by market cap as trending proxy */
async function getTrendingFallback(): Promise<TrendingCoin[]> {
  try {
    const response = await fetchWithTimeout(
      `${COINCAP_BASE}/assets?limit=10`,
      10000,
      true,
    );
    if (!response.ok) return [];
    const { data } = await response.json();
    return (
      data as Array<{ id: string; name: string; symbol: string; rank: string }>
    ).map((asset, i) => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      market_cap_rank: parseInt(asset.rank, 10) || i + 1,
      thumb: `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`,
      small: `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`,
      large: `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`,
      price_btc: 0,
      score: i,
    }));
  } catch {
    return [];
  }
}

/** CoinPaprika /global fallback for getGlobalMarketData */
async function getGlobalMarketDataFallback(): Promise<GlobalMarketData | null> {
  try {
    const response = await fetchWithTimeout(
      `${COINPAPRIKA_BASE}/global`,
      10000,
      true,
    );
    if (!response.ok) return null;
    const d = (await response.json()) as {
      market_cap_usd?: number;
      volume_24h_usd?: number;
      bitcoin_dominance_percentage?: number;
      cryptocurrencies_number?: number;
    };
    const result: GlobalMarketData = {
      active_cryptocurrencies: d.cryptocurrencies_number || 0,
      markets: 0,
      total_market_cap: { usd: d.market_cap_usd || 0 },
      total_volume: { usd: d.volume_24h_usd || 0 },
      market_cap_percentage: { btc: d.bitcoin_dominance_percentage || 0 },
      market_cap_change_percentage_24h_usd: 0,
      updated_at: Math.floor(Date.now() / 1000),
    };
    setCache("global", result, CACHE_TTL.global);
    return result;
  } catch {
    return null;
  }
}

/** CoinCap /history fallback for getHistoricalPrices */
async function getHistoricalPricesFallback(
  coinId: string,
  days: number | "max",
): Promise<HistoricalData> {
  const empty: HistoricalData = {
    prices: [],
    market_caps: [],
    total_volumes: [],
  };
  try {
    const numDays = days === "max" ? 365 : (days as number);
    const interval = numDays <= 1 ? "h1" : numDays <= 7 ? "h6" : "d1";
    const end = Date.now();
    const start = end - numDays * 24 * 60 * 60 * 1000;
    const response = await fetchWithTimeout(
      `${COINCAP_BASE}/assets/${coinId}/history?interval=${interval}&start=${start}&end=${end}`,
      10000,
      true,
    );
    if (!response.ok) return empty;
    const { data } = await response.json();
    const prices: [number, number][] = (
      data as Array<{ priceUsd: string; time: number }>
    ).map(({ priceUsd, time }) => [time, parseFloat(priceUsd) || 0]);
    const result: HistoricalData = {
      prices,
      market_caps: [],
      total_volumes: [],
    };
    setCache(
      `historical-${coinId}-${days === "max" ? "max" : days}-auto`,
      result,
      CACHE_TTL.historical_30d,
    );
    return result;
  } catch {
    return empty;
  }
}

/** Binance klines fallback for getOHLC */
async function getOHLCBinanceFallback(
  coinId: string,
  days: number,
): Promise<OHLCData[]> {
  const idToSymbol: Record<string, string> = {
    bitcoin: "BTCUSDT",
    ethereum: "ETHUSDT",
    solana: "SOLUSDT",
    ripple: "XRPUSDT",
    cardano: "ADAUSDT",
    dogecoin: "DOGEUSDT",
    polkadot: "DOTUSDT",
    "avalanche-2": "AVAXUSDT",
    chainlink: "LINKUSDT",
    polygon: "MATICUSDT",
    "matic-network": "MATICUSDT",
    litecoin: "LTCUSDT",
    uniswap: "UNIUSDT",
    binancecoin: "BNBUSDT",
    tron: "TRXUSDT",
    "shiba-inu": "SHIBUSDT",
    apecoin: "APEUSDT",
    near: "NEARUSDT",
    cosmos: "ATOMUSDT",
    algorand: "ALGOUSDT",
    stellar: "XLMUSDT",
    "ethereum-classic": "ETCUSDT",
    monero: "XMRUSDT",
    filecoin: "FILUSDT",
    vechain: "VETUSDT",
    aave: "AAVEUSDT",
    maker: "MKRUSDT",
    "hedera-hashgraph": "HBARUSDT",
    "internet-computer": "ICPUSDT",
    "curve-dao-token": "CRVUSDT",
  };
  const symbol = idToSymbol[coinId];
  if (!symbol) return [];
  try {
    const interval = days <= 1 ? "1h" : days <= 7 ? "4h" : "1d";
    const limit = Math.min(days <= 1 ? 24 : days <= 7 ? 42 : days, 500);
    const response = await fetchWithTimeout(
      `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      10000,
      true,
    );
    if (!response.ok) return [];
    const raw: [number, string, string, string, string][] =
      await response.json();
    return raw.map(([time, open, high, low, close]) => ({
      timestamp: time,
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
    }));
  } catch {
    return [];
  }
}

/** CoinCap /assets search fallback for searchCoins */
async function searchCoinsCoinCapFallback(
  query: string,
): Promise<SearchResult> {
  const empty: SearchResult = {
    coins: [],
    exchanges: [],
    categories: [],
    nfts: [],
  };
  try {
    const response = await fetchWithTimeout(
      `${COINCAP_BASE}/assets?search=${encodeURIComponent(query)}&limit=10`,
      10000,
      true,
    );
    if (!response.ok) return empty;
    const { data } = await response.json();
    const coins = (
      data as Array<{ id: string; name: string; symbol: string; rank: string }>
    ).map((asset) => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      api_symbol: asset.symbol,
      market_cap_rank: parseInt(asset.rank, 10) || 9999,
      thumb: `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`,
      large: `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`,
    }));
    return { ...empty, coins };
  } catch {
    return empty;
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
  if (IS_BUILD) return null;
  const cacheKey = "fear-greed";
  const cached = getCached<FearGreedIndex>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${ALTERNATIVE_ME_BASE}/fng/`);

    if (!response.ok) {
      throw new Error("Failed to fetch fear & greed index");
    }

    const data = await response.json();
    const fng = data.data?.[0];
    if (fng) {
      setCache(cacheKey, fng, CACHE_TTL.global);
    }
    return fng || null;
  } catch (error) {
    console.error("Error fetching fear & greed index:", error);
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
  if (IS_BUILD) return [];
  const cacheKey = `protocols-${limit}`;
  const cached = getCached<ProtocolTVL[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${DEFILLAMA_BASE}/protocols`);

    if (!response.ok) {
      throw new Error("Failed to fetch protocols");
    }

    const data = await response.json();
    const top = data
      .filter((p: ProtocolTVL) => p.tvl > 0)
      .sort((a: ProtocolTVL, b: ProtocolTVL) => b.tvl - a.tvl)
      .slice(0, limit)
      .map((p: ProtocolTVL) => ({
        ...p,
        slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
      }));

    setCache(cacheKey, top, CACHE_TTL.global);
    return top;
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return [];
  }
}

/**
 * Get a single protocol by slug/id
 * @param slug - Protocol slug or name
 * @returns Protocol details or null
 */
export async function getProtocolBySlug(
  slug: string,
): Promise<ProtocolTVL | null> {
  const cacheKey = `protocol-${slug}`;
  const cached = getCached<ProtocolTVL>(cacheKey);
  if (cached) return cached.data;

  try {
    // DeFiLlama uses protocol name as the endpoint
    const response = await fetchWithTimeout(
      `${DEFILLAMA_BASE}/protocol/${slug}`,
    );

    if (!response.ok) {
      // Try to find in protocols list
      const protocols = await getTopProtocols(100);
      const found = protocols.find(
        (p) =>
          p.slug === slug ||
          p.id === slug ||
          p.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase(),
      );
      return found || null;
    }

    const data = await response.json();
    const protocol: ProtocolTVL = {
      id: data.id || slug,
      name: data.name,
      symbol: data.symbol || "",
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, "-") || slug,
      chain: data.chain || data.chains?.[0] || "Multi-Chain",
      chains: data.chains || [],
      tvl: data.tvl || 0,
      change_1h: data.change_1h || 0,
      change_1d: data.change_1d || 0,
      change_7d: data.change_7d || 0,
      category: data.category || "Unknown",
      logo: data.logo || "",
      url: data.url || "",
      description: data.description,
      twitter: data.twitter,
      audit_links: data.audit_links,
      mcap: data.mcap,
      fdv: data.fdv,
    };

    setCache(cacheKey, protocol, CACHE_TTL.global);
    return protocol;
  } catch (error) {
    console.error("Error fetching protocol:", error);
    return null;
  }
}

/**
 * Get a single chain by ID
 * @param chainId - Chain ID or gecko_id
 * @returns Chain details or null
 */
export async function getChainBySlug(slug: string): Promise<ChainTVL | null> {
  try {
    const chains = await getTopChains(50);
    const found = chains.find(
      (c) =>
        c.gecko_id === slug ||
        c.name.toLowerCase() === slug.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase(),
    );
    return found || null;
  } catch (error) {
    console.error("Error fetching chain:", error);
    return null;
  }
}

/**
 * Get top chains by TVL
 * @param limit - Number of chains to return
 * @returns Array of chains sorted by TVL
 */
export async function getTopChains(limit = 20): Promise<ChainTVL[]> {
  if (IS_BUILD) return [];
  const cacheKey = `chains-${limit}`;
  const cached = getCached<ChainTVL[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${DEFILLAMA_BASE}/v2/chains`);

    if (!response.ok) {
      throw new Error("Failed to fetch chains");
    }

    const data = await response.json();
    const top = data
      .sort((a: ChainTVL, b: ChainTVL) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);

    setCache(cacheKey, top, CACHE_TTL.global);
    return top;
  } catch (error) {
    console.error("Error fetching chains:", error);
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
  days: number | "max",
  interval?: "minutely" | "hourly" | "daily",
): Promise<HistoricalData> {
  const daysParam = days === "max" ? "max" : days.toString();
  const intervalParam = interval ? `&interval=${interval}` : "";
  const cacheKey = `historical-${coinId}-${daysParam}-${interval || "auto"}`;
  const cacheTTL =
    typeof days === "number"
      ? getHistoricalCacheTTL(days)
      : CACHE_TTL.historical_90d;

  const cached = getCached<HistoricalData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${daysParam}${intervalParam}`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch historical prices",
        response.status,
      );
    }

    const data: HistoricalData = await response.json();
    setCache(cacheKey, data, cacheTTL);
    return data;
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    return await getHistoricalPricesFallback(coinId, days);
  }
}

/**
 * Get OHLC candlestick data for a coin
 * @param coinId - CoinGecko coin ID
 * @param days - Number of days (1, 7, 14, 30, 90, 180, 365)
 * @returns Array of OHLC data points
 */
export async function getOHLC(
  coinId: string,
  days: number,
): Promise<OHLCData[]> {
  // Validate days parameter (CoinGecko only supports specific values)
  const validDays = [1, 7, 14, 30, 90, 180, 365];
  const normalizedDays = validDays.reduce((prev, curr) =>
    Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev,
  );

  const cacheKey = `ohlc-${coinId}-${normalizedDays}`;
  const cacheTTL = getHistoricalCacheTTL(normalizedDays);

  const cached = getCached<OHLCData[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${normalizedDays}`,
    );

    if (!response.ok) {
      throw new MarketDataError("Failed to fetch OHLC data", response.status);
    }

    // CoinGecko returns [[timestamp, open, high, low, close], ...]
    const rawData: [number, number, number, number, number][] =
      await response.json();
    const ohlcData: OHLCData[] = rawData.map(
      ([timestamp, open, high, low, close]) => ({
        timestamp,
        open,
        high,
        low,
        close,
      }),
    );

    setCache(cacheKey, ohlcData, cacheTTL);
    return ohlcData;
  } catch (error) {
    console.error("Error fetching OHLC data:", error);
    return await getOHLCBinanceFallback(coinId, normalizedDays);
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
  date: string,
): Promise<HistoricalSnapshot | null> {
  const cacheKey = `historical-snapshot-${coinId}-${date}`;

  const cached = getCached<HistoricalSnapshot>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/history?date=${date}&localization=false`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch historical price",
        response.status,
      );
    }

    const data: HistoricalSnapshot = await response.json();
    // Historical snapshots are immutable, cache for a long time
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error("Error fetching historical price:", error);
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
  page: number = 1,
): Promise<TickerData> {
  const cacheKey = `tickers-${coinId}-${page}`;

  const cached = getCached<TickerData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}/tickers?page=${page}&include_exchange_logo=true&order=volume_desc`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch coin tickers",
        response.status,
      );
    }

    const data: TickerData = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error("Error fetching coin tickers:", error);
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
  page: number = 1,
): Promise<Exchange[]> {
  const cacheKey = `exchanges-${perPage}-${page}`;

  const cached = getCached<Exchange[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/exchanges?per_page=${perPage}&page=${page}`,
    );

    if (!response.ok) {
      throw new MarketDataError("Failed to fetch exchanges", response.status);
    }

    const data: Exchange[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error("Error fetching exchanges:", error);
    return [];
  }
}

/**
 * Get detailed exchange information with tickers
 * @param exchangeId - CoinGecko exchange ID
 * @returns Detailed exchange information
 */
export async function getExchangeDetails(
  exchangeId: string,
): Promise<ExchangeDetails | null> {
  const cacheKey = `exchange-${exchangeId}`;

  const cached = getCached<ExchangeDetails>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/exchanges/${exchangeId}`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch exchange details",
        response.status,
      );
    }

    const data: ExchangeDetails = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error("Error fetching exchange details:", error);
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
  const cacheKey = "categories";

  const cached = getCached<Category[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/categories`,
    );

    if (!response.ok) {
      throw new MarketDataError("Failed to fetch categories", response.status);
    }

    const data: Category[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
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
  page: number = 1,
): Promise<TokenPrice[]> {
  const cacheKey = `category-coins-${categoryId}-${perPage}-${page}`;

  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&category=${encodeURIComponent(categoryId)}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch category coins",
        response.status,
      );
    }

    const data: TokenPrice[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error("Error fetching category coins:", error);
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
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new MarketDataError("Failed to search coins", response.status);
    }

    const data: SearchResult = await response.json();
    setCache(cacheKey, data, CACHE_TTL.search);
    return data;
  } catch (error) {
    console.error("Error searching coins:", error);
    return await searchCoinsCoinCapFallback(query);
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
  const cacheKey = `compare-${limitedIds.sort().join(",")}`;

  const cached = getCached<CompareData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${limitedIds.join(",")}&order=market_cap_desc&per_page=25&page=1&sparkline=false&price_change_percentage=7d,30d`,
    );

    if (!response.ok) {
      throw new MarketDataError("Failed to compare coins", response.status);
    }

    const rawData = await response.json();
    const coins: CompareCoin[] = rawData.map(
      (coin: Record<string, unknown>) => ({
        id: coin.id as string,
        symbol: coin.symbol as string,
        name: coin.name as string,
        image: coin.image as string,
        current_price: coin.current_price as number,
        market_cap: coin.market_cap as number,
        market_cap_rank: coin.market_cap_rank as number,
        total_volume: coin.total_volume as number,
        price_change_percentage_24h: coin.price_change_percentage_24h as number,
        price_change_percentage_7d:
          (coin.price_change_percentage_7d_in_currency as number) || 0,
        price_change_percentage_30d:
          (coin.price_change_percentage_30d_in_currency as number) || 0,
        circulating_supply: coin.circulating_supply as number,
        total_supply: coin.total_supply as number | null,
        max_supply: coin.max_supply as number | null,
        ath: coin.ath as number,
        ath_change_percentage: coin.ath_change_percentage as number,
        ath_date: coin.ath_date as string,
        atl: coin.atl as number,
        atl_change_percentage: coin.atl_change_percentage as number,
        atl_date: coin.atl_date as string,
      }),
    );

    const result: CompareData = {
      coins,
      comparison_date: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.prices);
    return result;
  } catch (error) {
    console.error("Error comparing coins:", error);
    return { coins: [], comparison_date: new Date().toISOString() };
  }
}

/**
 * Get list of all coins (for autocomplete)
 * @returns Array of all coins with basic info
 */
export async function getCoinsList(): Promise<CoinListItem[]> {
  const cacheKey = "coins-list";

  const cached = getCached<CoinListItem[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/coins/list`);

    if (!response.ok) {
      throw new MarketDataError("Failed to fetch coins list", response.status);
    }

    const data: CoinListItem[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.static);
    return data;
  } catch (error) {
    console.error("Error fetching coins list:", error);
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
  coinId: string,
): Promise<DeveloperData | null> {
  const cacheKey = `developer-${coinId}`;

  const cached = getCached<DeveloperData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=true&sparkline=false`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch developer data",
        response.status,
      );
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
    console.error("Error fetching developer data:", error);
    return null;
  }
}

/**
 * Get community/social statistics for a coin
 * @param coinId - CoinGecko coin ID
 * @returns Community data including Twitter, Reddit, Telegram stats
 */
export async function getCoinCommunityData(
  coinId: string,
): Promise<CommunityData | null> {
  const cacheKey = `community-${coinId}`;

  const cached = getCached<CommunityData>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch community data",
        response.status,
      );
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
    console.error("Error fetching community data:", error);
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
  const cacheKey = "global-defi";

  const cached = getCached<GlobalDeFi>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/global/decentralized_finance_defi`,
    );

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch global DeFi data",
        response.status,
      );
    }

    const { data }: { data: GlobalDeFi } = await response.json();
    setCache(cacheKey, data, CACHE_TTL.global);
    return data;
  } catch (error) {
    console.error("Error fetching global DeFi data:", error);
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
  const cacheKey = "derivatives-tickers";

  const cached = getCached<DerivativeTicker[]>(cacheKey);
  if (cached) return cached.data;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/derivatives`);

    if (!response.ok) {
      throw new MarketDataError(
        "Failed to fetch derivatives tickers",
        response.status,
      );
    }

    const data: DerivativeTicker[] = await response.json();
    setCache(cacheKey, data, CACHE_TTL.tickers);
    return data;
  } catch (error) {
    console.error("Error fetching derivatives tickers:", error);
    return [];
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatPrice(price: number | string | null | undefined): string {
  if (price == null) return "$0.00";
  const p = typeof price === "string" ? parseFloat(price) : price;
  if (typeof p !== "number" || !isFinite(p)) return "$0.00";
  if (p >= 1000) {
    return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (p >= 1) {
    return (
      "$" +
      p.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return (
    "$" +
    p.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })
  );
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num == null) return "0";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (typeof n !== "number" || !isFinite(n)) return "0";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

export function formatPercent(num: number | string | null | undefined): string {
  if (num == null) return "0.00%";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (typeof n !== "number" || !isFinite(n)) return "0.00%";
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export function getFearGreedColor(value: number): string {
  if (value <= 25) return "text-red-500";
  if (value <= 45) return "text-orange-500";
  if (value <= 55) return "text-yellow-500";
  if (value <= 75) return "text-lime-500";
  return "text-green-500";
}

export function getFearGreedBgColor(value: number): string {
  if (value <= 25) return "bg-red-500";
  if (value <= 45) return "bg-orange-500";
  if (value <= 55) return "bg-yellow-500";
  if (value <= 75) return "bg-lime-500";
  return "bg-green-500";
}

// =============================================================================
// BACKWARD COMPATIBILITY ALIASES
// =============================================================================

/**
 * Type alias for TokenPrice - provides backward compatibility
 */
export type CoinData = TokenPrice;

/**
 * Type alias for GlobalMarketData - provides backward compatibility
 */
export type GlobalData = GlobalMarketData;

/**
 * Alias for getGlobalMarketData - provides backward compatibility
 */
export const getGlobalData = getGlobalMarketData;
