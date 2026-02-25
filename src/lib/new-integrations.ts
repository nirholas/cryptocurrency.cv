/**
 * New Data Source Integrations — High-value APIs not yet in the codebase
 *
 * Each integration uses the scale primitives (singleflight, cache gateway,
 * adaptive rate limiting, fetch pool) for production-grade reliability.
 *
 * Sources added:
 * - CoinMarketCap (market cap authority)
 * - Hyperliquid (fastest-growing DEX)
 * - GeckoTerminal (DEX-native data)
 * - LunarCrush (social intelligence)
 * - Glassnode (on-chain analytics)
 * - Etherscan (gas + contracts)
 * - L2BEAT (Layer 2 TVL)
 * - CoinGlass (derivatives aggregator)
 * - DefiLlama Stablecoins (stablecoin flows)
 * - Birdeye (Solana tokens)
 * - Pyth Network (oracle prices)
 * - Dune Analytics (on-chain queries)
 * - Messari (research + profiles)
 * - LunarCrush v4 (social galaxy score)
 * - Kraken (exchange data)
 *
 * @module lib/new-integrations
 */

import {
  scaleFetch,
  AdaptiveRateLimiter,
} from './scale';

// =============================================================================
// RATE LIMITERS (one per external API)
// =============================================================================

const limiters = {
  cmc:           new AdaptiveRateLimiter(30, 0.5),
  hyperliquid:   new AdaptiveRateLimiter(120, 2),
  geckoTerminal: new AdaptiveRateLimiter(30, 0.5),
  lunarcrush:    new AdaptiveRateLimiter(10, 0.17),
  glassnode:     new AdaptiveRateLimiter(10, 0.17),
  etherscan:     new AdaptiveRateLimiter(5, 5),
  l2beat:        new AdaptiveRateLimiter(30, 0.5),
  coinglass:     new AdaptiveRateLimiter(30, 0.5),
  llamaStables:  new AdaptiveRateLimiter(100, 1.67),
  birdeye:       new AdaptiveRateLimiter(100, 1.67),
  pyth:          new AdaptiveRateLimiter(100, 1.67),
  dune:          new AdaptiveRateLimiter(40, 0.67),
  messari:       new AdaptiveRateLimiter(20, 0.33),
  kraken:        new AdaptiveRateLimiter(15, 0.25),
};

// =============================================================================
// COINMARKETCAP
// =============================================================================

export interface CMCListing {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      market_cap_dominance: number;
    };
  };
}

/**
 * Fetch top coins from CoinMarketCap.
 * Requires CMC_API_KEY env var.
 */
