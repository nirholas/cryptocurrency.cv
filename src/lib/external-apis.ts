/**
 * External APIs Integration
 *
 * Aggregates data from multiple free cryptocurrency APIs:
 * - CoinCap (https://coincap.io)
 * - CoinPaprika (https://coinpaprika.com)
 * - CoinLore (https://coinlore.com)
 *
 * @module external-apis
 */

// =============================================================================
// API ENDPOINTS
// =============================================================================

export const EXTERNAL_APIS = {
  COINCAP: 'https://api.coincap.io/v2',
  COINPAPRIKA: 'https://api.coinpaprika.com/v1',
  COINLORE: 'https://api.coinlore.net/api',
  BINANCE: 'https://api.binance.com/api/v3',
  BINANCE_FUTURES: 'https://fapi.binance.com',
  BYBIT: 'https://api.bybit.com/v5',
  DYDX: 'https://api.dydx.exchange/v3',
  OKX: 'https://www.okx.com/api/v5',
  MEMPOOL: 'https://mempool.space/api',
  BLOCKCHAIN_INFO: 'https://blockchain.info',
  LLAMA_YIELDS: 'https://yields.llama.fi',
} as const;

const COINCAP_BASE = EXTERNAL_APIS.COINCAP;
const COINPAPRIKA_BASE = EXTERNAL_APIS.COINPAPRIKA;
const COINLORE_BASE = EXTERNAL_APIS.COINLORE;

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Cache TTL configuration (in seconds)
 * Different data types have different freshness requirements
 */
export const CACHE_TTL = {
  ticker: 10,         // Price tickers - need to be fresh
  trades: 5,          // Recent trades - very fresh
  orderbook: 5,       // Order book - very fresh
  ohlc: 60,           // Candlestick data - 1 minute
  historical_7d: 300, // Weekly historical - 5 minutes
  historical_1d: 60,  // Daily historical - 1 minute
  static: 3600,       // Static data (exchange info) - 1 hour
  funding: 60,        // Funding rates - 1 minute
  openInterest: 30,   // Open interest - 30 seconds
  prices: 30,         // General prices
  fees: 60,           // Network fees
  blocks: 60,         // Block data
  mempool: 30,        // Mempool data
  markets: 60,        // Markets data
  global: 60,         // Global stats
  search: 300,        // Search results
  yields: 300,        // DeFi yields
} as const;

// Legacy constant for backwards compatibility
const CACHE_TTL_MS = 30000; // 30 seconds in milliseconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// BINANCE TYPES (for binance.ts)
// =============================================================================

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceFundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice: string;
}

export interface BinanceOpenInterest {
  symbol: string;
  openInterest: string;
  time: number;
}

// =============================================================================
// DYDX TYPES (for derivatives.ts)
// =============================================================================

export interface DydxMarket {
  market: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  stepSize: string;
  tickSize: string;
  indexPrice: string;
  oraclePrice: string;
  priceChange24H: string;
  nextFundingRate: string;
  nextFundingAt: string;
  minOrderSize: string;
  type: string;
  initialMarginFraction: string;
  maintenanceMarginFraction: string;
  transferMarginFraction: string;
  volume24H: string;
  trades24H: string;
  openInterest: string;
  incrementalInitialMarginFraction: string;
  incrementalPositionSize: string;
  maxPositionSize: string;
  baselinePositionSize: string;
  assetResolution: string;
  syntheticAssetId: string;
}

// =============================================================================
// MEMPOOL TYPES (for bitcoin-onchain.ts)
// =============================================================================

export interface MempoolFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface MempoolBlock {
  blockSize: number;
  blockVSize: number;
  nTx: number;
  totalFees: number;
  medianFee: number;
  feeRange: number[];
}

// =============================================================================
// COINPAPRIKA TYPES (for coinpaprika.ts)
// =============================================================================

export interface CoinPaprikaTicker {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  beta_value: number;
  first_data_at: string;
  last_updated: string;
  quotes: {
    USD: {
      price: number;
      volume_24h: number;
      volume_24h_change_24h: number;
      market_cap: number;
      market_cap_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_1y: number;
      ath_price: number;
      ath_date: string;
      percent_from_price_ath: number;
    };
  };
}

// =============================================================================
// DEFI LLAMA TYPES (for defi-yields.ts)
// =============================================================================

export interface LlamaYieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  poolMeta: string | null;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[] | null;
  il7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
}

// =============================================================================
// COINCAP API
// =============================================================================

export interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
  explorer: string;
}

export interface CoinCapHistoryPoint {
  priceUsd: string;
  time: number;
  date: string;
}

/**
 * Get a single asset from CoinCap
 */
export async function getCoinCapAsset(id: string): Promise<CoinCapAsset> {
  const cacheKey = `coincap-asset-${id}`;
  const cached = getCached<CoinCapAsset>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINCAP_BASE}/assets/${id}`);
  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const json = await response.json();
  setCache(cacheKey, json.data);
  return json.data;
}

/**
 * Get multiple assets from CoinCap
 */
export async function getCoinCapAssets(limit = 100): Promise<CoinCapAsset[]> {
  const cacheKey = `coincap-assets-${limit}`;
  const cached = getCached<CoinCapAsset[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINCAP_BASE}/assets?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const json = await response.json();
  setCache(cacheKey, json.data);
  return json.data;
}

/**
 * Get price history for an asset from CoinCap
 */
export async function getCoinCapHistory(
  id: string,
  interval: 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h2' | 'h6' | 'h12' | 'd1' = 'h1'
): Promise<CoinCapHistoryPoint[]> {
  const cacheKey = `coincap-history-${id}-${interval}`;
  const cached = getCached<CoinCapHistoryPoint[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINCAP_BASE}/assets/${id}/history?interval=${interval}`);
  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const json = await response.json();
  setCache(cacheKey, json.data);
  return json.data;
}

