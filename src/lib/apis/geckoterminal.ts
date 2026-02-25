/**
 * GeckoTerminal DEX Analytics API
 *
 * Free, keyless API by CoinGecko for on-chain DEX data.
 * Trending pools, token prices, OHLCV, trades, and liquidity across 100+ networks.
 *
 * @see https://www.geckoterminal.com/dex-api
 * @module lib/apis/geckoterminal
 */

const BASE_URL = 'https://api.geckoterminal.com/api/v2';

// =============================================================================
// Types
// =============================================================================

export interface DexPool {
  id: string;
  type: 'pool';
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: {
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      h1: { buys: number; sells: number; buyers: number; sellers: number };
      h6: { buys: number; sells: number; buyers: number; sellers: number };
      h24: { buys: number; sells: number; buyers: number; sellers: number };
    };
    volume_usd: {
      h1: string;
      h6: string;
      h24: string;
    };
    reserve_in_usd: string;
    pool_created_at: string;
  };
  relationships?: {
    base_token: { data: { id: string; type: string } };
    quote_token: { data: { id: string; type: string } };
    dex: { data: { id: string; type: string } };
  };
}

export interface TrendingPool {
  id: string;
  name: string;
  address: string;
  network: string;
  dex: string;
  priceUsd: number;
  priceChangeH24: number;
  volumeH24: number;
  reserveUsd: number;
  buysH24: number;
  sellsH24: number;
  baseToken: string;
  quoteToken: string;
  createdAt: string;
}

export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  priceUsd: number;
  fdvUsd: number;
  totalReserveInUsd: number;
  volumeH24Usd: number;
  marketCapUsd: number | null;
  imageUrl?: string;
}

export interface OhlcvCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUsd: number;
}

export interface NetworkInfo {
  id: string;
  name: string;
  coingeckoAssetPlatformId: string;
}

export type Timeframe = 'day' | 'hour' | 'minute';
export type SupportedNetwork =
  | 'eth' | 'bsc' | 'polygon_pos' | 'avax' | 'arbitrum'
  | 'optimism' | 'base' | 'solana' | 'sui' | 'ton';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from GeckoTerminal API with standard error handling.
 * Rate limit: ~30 req/min (free, no key).
 */