export async function getCMCListings(limit = 100): Promise<CMCListing[]> {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return [];

  const data = await scaleFetch<{ data: CMCListing[] }>(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`,
    {
      cacheKey: `cmc-listings-${limit}`,
      cacheTtl: 60,
      rateLimiter: limiters.cmc,
      fetchInit: { headers: { 'X-CMC_PRO_API_KEY': apiKey } },
      metricsLabel: 'coinmarketcap',
    }
  );

  return data?.data ?? [];
}

/** Fetch CMC global metrics (total market cap, BTC dominance, etc.) */
export async function getCMCGlobalMetrics() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return null;

  return scaleFetch<{ data: Record<string, unknown> }>(
    'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest',
    {
      cacheKey: 'cmc-global',
      cacheTtl: 120,
      rateLimiter: limiters.cmc,
      fetchInit: { headers: { 'X-CMC_PRO_API_KEY': apiKey } },
      metricsLabel: 'coinmarketcap',
    }
  );
}

// =============================================================================
// HYPERLIQUID
// =============================================================================

export interface HyperliquidMarket {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface HyperliquidAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  impactPxs: string[];
}

/** Fetch all Hyperliquid perpetual markets + context (funding, OI, prices) */
export async function getHyperliquidMarkets(): Promise<{
  universe: HyperliquidMarket[];
  contexts: HyperliquidAssetCtx[];
}> {
  const data = await scaleFetch<[{ universe: HyperliquidMarket[] }, HyperliquidAssetCtx[]]>(
    'https://api.hyperliquid.xyz/info',
    {
      cacheKey: 'hl-meta-and-ctx',
      cacheTtl: 15,
      rateLimiter: limiters.hyperliquid,
      fetchInit: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      },
      metricsLabel: 'hyperliquid',
    }
  );

  return {
    universe: data?.[0]?.universe ?? [],
    contexts: data?.[1] ?? [],
  };
}

/** Fetch Hyperliquid recent user fills/liquidations */
export async function getHyperliquidLiquidations(): Promise<unknown[]> {
  return scaleFetch<unknown[]>(
    'https://api.hyperliquid.xyz/info',
    {
      cacheKey: 'hl-liquidations',
      cacheTtl: 10,
      rateLimiter: limiters.hyperliquid,
      fetchInit: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'userFills', user: '0x0000000000000000000000000000000000000000' }),
      },
      metricsLabel: 'hyperliquid',
    }
  );
}

// =============================================================================
// GECKOTERMINAL (DEX data, no key needed)
// =============================================================================

export interface GeckoTerminalPool {
  id: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: Record<string, string>;
    transactions: Record<string, { buys: number; sells: number }>;
    volume_usd: Record<string, string>;
    reserve_in_usd: string;
  };
}

/** Fetch trending pools across all DEXes */
export async function getGeckoTerminalTrending(network = 'eth'): Promise<GeckoTerminalPool[]> {
  const data = await scaleFetch<{ data: GeckoTerminalPool[] }>(
    `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`,
    {
      cacheKey: `gt-trending-${network}`,
      cacheTtl: 30,
      rateLimiter: limiters.geckoTerminal,
      metricsLabel: 'geckoterminal',
    }
  );
  return data?.data ?? [];
}

/** Fetch top pools on a specific DEX */
export async function getGeckoTerminalDexPools(network: string, dexId: string): Promise<GeckoTerminalPool[]> {
  const data = await scaleFetch<{ data: GeckoTerminalPool[] }>(
    `https://api.geckoterminal.com/api/v2/networks/${network}/dexes/${dexId}/pools?sort=h24_volume_usd_liquidity_desc`,
    {
      cacheKey: `gt-dex-${network}-${dexId}`,
      cacheTtl: 30,
      rateLimiter: limiters.geckoTerminal,
      metricsLabel: 'geckoterminal',
    }
  );
  return data?.data ?? [];
}

/** Get new pools (just deployed) */
export async function getGeckoTerminalNewPools(network = 'eth'): Promise<GeckoTerminalPool[]> {
  const data = await scaleFetch<{ data: GeckoTerminalPool[] }>(
    `https://api.geckoterminal.com/api/v2/networks/${network}/new_pools`,
    {
      cacheKey: `gt-new-${network}`,
      cacheTtl: 60,
      rateLimiter: limiters.geckoTerminal,
      metricsLabel: 'geckoterminal',
    }
  );
  return data?.data ?? [];
}

// =============================================================================
// LUNARCRUSH (Social Intelligence)
// =============================================================================

export interface LunarCrushAsset {
  id: number;
  symbol: string;
  name: string;
  price: number;
  price_btc: number;
  volume_24h: number;
  market_cap: number;
  galaxy_score: number;
  alt_rank: number;
  social_volume: number;
  social_score: number;
  social_dominance: number;
  sentiment: number;
  categories: string[];
}

/** Fetch LunarCrush Galaxy Scores (social intelligence rankings) */
export async function getLunarCrushAssets(limit = 50): Promise<LunarCrushAsset[]> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  if (!apiKey) return [];

  const data = await scaleFetch<{ data: LunarCrushAsset[] }>(
    `https://lunarcrush.com/api4/public/coins/list/v2?sort=galaxy_score&limit=${limit}`,
    {
      cacheKey: `lc-assets-${limit}`,
      cacheTtl: 120,
      rateLimiter: limiters.lunarcrush,
      fetchInit: { headers: { Authorization: `Bearer ${apiKey}` } },
      metricsLabel: 'lunarcrush',
    }
  );

  return data?.data ?? [];
}

