/**
 * Market Data Service for Free Crypto News
 * Adapted from https://github.com/nirholas/crypto-market-data
 * 
 * Integrates CoinGecko and DeFiLlama APIs for live market data
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';
const ALTERNATIVE_ME = 'https://api.alternative.me';

// =============================================================================
// TYPES
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
// CACHE (Simple in-memory cache with TTL)
// =============================================================================

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// FETCH HELPERS
// =============================================================================

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FreeCryptoNews/2.0',
      },
      next: { revalidate: 60 }, // Next.js cache for 60 seconds
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =============================================================================
// COINGECKO API
// =============================================================================

/**
 * Get simple prices for major coins (fast endpoint)
 */
export async function getSimplePrices(): Promise<SimplePrices> {
  const cached = getCached<SimplePrices>('simple-prices');
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    
    const data = await response.json();
    setCache('simple-prices', data);
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
 */
export async function getTopCoins(limit = 50): Promise<TokenPrice[]> {
  const cacheKey = `top-coins-${limit}`;
  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=7d`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch top coins');
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
}

/**
 * Get trending coins
 */
export async function getTrending(): Promise<TrendingCoin[]> {
  const cached = getCached<TrendingCoin[]>('trending');
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/search/trending`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending');
    }
    
    const data = await response.json();
    const trending = data.coins.map((c: { item: TrendingCoin }) => c.item);
    setCache('trending', trending);
    return trending;
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
}

/**
 * Get global market data
 */
export async function getGlobalMarketData(): Promise<GlobalMarketData | null> {
  const cached = getCached<GlobalMarketData>('global');
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`${COINGECKO_BASE}/global`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch global data');
    }
    
    const data = await response.json();
    setCache('global', data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    return null;
  }
}

/**
 * Get coin details
 */
export async function getCoinDetails(coinId: string) {
  const cacheKey = `coin-${coinId}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch coin details');
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
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
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex | null> {
  const cached = getCached<FearGreedIndex>('fear-greed');
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`${ALTERNATIVE_ME}/fng/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch fear & greed index');
    }
    
    const data = await response.json();
    const fng = data.data?.[0];
    if (fng) {
      setCache('fear-greed', fng);
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
 */
export async function getTopProtocols(limit = 20): Promise<ProtocolTVL[]> {
  const cacheKey = `protocols-${limit}`;
  const cached = getCached<ProtocolTVL[]>(cacheKey);
  if (cached) return cached;

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
    
    setCache(cacheKey, top);
    return top;
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return [];
  }
}

/**
 * Get top chains by TVL
 */
export async function getTopChains(limit = 20): Promise<ChainTVL[]> {
  const cacheKey = `chains-${limit}`;
  const cached = getCached<ChainTVL[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`${DEFILLAMA_BASE}/v2/chains`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chains');
    }
    
    const data = await response.json();
    const top = data
      .sort((a: ChainTVL, b: ChainTVL) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);
    
    setCache(cacheKey, top);
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