async function gtFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 }, // 1 min cache
    });

    if (!res.ok) {
      console.error(`GeckoTerminal API error ${res.status}: ${path}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('GeckoTerminal API request failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Networks
// ---------------------------------------------------------------------------

/**
 * List all supported networks.
 */
export async function getNetworks(): Promise<NetworkInfo[]> {
  const data = await gtFetch<{
    data: Array<{ id: string; attributes: { name: string; coingecko_asset_platform_id: string } }>;
  }>('/networks');

  if (!data?.data) return [];

  return data.data.map((n) => ({
    id: n.id,
    name: n.attributes.name,
    coingeckoAssetPlatformId: n.attributes.coingecko_asset_platform_id,
  }));
}

// ---------------------------------------------------------------------------
// Trending Pools
// ---------------------------------------------------------------------------

/**
 * Get trending pools across all networks.
 */
export async function getTrendingPools(network?: string): Promise<TrendingPool[]> {
  const path = network
    ? `/networks/${network}/trending_pools`
    : '/networks/trending_pools';

  const data = await gtFetch<{ data: DexPool[] }>(path);

  if (!data?.data) return [];

  return data.data.map(poolToTrending);
}

/**
 * Get top pools for a specific token address on a network.
 */
export async function getTokenPools(
  network: string,
  tokenAddress: string,
): Promise<TrendingPool[]> {
  const data = await gtFetch<{ data: DexPool[] }>(
    `/networks/${network}/tokens/${tokenAddress}/pools`,
  );

  if (!data?.data) return [];

  return data.data.map(poolToTrending);
}

// ---------------------------------------------------------------------------
// Token Info
// ---------------------------------------------------------------------------

/**
 * Get token info by address on a network.
 */
export async function getTokenInfo(
  network: string,
  tokenAddress: string,
): Promise<TokenInfo | null> {
  const data = await gtFetch<{
    data: {
      id: string;
      attributes: {
        name: string;
        symbol: string;
        address: string;
        decimals: number;
        price_usd: string;
        fdv_usd: string;
        total_reserve_in_usd: string;
        volume_usd: { h24: string };
        market_cap_usd: string | null;
        image_url?: string;
      };
    };
  }>(`/networks/${network}/tokens/${tokenAddress}`);

  if (!data?.data) return null;

  const a = data.data.attributes;
  return {
    id: data.data.id,
    name: a.name,
    symbol: a.symbol,
    address: a.address,
    decimals: a.decimals,
    priceUsd: parseFloat(a.price_usd) || 0,
    fdvUsd: parseFloat(a.fdv_usd) || 0,
    totalReserveInUsd: parseFloat(a.total_reserve_in_usd) || 0,
    volumeH24Usd: parseFloat(a.volume_usd?.h24) || 0,
    marketCapUsd: a.market_cap_usd ? parseFloat(a.market_cap_usd) : null,
    imageUrl: a.image_url,
  };
}

/**
 * Multi-token price lookup (up to 30 addresses per call).
 */
export async function getMultiTokenPrices(
  network: string,
  addresses: string[],
): Promise<Record<string, number>> {
  const batch = addresses.slice(0, 30).join(',');
  const data = await gtFetch<{
    data: {
      id: string;
      attributes: { token_prices: Record<string, string> };
    };
  }>(`/simple/networks/${network}/token_price/${batch}`);

  if (!data?.data?.attributes?.token_prices) return {};

  const prices: Record<string, number> = {};
  for (const [addr, p] of Object.entries(data.data.attributes.token_prices)) {
    prices[addr] = parseFloat(p) || 0;
  }
  return prices;
}

// ---------------------------------------------------------------------------
// OHLCV
// ---------------------------------------------------------------------------

/**
 * Get OHLCV candle data for a pool.
 */
export async function getOhlcv(
  network: string,
  poolAddress: string,
  opts?: { timeframe?: Timeframe; aggregate?: number; limit?: number },
): Promise<OhlcvCandle[]> {
  const tf = opts?.timeframe ?? 'day';
  const agg = opts?.aggregate ?? 1;
  const limit = opts?.limit ?? 100;

  const data = await gtFetch<{
    data: {
      attributes: {
        ohlcv_list: [number, number, number, number, number, number][];
      };
    };
  }>(
    `/networks/${network}/pools/${poolAddress}/ohlcv/${tf}?aggregate=${agg}&limit=${limit}`,
  );

  if (!data?.data?.attributes?.ohlcv_list) return [];

  return data.data.attributes.ohlcv_list.map(([ts, o, h, l, c, v]) => ({
    timestamp: ts,
    open: o,
    high: h,
    low: l,
    close: c,
    volumeUsd: v,
  }));
}

// ---------------------------------------------------------------------------
// New Pools
// ---------------------------------------------------------------------------

/**
 * Get newly created pools on a network (useful for sniping / tracking launches).
 */
export async function getNewPools(network?: string): Promise<TrendingPool[]> {
  const path = network
    ? `/networks/${network}/new_pools`
    : '/networks/new_pools';

  const data = await gtFetch<{ data: DexPool[] }>(path);

  if (!data?.data) return [];

  return data.data.map(poolToTrending);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search pools and tokens by query string.
 */
export async function search(
  query: string,
): Promise<{ pools: TrendingPool[]; tokens: TokenInfo[] }> {
  const data = await gtFetch<{
    data: Array<{
      id: string;
      type: 'pool' | 'token';
      attributes: Record<string, unknown>;
    }>;
  }>(`/search/pools?query=${encodeURIComponent(query)}`);

  if (!data?.data) return { pools: [], tokens: [] };

  const pools: TrendingPool[] = [];
  for (const item of data.data) {
    if (item.type === 'pool') {
      pools.push(poolToTrending(item as unknown as DexPool));
    }
  }
  return { pools, tokens: [] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function poolToTrending(pool: DexPool): TrendingPool {
  const a = pool.attributes;
  const network = pool.id.split('_')[0] || 'unknown';
  return {
    id: pool.id,
    name: a.name,
    address: a.address,
    network,
    dex: pool.relationships?.dex?.data?.id || 'unknown',
    priceUsd: parseFloat(a.base_token_price_usd) || 0,
    priceChangeH24: parseFloat(a.price_change_percentage?.h24) || 0,
    volumeH24: parseFloat(a.volume_usd?.h24) || 0,
    reserveUsd: parseFloat(a.reserve_in_usd) || 0,
    buysH24: a.transactions?.h24?.buys || 0,
    sellsH24: a.transactions?.h24?.sells || 0,
    baseToken: pool.relationships?.base_token?.data?.id || '',
    quoteToken: pool.relationships?.quote_token?.data?.id || '',
    createdAt: a.pool_created_at || '',
  };
}