// =============================================================================
// GLASSNODE (On-chain Analytics)
// =============================================================================

export interface GlassnodeMetric {
  t: number;  // timestamp
  v: number;  // value
}

/** Fetch a Glassnode on-chain metric */
export async function getGlassnodeMetric(
  asset: string,
  metric: string,
  resolution = '24h'
): Promise<GlassnodeMetric[]> {
  const apiKey = process.env.GLASSNODE_API_KEY;
  if (!apiKey) return [];

  return scaleFetch<GlassnodeMetric[]>(
    `https://api.glassnode.com/v1/metrics/${metric}?a=${asset}&i=${resolution}&api_key=${apiKey}`,
    {
      cacheKey: `gn-${asset}-${metric}-${resolution}`,
      cacheTtl: 300,
      rateLimiter: limiters.glassnode,
      metricsLabel: 'glassnode',
    }
  );
}

/** Commonly used Glassnode metrics */
export const GLASSNODE_METRICS = {
  // Market
  mvrv: 'market/mvrv',
  sopr: 'indicators/sopr',
  nupl: 'indicators/net_unrealized_profit_loss',
  // Supply
  exchangeBalance: 'distribution/balance_exchanges',
  supplyIlliquid: 'supply/supply_illiquid',
  // Network
  activeAddresses: 'addresses/active_count',
  transactionCount: 'transactions/count',
  // Fees
  feesMean: 'fees/fee_mean',
  // Mining
  hashRate: 'mining/hash_rate_mean',
  difficulty: 'mining/difficulty_latest',
};

// =============================================================================
// ETHERSCAN (Ethereum)
// =============================================================================

/** Fetch current Ethereum gas prices */
export async function getEthGasPrice(): Promise<{
  safeGasPrice: string;
  proposeGasPrice: string;
  fastGasPrice: string;
  suggestBaseFee: string;
} | null> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) return null;

  const data = await scaleFetch<{ result: Record<string, string> }>(
    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`,
    {
      cacheKey: 'eth-gas',
      cacheTtl: 15,
      rateLimiter: limiters.etherscan,
      metricsLabel: 'etherscan',
    }
  );

  return data?.result ? {
    safeGasPrice: data.result.SafeGasPrice,
    proposeGasPrice: data.result.ProposeGasPrice,
    fastGasPrice: data.result.FastGasPrice,
    suggestBaseFee: data.result.suggestBaseFee,
  } : null;
}

/** Fetch ETH supply stats */
export async function getEthSupply(): Promise<{ ethSupply: string; eth2Staking: string; burntFees: string } | null> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) return null;

  const data = await scaleFetch<{ result: Record<string, string> }>(
    `https://api.etherscan.io/api?module=stats&action=ethsupply2&apikey=${apiKey}`,
    {
      cacheKey: 'eth-supply',
      cacheTtl: 300,
      rateLimiter: limiters.etherscan,
      metricsLabel: 'etherscan',
    }
  );

  return data?.result ? {
    ethSupply: data.result.EthSupply,
    eth2Staking: data.result.Eth2Staking,
    burntFees: data.result.BurntFees,
  } : null;
}

// =============================================================================
// L2BEAT (Layer 2 data)
// =============================================================================

export interface L2BeatTVL {
  timestamp: string;
  usd: number;
  eth: number;
}

/** Fetch Layer 2 TVL data */
export async function getL2BeatTVL(): Promise<unknown> {
  return scaleFetch(
    'https://l2beat.com/api/scaling/tvl',
    {
      cacheKey: 'l2beat-tvl',
      cacheTtl: 300,
      rateLimiter: limiters.l2beat,
      metricsLabel: 'l2beat',
    }
  );
}

/** Fetch Layer 2 activity (TPS) */
export async function getL2BeatActivity(): Promise<unknown> {
  return scaleFetch(
    'https://l2beat.com/api/scaling/activity',
    {
      cacheKey: 'l2beat-activity',
      cacheTtl: 300,
      rateLimiter: limiters.l2beat,
      metricsLabel: 'l2beat',
    }
  );
}

