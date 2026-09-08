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
 * CoinMarketCap API Integration
 * 
 * Professional-grade cryptocurrency market data including rankings,
 * global metrics, and CMC-specific metadata.
 * 
 * @see https://coinmarketcap.com/api/documentation/v1/
 * @module lib/apis/coinmarketcap
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = process.env.COINMARKETCAP_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface CmcCryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  isActive: boolean;
  firstHistoricalData: string;
  lastHistoricalData: string;
  platform?: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    tokenAddress: string;
  };
  quote: {
    USD: {
      price: number;
      volume24h: number;
      volumeChange24h: number;
      percentChange1h: number;
      percentChange24h: number;
      percentChange7d: number;
      percentChange30d: number;
      percentChange60d: number;
      percentChange90d: number;
      marketCap: number;
      marketCapDominance: number;
      fullyDilutedMarketCap: number;
      lastUpdated: string;
    };
  };
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  numMarketPairs: number;
  dateAdded: string;
  tags: string[];
  cmcRank: number;
}

export interface GlobalMetrics {
  activeCryptocurrencies: number;
  totalCryptocurrencies: number;
  activeMarketPairs: number;
  activeExchanges: number;
  totalExchanges: number;
  ethDominance: number;
  btcDominance: number;
  ethDominanceYesterday: number;
  btcDominanceYesterday: number;
  defiVolume24h: number;
  defiVolume24hReported: number;
  defiMarketCap: number;
  defi24hPercentChange: number;
  stablecoinVolume24h: number;
  stablecoinVolume24hReported: number;
  stablecoinMarketCap: number;
  stablecoin24hPercentChange: number;
  derivativesVolume24h: number;
  derivativesVolume24hReported: number;
  derivatives24hPercentChange: number;
  quote: {
    USD: {
      totalMarketCap: number;
      totalVolume24h: number;
      totalVolume24hReported: number;
      altcoinVolume24h: number;
      altcoinMarketCap: number;
      defiVolume24h: number;
      defiMarketCap: number;
      stablecoinVolume24h: number;
      stablecoinMarketCap: number;
      derivativesVolume24h: number;
      lastUpdated: string;
    };
  };
  lastUpdated: string;
}

export interface CmcExchange {
  id: number;
  name: string;
  slug: string;
  rank: number;
  numMarketPairs: number;
  volume24h: number;
  volume24hAdjusted: number;
  volume7d: number;
  volume30d: number;
  percentChangeVolume24h: number;
  percentChangeVolume7d: number;
  percentChangeVolume30d: number;
  weeklyVisits: number | null;
  spotVolumeUsd: number;
  derivativesVolumeUsd: number;
  makerFee: number;
  takerFee: number;
  dateLaunched: string | null;
  fiats: string[];
}

export interface TrendingCrypto {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  cmcRank: number;
  percentChange24h: number;
  volume24h: number;
  marketCap: number;
  trendingScore: number;
}

export interface FearGreedIndex {
  value: number;
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
  updateTime: string;
}

