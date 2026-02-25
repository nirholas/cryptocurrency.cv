/**
 * GeckoTerminal Adapter — DEX analytics by CoinGecko
 *
 * GeckoTerminal provides on-chain DEX data:
 * - No API key required
 * - 30 req/min on free tier
 * - Pools, OHLCV, trades across 100+ networks
 * - Docs: https://www.geckoterminal.com/dex-api
 *
 * @module providers/adapters/dex/geckoterminal
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { DexPair } from './dexscreener.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const GT_BASE = 'https://api.geckoterminal.com/api/v2';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const geckoTerminalAdapter: DataProvider<DexPair[]> = {
  name: 'geckoterminal',
  description: 'GeckoTerminal — on-chain DEX analytics by CoinGecko (100+ networks)',
  priority: 2,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['dex-pairs', 'ohlcv'],

  async fetch(params: FetchParams): Promise<DexPair[]> {
    const network = params.chain ?? 'eth';
    const limit = Math.min(params.limit ?? 20, 20); // max page size = 20

    let url: string;
    if (params.query) {
      url = `${GT_BASE}/search/pools?query=${encodeURIComponent(params.query)}&page=1`;
    } else {
      url = `${GT_BASE}/networks/${network}/trending_pools?page=1`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const pools: GeckoTerminalPool[] = json.data ?? [];
    return pools.slice(0, limit).map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${GT_BASE}/networks/eth/trending_pools?page=1`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: DexPair[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(p => typeof p.priceUsd === 'number');
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface GeckoTerminalPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    price_change_percentage: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      h24: { buys: number; sells: number };
    };
    volume_usd: { h24: string };
    reserve_in_usd: string;
    pool_created_at: string | null;
  };
  relationships?: {
    base_token?: { data: { id: string } };
    quote_token?: { data: { id: string } };
    dex?: { data: { id: string } };
    network?: { data: { id: string } };
  };
}

function normalize(raw: GeckoTerminalPool): DexPair {
  const attrs = raw.attributes;
  const networkId = raw.relationships?.network?.data?.id ?? 'eth';
  const dexId = raw.relationships?.dex?.data?.id ?? 'unknown';

  return {
    chainId: networkId,
    dexId,
    pairAddress: attrs.address,
    baseToken: {
      address: raw.relationships?.base_token?.data?.id ?? '',
      name: attrs.name.split(' / ')[0] ?? '',
      symbol: attrs.name.split(' / ')[0] ?? '',
    },
    quoteToken: {
      address: raw.relationships?.quote_token?.data?.id ?? '',
      name: attrs.name.split(' / ')[1] ?? '',
      symbol: attrs.name.split(' / ')[1] ?? '',
    },
    priceUsd: parseFloat(attrs.base_token_price_usd) || 0,
    priceNative: parseFloat(attrs.base_token_price_native_currency) || 0,
    volume24h: parseFloat(attrs.volume_usd?.h24) || 0,
    priceChange5m: parseFloat(attrs.price_change_percentage?.m5) || 0,
    priceChange1h: parseFloat(attrs.price_change_percentage?.h1) || 0,
    priceChange6h: parseFloat(attrs.price_change_percentage?.h6) || 0,
    priceChange24h: parseFloat(attrs.price_change_percentage?.h24) || 0,
    liquidity: {
      usd: parseFloat(attrs.reserve_in_usd) || 0,
      base: 0,
      quote: 0,
    },
    txns24h: attrs.transactions?.h24 ?? { buys: 0, sells: 0 },
    fdv: attrs.fdv_usd ? parseFloat(attrs.fdv_usd) : null,
    marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
    pairCreatedAt: attrs.pool_created_at,
    lastUpdated: new Date().toISOString(),
  };
}