// =============================================================================
// COINGLASS (Derivatives aggregator)
// =============================================================================

/** Fetch aggregated open interest across exchanges */
export async function getCoinglassOpenInterest(symbol = 'BTC'): Promise<unknown> {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) return null;

  return scaleFetch(
    `https://open-api-v3.coinglass.com/api/futures/openInterest/chart?symbol=${symbol}&interval=0`,
    {
      cacheKey: `cg-oi-${symbol}`,
      cacheTtl: 30,
      rateLimiter: limiters.coinglass,
      fetchInit: { headers: { coinglassSecret: apiKey } },
      metricsLabel: 'coinglass',
    }
  );
}

/** Fetch aggregated liquidation data */
export async function getCoinglassLiquidations(symbol = 'BTC'): Promise<unknown> {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) return null;

  return scaleFetch(
    `https://open-api-v3.coinglass.com/api/futures/liquidation/chart?symbol=${symbol}&interval=0`,
    {
      cacheKey: `cg-liq-${symbol}`,
      cacheTtl: 30,
      rateLimiter: limiters.coinglass,
      fetchInit: { headers: { coinglassSecret: apiKey } },
      metricsLabel: 'coinglass',
    }
  );
}

/** Fetch funding rate heatmap */
export async function getCoinglassFundingRates(): Promise<unknown> {
  const apiKey = process.env.COINGLASS_API_KEY;
  if (!apiKey) return null;

  return scaleFetch(
    'https://open-api-v3.coinglass.com/api/futures/funding/info',
    {
      cacheKey: 'cg-funding',
      cacheTtl: 60,
      rateLimiter: limiters.coinglass,
      fetchInit: { headers: { coinglassSecret: apiKey } },
      metricsLabel: 'coinglass',
    }
  );
}

// =============================================================================
// DEFILLAMA STABLECOINS
// =============================================================================

export interface StablecoinData {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  totalCirculatingUSD: Record<string, number>;
  chains: string[];
}

/** Fetch stablecoin market overview */
export async function getStablecoinOverview(): Promise<StablecoinData[]> {
  const data = await scaleFetch<{ peggedAssets: StablecoinData[] }>(
    'https://stablecoins.llama.fi/stablecoins?includePrices=true',
    {
      cacheKey: 'llama-stablecoins',
      cacheTtl: 300,
      rateLimiter: limiters.llamaStables,
      metricsLabel: 'defillama_stables',
    }
  );
  return data?.peggedAssets ?? [];
}

/** Fetch stablecoin chain distribution */
export async function getStablecoinChains(): Promise<unknown> {
  return scaleFetch(
    'https://stablecoins.llama.fi/stablecoinchains',
    {
      cacheKey: 'llama-stablecoin-chains',
      cacheTtl: 300,
      rateLimiter: limiters.llamaStables,
      metricsLabel: 'defillama_stables',
    }
  );
}

// =============================================================================
// BIRDEYE (Solana / Multi-chain)
// =============================================================================

export interface BirdeyeToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  mc: number;
}

/** Fetch trending tokens on Solana */
export async function getBirdeyeTrending(chain = 'solana', limit = 20): Promise<BirdeyeToken[]> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) return [];

  const data = await scaleFetch<{ data: { tokens: BirdeyeToken[] } }>(
    `https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=${limit}`,
    {
      cacheKey: `birdeye-trending-${chain}-${limit}`,
      cacheTtl: 60,
      rateLimiter: limiters.birdeye,
      fetchInit: {
        headers: {
          'X-API-KEY': apiKey,
          'x-chain': chain,
        },
      },
      metricsLabel: 'birdeye',
    }
  );
  return data?.data?.tokens ?? [];
}

// =============================================================================
// PYTH NETWORK (Oracle prices — real-time)
// =============================================================================

export interface PythPriceFeed {
  id: string;
  price: { price: string; conf: string; expo: number; publish_time: number };
  ema_price: { price: string; conf: string; expo: number; publish_time: number };
}