// =============================================================================
// COINPAPRIKA API
// =============================================================================

export interface CoinPaprikaGlobal {
  market_cap_usd: number;
  volume_24h_usd: number;
  bitcoin_dominance_percentage: number;
  cryptocurrencies_number: number;
  market_cap_ath_value: number;
  market_cap_ath_date: string;
  volume_24h_ath_value: number;
  volume_24h_ath_date: string;
  market_cap_change_24h: number;
  volume_24h_change_24h: number;
  last_updated: number;
}

/**
 * Get global market data from CoinPaprika
 */
export async function getCoinPaprikaGlobal(): Promise<CoinPaprikaGlobal> {
  const cacheKey = 'coinpaprika-global';
  const cached = getCached<CoinPaprikaGlobal>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINPAPRIKA_BASE}/global`);
  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

// =============================================================================
// COINLORE API
// =============================================================================

export interface CoinLoreGlobal {
  coins_count: number;
  active_markets: number;
  total_mcap: number;
  total_volume: number;
  btc_d: string;
  eth_d: string;
  mcap_change: string;
  volume_change: string;
  avg_change_percent: string;
  volume_ath: number;
  mcap_ath: number;
}

/**
 * Get global market data from CoinLore
 */
export async function getCoinLoreGlobal(): Promise<CoinLoreGlobal> {
  const cacheKey = 'coinlore-global';
  const cached = getCached<CoinLoreGlobal>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINLORE_BASE}/global/`);
  if (!response.ok) {
    throw new Error(`CoinLore API error: ${response.status}`);
  }

  const data = await response.json();
  const globalData = Array.isArray(data) ? data[0] : data;
  setCache(cacheKey, globalData);
  return globalData;
}

// =============================================================================
// AGGREGATED DATA
// =============================================================================

export interface AggregatedGlobalData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  totalCoins: number;
  totalExchanges: number;
  marketCapChange24h: number;
  sources: string[];
  lastUpdated: string;
}

/**
 * Get aggregated global market data from multiple sources
 */
export async function getAggregatedGlobalData(): Promise<AggregatedGlobalData> {
  const cacheKey = 'aggregated-global';
  const cached = getCached<AggregatedGlobalData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch from multiple sources in parallel
    const [paprikaData, coinloreData] = await Promise.allSettled([
      getCoinPaprikaGlobal(),
      getCoinLoreGlobal(),
    ]);

    // Use CoinPaprika as primary, CoinLore as fallback
    let totalMarketCap = 0;
    let totalVolume24h = 0;
    let btcDominance = 0;
    let ethDominance = 0;
    let totalCoins = 0;
    let totalExchanges = 0;
    let marketCapChange24h = 0;
    const sources: string[] = [];

    if (paprikaData.status === 'fulfilled') {
      const data = paprikaData.value;
      totalMarketCap = data.market_cap_usd;
      totalVolume24h = data.volume_24h_usd;
      btcDominance = data.bitcoin_dominance_percentage;
      totalCoins = data.cryptocurrencies_number;
      marketCapChange24h = data.market_cap_change_24h;
      sources.push('coinpaprika');
    }

    if (coinloreData.status === 'fulfilled') {
      const data = coinloreData.value;
      if (!totalMarketCap) totalMarketCap = data.total_mcap;
      if (!totalVolume24h) totalVolume24h = data.total_volume;
      if (!btcDominance) btcDominance = parseFloat(data.btc_d);
      ethDominance = parseFloat(data.eth_d);
      if (!totalCoins) totalCoins = data.coins_count;
      totalExchanges = data.active_markets;
      if (!marketCapChange24h) marketCapChange24h = parseFloat(data.mcap_change);
      sources.push('coinlore');
    }

    const result: AggregatedGlobalData = {
      totalMarketCap,
      totalVolume24h,
      btcDominance,
      ethDominance,
      totalCoins,
      totalExchanges,
      marketCapChange24h,
      sources,
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching aggregated global data:', error);
    throw error;
  }
}

export interface AggregatedAsset {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  supply: number;
  maxSupply: number | null;
  sources: string[];
}

/**
 * Get aggregated assets from multiple sources
 */
export async function getAggregatedAssets(limit = 100): Promise<AggregatedAsset[]> {
  const cacheKey = `aggregated-assets-${limit}`;
  const cached = getCached<AggregatedAsset[]>(cacheKey);
  if (cached) return cached;

  try {
    const assets = await getCoinCapAssets(limit);

    const result = assets.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      rank: parseInt(asset.rank, 10),
      price: parseFloat(asset.priceUsd),
      marketCap: parseFloat(asset.marketCapUsd),
      volume24h: parseFloat(asset.volumeUsd24Hr),
      change24h: parseFloat(asset.changePercent24Hr),
      supply: parseFloat(asset.supply),
      maxSupply: asset.maxSupply ? parseFloat(asset.maxSupply) : null,
      sources: ['coincap'],
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching aggregated assets:', error);
    throw error;
  }
}
