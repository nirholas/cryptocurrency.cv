/**
 * CoinMarketCap API Integration
 * 
 * Professional-grade cryptocurrency market data including rankings,
 * global metrics, and CMC-specific metadata.
 * 
 * @see https://coinmarketcap.com/api/documentation/v1/
 * @module lib/apis/coinmarketcap
 */

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

    const response = await fetch(url.toString(), {
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
    const response = await fetch('https://api.alternative.me/fng/?limit=1', {
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