/** Fetch latest oracle prices from Pyth Network */
export async function getPythPrices(feedIds: string[]): Promise<PythPriceFeed[]> {
  const ids = feedIds.map(id => `ids[]=${id}`).join('&');
  const data = await scaleFetch<{ parsed: PythPriceFeed[] }>(
    `https://hermes.pyth.network/v2/updates/price/latest?${ids}`,
    {
      cacheKey: `pyth-prices-${feedIds.join(',')}`,
      cacheTtl: 5, // Oracle data should be very fresh
      rateLimiter: limiters.pyth,
      metricsLabel: 'pyth',
    }
  );
  return data?.parsed ?? [];
}

/** Common Pyth feed IDs */
export const PYTH_FEEDS = {
  BTC_USD: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH_USD: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL_USD: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
};

// =============================================================================
// DUNE ANALYTICS
// =============================================================================

/** Execute a Dune query and get results */
export async function getDuneQueryResults(queryId: number): Promise<unknown> {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) return null;

  return scaleFetch(
    `https://api.dune.com/api/v1/query/${queryId}/results`,
    {
      cacheKey: `dune-${queryId}`,
      cacheTtl: 600, // Dune queries are expensive, cache aggressively
      rateLimiter: limiters.dune,
      fetchInit: { headers: { 'X-Dune-API-Key': apiKey } },
      metricsLabel: 'dune',
    }
  );
}

/** Useful pre-built Dune queries */
export const DUNE_QUERIES = {
  ethBurned: 2699069,           // Total ETH burned since EIP-1559
  defiTVL: 3316530,             // DeFi TVL by protocol
  nftVolume: 3474939,           // NFT marketplace volumes
  bridgeVolume: 3451533,        // Cross-chain bridge volumes
  stablecoinSupply: 3302223,    // Stablecoin supply breakdown
  l2Transactions: 3457199,      // L2 transaction counts
  topDexVolume: 3498428,        // Top DEX by volume
};

// =============================================================================
// MESSARI
// =============================================================================

export interface MessariAsset {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  metrics: {
    market_data: {
      price_usd: number;
      volume_last_24_hours: number;
      percent_change_usd_last_24_hours: number;
    };
    marketcap: {
      current_marketcap_usd: number;
      rank: number;
    };
    developer_activity: {
      stars: number;
      commits_last_4_weeks: number;
      watchers: number;
    };
    roi_data: {
      percent_change_last_1_week: number;
      percent_change_last_1_month: number;
      percent_change_last_1_year: number;
    };
  };
  profile: {
    general: {
      overview: { tagline: string; project_details: string };
    };
  };
}

/** Fetch Messari asset profile + metrics */
export async function getMessariAsset(slug: string): Promise<MessariAsset | null> {
  const apiKey = process.env.MESSARI_API_KEY;

  const data = await scaleFetch<{ data: MessariAsset }>(
    `https://data.messari.io/api/v2/assets/${slug}/profile`,
    {
      cacheKey: `messari-${slug}`,
      cacheTtl: 600,
      rateLimiter: limiters.messari,
      fetchInit: apiKey ? { headers: { 'x-messari-api-key': apiKey } } : undefined,
      metricsLabel: 'messari',
    }
  );
  return data?.data ?? null;
}

/** Fetch Messari top assets with metrics */
export async function getMessariAssets(limit = 30): Promise<MessariAsset[]> {
  const apiKey = process.env.MESSARI_API_KEY;

  const data = await scaleFetch<{ data: MessariAsset[] }>(
    `https://data.messari.io/api/v2/assets?limit=${limit}&fields=id,symbol,name,slug,metrics`,
    {
      cacheKey: `messari-assets-${limit}`,
      cacheTtl: 120,
      rateLimiter: limiters.messari,
      fetchInit: apiKey ? { headers: { 'x-messari-api-key': apiKey } } : undefined,
      metricsLabel: 'messari',
    }
  );
  return data?.data ?? [];
}

// =============================================================================
// KRAKEN
// =============================================================================

