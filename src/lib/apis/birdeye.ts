/**
 * Birdeye Solana & Multi-Chain DeFi API
 *
 * Token prices, DEX trades, trending tokens, OHLCV, and wallet analytics
 * for Solana, Ethereum, Arbitrum, Avalanche, BNB Chain, and more.
 *
 * Free tier: 100 req/min. Standard: $49/mo (500 req/min).
 *
 * @see https://docs.birdeye.so/
 * @module lib/apis/birdeye
 */

const BASE_URL = 'https://public-api.birdeye.so';
const API_KEY = process.env.BIRDEYE_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export type BirdeyeChain =
  | 'solana' | 'ethereum' | 'arbitrum' | 'avalanche'
  | 'bsc' | 'optimism' | 'polygon' | 'base' | 'zksync' | 'sui';

export interface TokenOverview {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24hPercent: number;
  priceChange1hPercent: number;
  volume24hUsd: number;
  volume24hChangePercent: number;
  liquidity: number;
  marketCap: number | null;
  supply: number;
  holder: number;
  trade24h: number;
  trade24hChangePercent: number;
  buy24h: number;
  sell24h: number;
  uniqueWallet24h: number;
  lastTradeUnixTime: number;
}

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  rank: number;
}

export interface TokenPrice {
  address: string;
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
}

