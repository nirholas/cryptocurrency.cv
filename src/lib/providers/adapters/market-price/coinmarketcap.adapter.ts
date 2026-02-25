/**
 * CoinMarketCap Adapter — Premium market price provider
 *
 * CoinMarketCap is the industry-standard market data aggregator:
 * - 10,000+ coins tracked
 * - API key required (free tier: 10,000 calls/month, 333/day)
 * - Pro tiers available with higher limits
 *
 * Sign up at: https://pro.coinmarketcap.com/signup
 *
 * @module providers/adapters/market-price/coinmarketcap
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1';

const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: CMC_API_KEY ? 30 : 0, // No calls without key
  windowMs: 60_000,
};

/**
 * Map CoinGecko IDs → CoinMarketCap slugs.
 * CMC uses numeric IDs internally but slugs for lookups.
 */
const COINGECKO_TO_CMC_ID: Record<string, number> = {
  bitcoin: 1,
  ethereum: 1027,
  tether: 825,
  'binancecoin': 1839,
  solana: 5426,
  'usd-coin': 3408,
  ripple: 52,
  dogecoin: 74,
  cardano: 2010,
  'staked-ether': 8085,
  'avalanche-2': 5805,
  'wrapped-bitcoin': 3717,
  chainlink: 1975,
  'polkadot': 6636,
  'tron': 1958,
  'shiba-inu': 5994,
  dai: 4943,
  litecoin: 2,
  'bitcoin-cash': 1831,
  uniswap: 7083,
  'matic-network': 3890,
  stellar: 512,
  near: 6535,
  'internet-computer': 8916,
  aptos: 21794,
  sui: 20947,
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * CoinMarketCap market price provider.
 *
 * Priority: 2 (secondary — requires API key)
 * Weight: 0.35 (high trust — industry standard reference)
 */
export const coinmarketcapAdapter: DataProvider<MarketPrice[]> = {
  name: 'coinmarketcap',
  description: 'CoinMarketCap Pro API — industry-standard crypto market data (10,000+ coins)',
  priority: 2,
  weight: 0.35,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    if (!CMC_API_KEY) {
      throw new Error('CoinMarketCap API key not configured (COINMARKETCAP_API_KEY)');
    }

    const vsCurrency = (params.vsCurrency ?? 'usd').toUpperCase();
    const limit = params.limit ?? 100;

    let url: string;

    if (params.coinIds?.length) {
      // Map CoinGecko IDs to CMC IDs
      const cmcIds = params.coinIds
        .map(id => COINGECKO_TO_CMC_ID[id])
        .filter(Boolean);

      if (cmcIds.length === 0) {
        throw new Error('No CoinMarketCap ID mapping found for requested coins');
      }

      url = `${CMC_BASE}/cryptocurrency/quotes/latest?id=${cmcIds.join(',')}&convert=${vsCurrency}`;
    } else {
      url = `${CMC_BASE}/cryptocurrency/listings/latest?start=1&limit=${limit}&convert=${vsCurrency}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        Accept: 'application/json',
      },
    });

    if (response.status === 429) {
      throw new Error('CoinMarketCap rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    // CMC returns different shapes for listings vs quotes
    const coins: CmcCoin[] = Array.isArray(json.data)
      ? json.data
      : Object.values(json.data);

    return coins.map(coin => normalize(coin, vsCurrency));
  },

  async healthCheck(): Promise<boolean> {
    if (!CMC_API_KEY) return false;
    try {
      const response = await fetch(`${CMC_BASE}/cryptocurrency/map?limit=1`, {
        headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.currentPrice === 'number' &&
      item.currentPrice > 0 &&
      typeof item.symbol === 'string',
    );
  },
};

// =============================================================================
// INTERNAL — Raw types and normalization
// =============================================================================

interface CmcQuote {
  price: number;
  volume_24h: number;
  percent_change_24h: number;
  market_cap: number;
}

interface CmcCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  last_updated: string;
  quote: Record<string, CmcQuote>;
}

/** Reverse lookup: CMC ID → CoinGecko ID */
const CMC_ID_TO_COINGECKO: Record<number, string> = Object.fromEntries(
  Object.entries(COINGECKO_TO_CMC_ID).map(([cg, cmc]) => [cmc, cg]),
);

function normalize(coin: CmcCoin, currency: string): MarketPrice {
  const quote = coin.quote[currency] ?? coin.quote['USD'] ?? {};

  return {
    id: CMC_ID_TO_COINGECKO[coin.id] ?? coin.slug,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    currentPrice: quote.price ?? 0,
    marketCap: quote.market_cap ?? 0,
    marketCapRank: coin.cmc_rank ?? 0,
    totalVolume: quote.volume_24h ?? 0,
    priceChange24h: 0, // CMC doesn't provide absolute change in this endpoint
    priceChangePercentage24h: quote.percent_change_24h ?? 0,
    high24h: 0, // Not available in listings endpoint
    low24h: 0,
    circulatingSupply: coin.circulating_supply ?? 0,
    totalSupply: coin.total_supply,
    lastUpdated: coin.last_updated ?? new Date().toISOString(),
  };
}