export interface KrakenTicker {
  a: [string, string, string]; // ask [price, wholeLotVol, lotVol]
  b: [string, string, string]; // bid
  c: [string, string];         // last trade closed [price, lotVol]
  v: [string, string];         // volume [today, last24h]
  p: [string, string];         // vwap [today, last24h]
  t: [number, number];         // number of trades [today, last24h]
  l: [string, string];         // low [today, last24h]
  h: [string, string];         // high [today, last24h]
  o: string;                   // today's opening price
}

/** Fetch Kraken ticker data */
export async function getKrakenTickers(pairs: string[] = ['XBTUSD', 'ETHUSD', 'SOLUSD']): Promise<Record<string, KrakenTicker>> {
  const pairStr = pairs.join(',');

  const data = await scaleFetch<{ error: string[]; result: Record<string, KrakenTicker> }>(
    `https://api.kraken.com/0/public/Ticker?pair=${pairStr}`,
    {
      cacheKey: `kraken-ticker-${pairStr}`,
      cacheTtl: 15,
      rateLimiter: limiters.kraken,
      metricsLabel: 'kraken',
    }
  );

  return data?.result ?? {};
}

// =============================================================================
// AGGREGATE: Multi-source data fusion helpers
// =============================================================================

/**
 * Fetch market data from all available sources and merge.
 * Uses singleflight + cache to be efficient even under massive load.
 */
export async function getMultiSourceMarketData(coinIds: string[] = ['bitcoin', 'ethereum', 'solana']) {
  const [cmc, gecko, messari, kraken] = await Promise.allSettled([
    getCMCListings(20),
    scaleFetch<Record<string, { usd: number; usd_24h_change: number }>>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { cacheKey: `cg-simple-${coinIds.join(',')}`, cacheTtl: 30, metricsLabel: 'coingecko' }
    ),
    getMessariAssets(10),
    getKrakenTickers(),
  ]);

  return {
    coinmarketcap: cmc.status === 'fulfilled' ? cmc.value : [],
    coingecko: gecko.status === 'fulfilled' ? gecko.value : {},
    messari: messari.status === 'fulfilled' ? messari.value : [],
    kraken: kraken.status === 'fulfilled' ? kraken.value : {},
    sources: [
      cmc.status === 'fulfilled' ? 'coinmarketcap' : null,
      gecko.status === 'fulfilled' ? 'coingecko' : null,
      messari.status === 'fulfilled' ? 'messari' : null,
      kraken.status === 'fulfilled' ? 'kraken' : null,
    ].filter(Boolean),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch DeFi data from all available sources.
 */
export async function getMultiSourceDeFiData() {
  const [tvl, stablecoins, l2tvl, l2activity] = await Promise.allSettled([
    scaleFetch<{ protocols: unknown[] }>(
      'https://api.llama.fi/protocols',
      { cacheKey: 'llama-protocols', cacheTtl: 300, metricsLabel: 'defillama' }
    ),
    getStablecoinOverview(),
    getL2BeatTVL(),
    getL2BeatActivity(),
  ]);

  return {
    protocols: tvl.status === 'fulfilled' ? tvl.value : null,
    stablecoins: stablecoins.status === 'fulfilled' ? stablecoins.value : [],
    l2tvl: l2tvl.status === 'fulfilled' ? l2tvl.value : null,
    l2activity: l2activity.status === 'fulfilled' ? l2activity.value : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch derivatives data from all available sources.
 */
export async function getMultiSourceDerivativesData() {
  const [hl, cgOI, cgFunding] = await Promise.allSettled([
    getHyperliquidMarkets(),
    getCoinglassOpenInterest('BTC'),
    getCoinglassFundingRates(),
  ]);

  return {
    hyperliquid: hl.status === 'fulfilled' ? hl.value : null,
    coinglassOI: cgOI.status === 'fulfilled' ? cgOI.value : null,
    coinglassFunding: cgFunding.status === 'fulfilled' ? cgFunding.value : null,
    timestamp: new Date().toISOString(),
  };
}
