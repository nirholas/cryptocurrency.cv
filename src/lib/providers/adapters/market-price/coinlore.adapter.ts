/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * CoinLore Adapter — fully keyless market price provider.
 *
 * CoinLore (https://www.coinlore.com/cryptocurrency-data-api) is 100% free:
 * - No API key, no signup, no hard rate limit (be polite ~1 req/sec)
 * - 10,000+ coins with independent aggregation (not a CoinGecko mirror)
 * - Returns market cap, rank, supply, and 1h/24h/7d changes in one call
 *
 * Its `nameid` field is a CoinGecko-style slug ("bitcoin", "ethereum"), so it
 * maps onto our canonical ids with no lookup table for the vast majority of
 * coins. This makes it an excellent deep fallback behind CoinGecko/CoinPaprika.
 *
 * @module providers/adapters/market-price/coinlore
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const COINLORE_BASE = 'https://api.coinlore.net/api';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

/**
 * A handful of coins whose CoinLore `nameid` differs from the CoinGecko id.
 * Everything else falls through to the identical `nameid`.
 */
const NAMEID_TO_COINGECKO: Record<string, string> = {
  'binance-coin': 'binancecoin',
  'avalanche': 'avalanche-2',
  'polygon': 'matic-network',
  'near-protocol': 'near',
};

function toCoinGeckoId(nameid: string): string {
  return NAMEID_TO_COINGECKO[nameid] ?? nameid;
}

const COINGECKO_TO_NAMEID: Record<string, string> = Object.fromEntries(
  Object.entries(NAMEID_TO_COINGECKO).map(([cg, nid]) => [cg, nid]),
);

export const coinloreAdapter: DataProvider<MarketPrice[]> = {
  name: 'coinlore',
  description: 'CoinLore API — fully keyless market data with independent aggregation (10,000+ coins)',
  priority: 5,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    // CoinLore is a top-N list API. Fetch a generous page and filter locally
    // when specific coins are requested (its per-id endpoint needs a numeric
    // id we don't carry, so the list approach is both simpler and fewer calls).
    const limit = params.coinIds?.length
      ? 100
      : Math.min(params.limit ?? 100, 100);

    const response = await fetch(`${COINLORE_BASE}/tickers/?start=0&limit=${limit}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      throw new Error(`CoinLore API error: ${response.status}`);
    }

    const body = (await response.json()) as { data?: CoinLoreTicker[] };
    const tickers = body.data ?? [];
    if (tickers.length === 0) {
      throw new Error('CoinLore returned no data');
    }

    let mapped = tickers.map(normalize);

    if (params.coinIds?.length) {
      const wanted = new Set(
        params.coinIds.map((id) => COINGECKO_TO_NAMEID[id] ?? id),
      );
      const filtered = mapped.filter(
        (m) => wanted.has(m.id) || wanted.has(m.symbol.toLowerCase()),
      );
      if (filtered.length === 0) {
        throw new Error('CoinLore has no data for the requested coins');
      }
      mapped = filtered;
    }

    return mapped;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COINLORE_BASE}/global/`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((item) => typeof item.currentPrice === 'number' && item.currentPrice > 0);
  },
};

interface CoinLoreTicker {
  id: string;
  symbol: string;
  name: string;
  nameid: string;
  rank: number;
  price_usd: string;
  percent_change_24h: string;
  market_cap_usd: string;
  volume24: number | string;
  csupply: string;
  tsupply: string | null;
  msupply: string | null;
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(t: CoinLoreTicker): MarketPrice {
  return {
    id: toCoinGeckoId(t.nameid),
    symbol: t.symbol.toUpperCase(),
    name: t.name,
    currentPrice: num(t.price_usd),
    marketCap: num(t.market_cap_usd),
    marketCapRank: t.rank ?? 0,
    totalVolume: num(t.volume24),
    priceChange24h: 0,
    priceChangePercentage24h: num(t.percent_change_24h),
    high24h: 0,
    low24h: 0,
    circulatingSupply: num(t.csupply),
    totalSupply: t.tsupply != null ? num(t.tsupply) : null,
    lastUpdated: new Date().toISOString(),
  };
}