export interface CmcMarketSummary {
  globalMetrics: GlobalMetrics;
  topCryptocurrencies: CmcCryptocurrency[];
  topGainers: CmcCryptocurrency[];
  topLosers: CmcCryptocurrency[];
  trending: TrendingCrypto[];
  fearGreedIndex: FearGreedIndex;
  topExchanges: CmcExchange[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Make authenticated request to CMC API
 */
async function cmcFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  if (!API_KEY) {
    console.warn('CoinMarketCap API key not configured');
    return null;
  }

  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await resilientFetchResponse(url.toString(), {
      service: 'coinmarketcap', timeoutMs: 8000, retries: 1,
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`CMC API error: ${response.status}`, error);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('CMC API request failed:', error);
    return null;
  }
}

/**
 * Get latest cryptocurrency listings
 */
export async function getLatestListings(options?: {
  limit?: number;
  start?: number;
  sort?: 'market_cap' | 'volume_24h' | 'percent_change_24h' | 'name';
  sortDir?: 'asc' | 'desc';
  cryptoType?: 'all' | 'coins' | 'tokens';
  tag?: string;
}): Promise<CmcCryptocurrency[]> {
  const params: Record<string, string> = {
    limit: String(options?.limit || 100),
    start: String(options?.start || 1),
    sort: options?.sort || 'market_cap',
    sort_dir: options?.sortDir || 'desc',
    cryptocurrency_type: options?.cryptoType || 'all',
    convert: 'USD',
  };

  if (options?.tag) {
    params.tag = options.tag;
  }

  const data = await cmcFetch<CmcCryptocurrency[]>('/cryptocurrency/listings/latest', params);
  
  if (!data) return [];

  return data.map(crypto => ({
    id: crypto.id,
    name: crypto.name,
    symbol: crypto.symbol,
    slug: crypto.slug,
    rank: crypto.cmcRank || crypto.rank,
    isActive: true,
    firstHistoricalData: '',
    lastHistoricalData: '',
    platform: crypto.platform,
    quote: crypto.quote,
    circulatingSupply: crypto.circulatingSupply,
    totalSupply: crypto.totalSupply,
    maxSupply: crypto.maxSupply,
    numMarketPairs: crypto.numMarketPairs,
    dateAdded: crypto.dateAdded,
    tags: crypto.tags || [],
    cmcRank: crypto.cmcRank || crypto.rank,
  }));
}

/**
 * Get global market metrics
 */
export async function getGlobalMetrics(): Promise<GlobalMetrics | null> {
  const data = await cmcFetch<GlobalMetrics>('/global-metrics/quotes/latest', {
    convert: 'USD',
  });

  return data;
}

/**
 * Get top exchanges by volume
 */
export async function getTopExchanges(limit: number = 25): Promise<CmcExchange[]> {
  const data = await cmcFetch<CmcExchange[]>('/exchange/listings/latest', {
    limit: String(limit),
    sort: 'volume_24h',
    sort_dir: 'desc',
    convert: 'USD',
  });

  if (!data) return [];

  return data.map(exchange => ({
    id: exchange.id,
    name: exchange.name,
    slug: exchange.slug,
    rank: exchange.rank,
    numMarketPairs: exchange.numMarketPairs,
    volume24h: exchange.volume24h,
    volume24hAdjusted: exchange.volume24hAdjusted,
    volume7d: exchange.volume7d,
    volume30d: exchange.volume30d,
    percentChangeVolume24h: exchange.percentChangeVolume24h,
    percentChangeVolume7d: exchange.percentChangeVolume7d,
    percentChangeVolume30d: exchange.percentChangeVolume30d,
    weeklyVisits: exchange.weeklyVisits,
    spotVolumeUsd: exchange.spotVolumeUsd,
    derivativesVolumeUsd: exchange.derivativesVolumeUsd,
    makerFee: exchange.makerFee,
    takerFee: exchange.takerFee,
    dateLaunched: exchange.dateLaunched,
    fiats: exchange.fiats || [],
  }));
}

/**
 * Get top gainers and losers
 */
export async function getGainersLosers(limit: number = 10): Promise<{
  gainers: CmcCryptocurrency[];
  losers: CmcCryptocurrency[];
}> {
  const [gainersData, losersData] = await Promise.all([
    getLatestListings({
      limit,
      sort: 'percent_change_24h',
      sortDir: 'desc',
    }),
    getLatestListings({
      limit,
      sort: 'percent_change_24h',
      sortDir: 'asc',
    }),
  ]);

  return {
    gainers: gainersData,
    losers: losersData,
  };
}

/**
 * Get trending cryptocurrencies
 * CMC doesn't have a direct trending endpoint, so we calculate based on volume surge
 */
export async function getTrending(): Promise<TrendingCrypto[]> {
  // Get top 200 by market cap
  const listings = await getLatestListings({ limit: 200 });
  
  if (!listings.length) return [];

  // Calculate trending score based on volume change and social mentions proxy
  const trending = listings
    .map(crypto => ({
      id: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      slug: crypto.slug,
      rank: crypto.rank,
      cmcRank: crypto.cmcRank,
      percentChange24h: crypto.quote.USD.percentChange24h,
      volume24h: crypto.quote.USD.volume24h,
      marketCap: crypto.quote.USD.marketCap,
      trendingScore: calculateTrendingScore(crypto),
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 20);

  return trending;
}

/**
 * Calculate trending score for a cryptocurrency
 */
function calculateTrendingScore(crypto: CmcCryptocurrency): number {
  const volumeChange = crypto.quote.USD.volumeChange24h || 0;
  const priceChange = Math.abs(crypto.quote.USD.percentChange24h || 0);
  const volume = crypto.quote.USD.volume24h || 0;
  const marketCap = crypto.quote.USD.marketCap || 1;
  
  // Volume to market cap ratio (high ratio = unusual activity)
  const volumeToMcap = (volume / marketCap) * 100;
  
  // Combined score
  return (volumeChange * 0.3) + (priceChange * 0.2) + (volumeToMcap * 0.5);
}

/**
 * Get Fear & Greed Index
 * Uses Alternative.me API as CMC doesn't provide this directly
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex | null> {
  try {
    const response = await resilientFetchResponse('https://api.alternative.me/fng/?limit=1', {
      service: 'alternative-me', timeoutMs: 5000, retries: 1,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data?.data?.[0]) return null;

    const fng = data.data[0];
    return {
      value: parseInt(fng.value, 10),
      valueClassification: fng.value_classification,
      timestamp: new Date(parseInt(fng.timestamp, 10) * 1000).toISOString(),
      updateTime: fng.time_until_update || '',
    };
  } catch {
    return null;
  }
}

/**
 * Get comprehensive market summary
 */
export async function getMarketSummary(): Promise<CmcMarketSummary> {
  const [
    globalMetrics,
    topCryptos,
    gainersLosers,
    trending,
    fearGreed,
    exchanges,
  ] = await Promise.all([
    getGlobalMetrics(),
    getLatestListings({ limit: 50 }),
    getGainersLosers(10),
    getTrending(),
    getFearGreedIndex(),
    getTopExchanges(10),
  ]);

  return {
    globalMetrics: globalMetrics || {
      activeCryptocurrencies: 0,
      totalCryptocurrencies: 0,
      activeMarketPairs: 0,
      activeExchanges: 0,
      totalExchanges: 0,
      ethDominance: 0,
      btcDominance: 0,
      ethDominanceYesterday: 0,
      btcDominanceYesterday: 0,
      defiVolume24h: 0,
      defiVolume24hReported: 0,
      defiMarketCap: 0,
      defi24hPercentChange: 0,
      stablecoinVolume24h: 0,
      stablecoinVolume24hReported: 0,
      stablecoinMarketCap: 0,
      stablecoin24hPercentChange: 0,
      derivativesVolume24h: 0,
      derivativesVolume24hReported: 0,
      derivatives24hPercentChange: 0,
      quote: {
        USD: {
          totalMarketCap: 0,
          totalVolume24h: 0,
          totalVolume24hReported: 0,
          altcoinVolume24h: 0,
          altcoinMarketCap: 0,
          defiVolume24h: 0,
          defiMarketCap: 0,
          stablecoinVolume24h: 0,
          stablecoinMarketCap: 0,
          derivativesVolume24h: 0,
          lastUpdated: new Date().toISOString(),
        },
      },
      lastUpdated: new Date().toISOString(),
    },
    topCryptocurrencies: topCryptos,
    topGainers: gainersLosers.gainers,
    topLosers: gainersLosers.losers,
    trending,
    fearGreedIndex: fearGreed || {
      value: 50,
      valueClassification: 'Neutral',
      timestamp: new Date().toISOString(),
      updateTime: '',
    },
    topExchanges: exchanges,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Search cryptocurrencies by name or symbol
 */
export async function searchCryptocurrencies(query: string): Promise<CmcCryptocurrency[]> {
  // CMC doesn't have a search endpoint, so we filter from listings
  const listings = await getLatestListings({ limit: 500 });
  const lowerQuery = query.toLowerCase();

  return listings.filter(crypto =>
    crypto.name.toLowerCase().includes(lowerQuery) ||
    crypto.symbol.toLowerCase().includes(lowerQuery) ||
    crypto.slug.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get cryptocurrency by ID or symbol
 */
export async function getCryptocurrency(idOrSymbol: string | number): Promise<CmcCryptocurrency | null> {
  const isId = typeof idOrSymbol === 'number' || /^\d+$/.test(String(idOrSymbol));
  const params: Record<string, string> = {
    convert: 'USD',
  };

  if (isId) {
    params.id = String(idOrSymbol);
  } else {
    params.symbol = String(idOrSymbol).toUpperCase();
  }

  const data = await cmcFetch<Record<string, CmcCryptocurrency>>('/cryptocurrency/quotes/latest', params);
  
  if (!data) return null;

  const cryptoData = Object.values(data)[0];
  return cryptoData || null;
}

// =============================================================================
// Extended CoinMarketCap API Features
// =============================================================================

export interface CmcCryptoInfo {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  category: string;
  description: string;
  dateAdded: string;
  dateLaunched: string | null;
  logo: string;
  tags: string[];
  tagNames: string[];
  tagGroups: string[];
  platform: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    tokenAddress: string;
  } | null;
  urls: {
    website: string[];
    twitter: string[];
    reddit: string[];
    messageBoard: string[];
    announcement: string[];
    chat: string[];
    explorer: string[];
    sourceCode: string[];
    technicalDoc: string[];
  };
  selfReportedCirculatingSupply: number | null;
  selfReportedTags: string[] | null;
  notice: string | null;
}

export interface CmcOHLCV {
  timeOpen: string;
  timeClose: string;
  timeHigh: string;
  timeLow: string;
  quote: {
    USD: {
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      marketCap: number;
      timestamp: string;
    };
  };
}

export interface CmcMarketPair {
  exchange: {
    id: number;
    name: string;
    slug: string;
  };
  marketId: number;
  marketPair: string;
  category: string;
  feeType: string;
  outlierDetected: number;
  exclusions: string | null;
  quote: {
    exchangeReported: {
      price: number;
      volume24hBase: number;
      volume24hQuote: number;
      lastUpdated: string;
    };
    USD: {
      price: number;
      volume24h: number;
      depth_negative_two: number;
      depth_positive_two: number;
      effectiveLiquidity: number;
      lastUpdated: string;
    };
  };
}

export interface CmcCategory {
  id: string;
  name: string;
  title: string;
  description: string;
  numTokens: number;
  avgPriceChange: number;
  marketCap: number;
  marketCapChange: number;
  volume: number;
  volumeChange: number;
  lastUpdated: string;
}

/**
 * Get detailed metadata/info for cryptocurrencies by ID or symbol.
 * Includes description, logo, social links, tags, and platform info.
 */
export async function getCryptoInfo(
  ids?: number[],
  symbols?: string[],
): Promise<Record<string, CmcCryptoInfo> | null> {
  const params: Record<string, string> = {};
  if (ids?.length) params.id = ids.join(',');
  else if (symbols?.length) params.symbol = symbols.join(',');
  else return null;

  return cmcFetch<Record<string, CmcCryptoInfo>>('/cryptocurrency/info', params);
}

/**
 * Get latest OHLCV quotes for one or more cryptocurrencies.
 */
export async function getOHLCVLatest(
  ids?: number[],
  symbols?: string[],
): Promise<Record<string, CmcOHLCV[]> | null> {
  const params: Record<string, string> = { convert: 'USD' };
  if (ids?.length) params.id = ids.join(',');
  else if (symbols?.length) params.symbol = symbols.join(',');
  else return null;

  return cmcFetch<Record<string, CmcOHLCV[]>>(
    '/cryptocurrency/ohlcv/latest',
    params,
  );
}

/**
 * Get market pairs for a specific cryptocurrency.
 * Shows which exchanges list it and at what price/volume.
 */
export async function getMarketPairs(
  idOrSymbol: string | number,
  options?: { limit?: number; start?: number; sort?: 'volume_24h_strict' | 'cmc_rank' | 'effective_liquidity'; category?: 'spot' | 'derivatives' | 'all' },
): Promise<{ marketPairs: CmcMarketPair[]; numMarketPairs: number } | null> {
  const isId = typeof idOrSymbol === 'number' || /^\d+$/.test(String(idOrSymbol));
  const params: Record<string, string> = {
    convert: 'USD',
    limit: String(options?.limit || 50),
    start: String(options?.start || 1),
    sort: options?.sort || 'volume_24h_strict',
    category: options?.category || 'spot',
  };

  if (isId) params.id = String(idOrSymbol);
  else params.symbol = String(idOrSymbol).toUpperCase();

  const data = await cmcFetch<{
    market_pairs: CmcMarketPair[];
    num_market_pairs: number;
  }>('/cryptocurrency/market-pairs/latest', params);

  if (!data) return null;
  return {
    marketPairs: data.market_pairs || [],
    numMarketPairs: data.num_market_pairs || 0,
  };
}

/**
 * Get cryptocurrency categories (DeFi, Layer 1, Meme, etc.)
 */
export async function getCategories(options?: {
  limit?: number;
  start?: number;
}): Promise<CmcCategory[]> {
  const data = await cmcFetch<CmcCategory[]>('/cryptocurrency/categories', {
    limit: String(options?.limit || 50),
    start: String(options?.start || 1),
  });
  return data || [];
}

/**
 * Get tokens within a specific category.
 */
export async function getCategoryTokens(
  categoryId: string,
  options?: { limit?: number; start?: number },
): Promise<{ name: string; tokens: CmcCryptocurrency[] } | null> {
  const data = await cmcFetch<{
    name: string;
    tokens: CmcCryptocurrency[];
  }>('/cryptocurrency/category', {
    id: categoryId,
    limit: String(options?.limit || 50),
    start: String(options?.start || 1),
    convert: 'USD',
  });
  return data;
}

/**
 * Get CMC's native trending cryptocurrencies (v1 endpoint).
 */
export async function getTrendingNative(): Promise<CmcCryptocurrency[]> {
  const data = await cmcFetch<CmcCryptocurrency[]>(
    '/cryptocurrency/trending/latest',
    { limit: '30', convert: 'USD' },
  );
  return data || [];
}

/**
 * Get most-visited cryptocurrencies on CoinMarketCap.
 */
export async function getMostVisited(): Promise<CmcCryptocurrency[]> {
  const data = await cmcFetch<CmcCryptocurrency[]>(
    '/cryptocurrency/trending/most-visited',
    { limit: '30', convert: 'USD' },
  );
  return data || [];
}

/**
 * Get native gainers/losers endpoint from CMC.
 * More accurate than the synthetic approach.
 */
export async function getGainersLosersNative(options?: {
  timePeriod?: '1h' | '24h' | '7d' | '30d';
  limit?: number;
}): Promise<{ gainers: CmcCryptocurrency[]; losers: CmcCryptocurrency[] } | null> {
  const data = await cmcFetch<{
    gainers: CmcCryptocurrency[];
    losers: CmcCryptocurrency[];
  }>('/cryptocurrency/trending/gainers-losers', {
    limit: String(options?.limit || 20),
    time_period: options?.timePeriod || '24h',
    convert: 'USD',
  });
  return data;
}

/**
 * Get CMC ID map for all active cryptocurrencies.
 * Useful for resolving slugs, symbols, or IDs.
 */
export async function getIdMap(options?: {
  listingStatus?: 'active' | 'inactive' | 'untracked';
  limit?: number;
  sort?: 'id' | 'cmc_rank';
  symbol?: string;
}): Promise<Array<{
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  isActive: number;
  platform: { id: number; name: string; symbol: string; tokenAddress: string } | null;
}>> {
  const params: Record<string, string> = {
    listing_status: options?.listingStatus || 'active',
    limit: String(options?.limit || 200),
    sort: options?.sort || 'cmc_rank',
  };
  if (options?.symbol) params.symbol = options.symbol;

  const data = await cmcFetch<Array<{
    id: number;
    name: string;
    symbol: string;
    slug: string;
    rank: number;
    is_active: number;
    platform: { id: number; name: string; symbol: string; token_address: string } | null;
  }>>('/cryptocurrency/map', params);

  if (!data) return [];
  return data.map(d => ({
    id: d.id,
    name: d.name,
    symbol: d.symbol,
    slug: d.slug,
    rank: d.rank,
    isActive: d.is_active,
    platform: d.platform ? { id: d.platform.id, name: d.platform.name, symbol: d.platform.symbol, tokenAddress: d.platform.token_address } : null,
  }));
}

/**
 * Get fiat currency map (USD, EUR, etc.)
 */
export async function getFiatMap(): Promise<Array<{
  id: number;
  name: string;
  sign: string;
  symbol: string;
}>> {
  const data = await cmcFetch<Array<{
    id: number;
    name: string;
    sign: string;
    symbol: string;
  }>>('/fiat/map', { include_metals: 'true' });
  return data || [];
}
