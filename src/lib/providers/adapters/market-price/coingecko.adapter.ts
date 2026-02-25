/**
 * CoinGecko Adapter — Primary market price provider
 *
 * CoinGecko is the most comprehensive free crypto API:
 * - 13,000+ coins tracked
 * - No API key required (but key increases rate limits)
 * - Generous free tier: 30 req/min
 *
 * This adapter wraps the CoinGecko v3 API as a DataProvider
 * compatible with the ProviderChain framework.
 *
 * @module providers/adapters/market-price/coingecko
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Normalized market price data returned by all price adapters.
 * This is the common format that consumers receive, regardless
 * of which provider sourced the data.
 */
export interface MarketPrice {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/** CoinGecko API key (optional, increases rate limits) */
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: COINGECKO_API_KEY ? 500 : 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * CoinGecko market price provider.
 *
 * Priority: 1 (primary)
 * Weight: 0.4 (high trust — most comprehensive source)
 */
export const coingeckoAdapter: DataProvider<MarketPrice[]> = {
  name: 'coingecko',
  description: 'CoinGecko API v3 — comprehensive crypto market data (13,000+ coins)',
  priority: 1,
  weight: 0.4,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price', 'ohlcv', 'fear-greed'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const vsCurrency = params.vsCurrency ?? 'usd';
    const coinIds = params.coinIds?.join(',') ?? '';
    const limit = params.limit ?? 100;

    let url: string;

    if (coinIds) {
      // Specific coins
      url =
        `${COINGECKO_BASE}/coins/markets?vs_currency=${vsCurrency}` +
        `&ids=${coinIds}&order=market_cap_desc&per_page=${limit}` +
        `&page=1&sparkline=false&price_change_percentage=24h`;
    } else {
      // Top coins by market cap
      url =
        `${COINGECKO_BASE}/coins/markets?vs_currency=${vsCurrency}` +
        `&order=market_cap_desc&per_page=${limit}` +
        `&page=1&sparkline=false&price_change_percentage=24h`;
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (response.status === 429) {
      throw new Error('CoinGecko rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const raw: CoinGeckoMarketItem[] = await response.json();
    return raw.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COINGECKO_BASE}/ping`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    // Must be a non-empty array with valid prices
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.currentPrice === 'number' &&
      item.currentPrice > 0 &&
      typeof item.symbol === 'string',
    );
  },
};

// =============================================================================
// INTERNAL — Raw API types and normalization
// =============================================================================

interface CoinGeckoMarketItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  last_updated: string;
}

function normalize(raw: CoinGeckoMarketItem): MarketPrice {
  return {
    id: raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    currentPrice: raw.current_price ?? 0,
    marketCap: raw.market_cap ?? 0,
    marketCapRank: raw.market_cap_rank ?? 0,
    totalVolume: raw.total_volume ?? 0,
    priceChange24h: raw.price_change_24h ?? 0,
    priceChangePercentage24h: raw.price_change_percentage_24h ?? 0,
    high24h: raw.high_24h ?? 0,
    low24h: raw.low_24h ?? 0,
    circulatingSupply: raw.circulating_supply ?? 0,
    totalSupply: raw.total_supply,
    lastUpdated: raw.last_updated ?? new Date().toISOString(),
  };
}