export interface OhlcvCandle {
  unixTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeData {
  txHash: string;
  blockUnixTime: number;
  source: string;
  side: 'buy' | 'sell';
  priceUsd: number;
  volume: number;
  from: { symbol: string; address: string; amount: number; uiAmount: number };
  to: { symbol: string; address: string; amount: number; uiAmount: number };
}

export interface WalletPortfolio {
  wallet: string;
  totalUsd: number;
  items: Array<{
    address: string;
    symbol: string;
    name: string;
    balance: number;
    uiAmount: number;
    priceUsd: number;
    valueUsd: number;
    priceChange24h: number;
  }>;
}

export interface TokenSecurityInfo {
  address: string;
  creatorAddress: string;
  creationTime: number;
  top10HolderPercent: number;
  isMintable: boolean;
  isFreezable: boolean;
  transferFeeEnable: boolean;
  isProxy: boolean;
  isOpenSource: boolean;
}

export interface SolanaSummary {
  trendingTokens: TrendingToken[];
  topGainers: TrendingToken[];
  topLosers: TrendingToken[];
  newListings: TrendingToken[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Birdeye API with key auth.
 */
async function beFetch<T>(
  path: string,
  chain: BirdeyeChain = 'solana',
): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Birdeye: BIRDEYE_API_KEY not set — skipping request');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': API_KEY,
        'x-chain': chain,
      },
      next: { revalidate: 30 }, // 30s cache — Solana moves fast
    });

    if (!res.ok) {
      console.error(`Birdeye API error ${res.status}: ${path}`);
      return null;
    }

    const json = await res.json();
    if (!json.success && json.success !== undefined) {
      console.error(`Birdeye API error: ${json.message || 'unknown'}`);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error('Birdeye API request failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token Overview & Price
// ---------------------------------------------------------------------------

/**
 * Get detailed token overview (price, volume, holders, trades).
 */
export async function getTokenOverview(
  address: string,
  chain: BirdeyeChain = 'solana',
): Promise<TokenOverview | null> {
  return beFetch<TokenOverview>(
    `/defi/token_overview?address=${encodeURIComponent(address)}`,
    chain,
  );
}

/**
 * Get current token price.
 */
export async function getTokenPrice(
  address: string,
  chain: BirdeyeChain = 'solana',
): Promise<TokenPrice | null> {
  return beFetch<TokenPrice>(
    `/defi/price?address=${encodeURIComponent(address)}`,
    chain,
  );
}

/**
 * Batch token prices (up to 100 addresses).
 */
export async function getMultiPrice(
  addresses: string[],
  chain: BirdeyeChain = 'solana',
): Promise<Record<string, TokenPrice>> {
  const batch = addresses.slice(0, 100).join(',');
  const data = await beFetch<Record<string, TokenPrice>>(
    `/defi/multi_price?list_address=${batch}`,
    chain,
  );
  return data || {};
}

// ---------------------------------------------------------------------------
// Trending & Discovery
// ---------------------------------------------------------------------------

/**
 * Get trending tokens by volume and trade count.
 */
export async function getTrendingTokens(
  chain: BirdeyeChain = 'solana',
  opts?: { sortBy?: 'rank' | 'volume24hUSD' | 'priceChange24hPercent'; sortType?: 'asc' | 'desc'; limit?: number },
): Promise<TrendingToken[]> {
  const sortBy = opts?.sortBy ?? 'rank';
  const sortType = opts?.sortType ?? 'asc';
  const limit = opts?.limit ?? 20;

  const data = await beFetch<{ tokens: TrendingToken[] }>(
    `/defi/token_trending?sort_by=${sortBy}&sort_type=${sortType}&offset=0&limit=${limit}`,
    chain,
  );

  return data?.tokens || [];
}

/**
 * Get newly listed tokens in the last 24h.
 */
export async function getNewListings(
  chain: BirdeyeChain = 'solana',
  limit: number = 20,
): Promise<TrendingToken[]> {
  const data = await beFetch<{ tokens: TrendingToken[] }>(
    `/defi/token_new_listing?limit=${limit}`,
    chain,
  );
  return data?.tokens || [];
}

// ---------------------------------------------------------------------------
// OHLCV
// ---------------------------------------------------------------------------

/**
 * Get OHLCV candle data. Type: 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 8H, 12H, 1D, 3D, 1W, 1M.
 */
export async function getOhlcv(
  address: string,
  opts?: {
    type?: string;
    timeFrom?: number;
    timeTo?: number;
    chain?: BirdeyeChain;
  },
): Promise<OhlcvCandle[]> {
  const type = opts?.type ?? '1H';
  const timeTo = opts?.timeTo ?? Math.floor(Date.now() / 1000);
  const timeFrom = opts?.timeFrom ?? timeTo - 7 * 24 * 3600; // 7 days default

  const data = await beFetch<{ items: OhlcvCandle[] }>(
    `/defi/ohlcv?address=${encodeURIComponent(address)}&type=${type}&time_from=${timeFrom}&time_to=${timeTo}`,
    opts?.chain ?? 'solana',
  );

  return data?.items || [];
}

// ---------------------------------------------------------------------------
// Trades
// ---------------------------------------------------------------------------

/**
 * Get recent trades for a token.
 */
export async function getTokenTrades(
  address: string,
  chain: BirdeyeChain = 'solana',
  limit: number = 50,
): Promise<TradeData[]> {
  const data = await beFetch<{ items: TradeData[] }>(
    `/defi/txs/token?address=${encodeURIComponent(address)}&limit=${limit}&sort_type=desc`,
    chain,
  );
  return data?.items || [];
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

/**
 * Get wallet token portfolio.
 */
export async function getWalletPortfolio(
  wallet: string,
  chain: BirdeyeChain = 'solana',
): Promise<WalletPortfolio | null> {
  return beFetch<WalletPortfolio>(
    `/v1/wallet/token_list?wallet=${encodeURIComponent(wallet)}`,
    chain,
  );
}

// ---------------------------------------------------------------------------
// Token Security
// ---------------------------------------------------------------------------

/**
 * Get token security / rug-pull risk info.
 */
export async function getTokenSecurity(
  address: string,
  chain: BirdeyeChain = 'solana',
): Promise<TokenSecurityInfo | null> {
  return beFetch<TokenSecurityInfo>(
    `/defi/token_security?address=${encodeURIComponent(address)}`,
    chain,
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get a comprehensive Solana ecosystem summary.
 */
export async function getSolanaSummary(): Promise<SolanaSummary> {
  const [trending, gainers, losers, newTokens] = await Promise.all([
    getTrendingTokens('solana', { limit: 20 }),
    getTrendingTokens('solana', { sortBy: 'priceChange24hPercent', sortType: 'desc', limit: 10 }),
    getTrendingTokens('solana', { sortBy: 'priceChange24hPercent', sortType: 'asc', limit: 10 }),
    getNewListings('solana', 10),
  ]);

  return {
    trendingTokens: trending,
    topGainers: gainers,
    topLosers: losers,
    newListings: newTokens,
    timestamp: new Date().toISOString(),
  };
}
