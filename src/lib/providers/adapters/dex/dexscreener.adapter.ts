/**
 * DexScreener Adapter — Real-time DEX pair data
 *
 * DexScreener tracks every token pair across 80+ DEXes on 30+ chains:
 * - No API key required
 * - Real-time pair data (price, volume, liquidity, txns)
 * - Free, no rate limit published (be respectful: ~60 req/min)
 * - Docs: https://docs.dexscreener.com/api/reference
 *
 * @module providers/adapters/dex/dexscreener
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: number;
  priceNative: number;
  volume24h: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  liquidity: { usd: number; base: number; quote: number };
  txns24h: { buys: number; sells: number };
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: string | null;
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const dexscreenerAdapter: DataProvider<DexPair[]> = {
  name: 'dexscreener',
  description: 'DexScreener — real-time DEX pair data across 80+ exchanges, 30+ chains',
  priority: 1,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['dex-pairs', 'market-price'],

  async fetch(params: FetchParams): Promise<DexPair[]> {
    let url: string;

    if (params.query) {
      // Search by token name/symbol
      url = `${DEXSCREENER_BASE}/search?q=${encodeURIComponent(params.query)}`;
    } else if (params.coinIds && params.coinIds.length > 0) {
      // Search by token addresses (comma-separated)
      url = `${DEXSCREENER_BASE}/tokens/${params.coinIds.join(',')}`;
    } else {
      // Default: top trending pairs (uses search with broad query)
      url = `${DEXSCREENER_BASE}/search?q=WETH`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const pairs: DexScreenerPair[] = data.pairs ?? [];

    const limit = params.limit ?? 50;
    return pairs.slice(0, limit).map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${DEXSCREENER_BASE}/search?q=ETH`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: DexPair[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(p => typeof p.priceUsd === 'number' && p.priceUsd > 0);
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: number | null;
}

function normalize(raw: DexScreenerPair): DexPair {
  return {
    chainId: raw.chainId,
    dexId: raw.dexId,
    pairAddress: raw.pairAddress,
    baseToken: raw.baseToken,
    quoteToken: raw.quoteToken,
    priceUsd: parseFloat(raw.priceUsd) || 0,
    priceNative: parseFloat(raw.priceNative) || 0,
    volume24h: raw.volume?.h24 ?? 0,
    priceChange5m: raw.priceChange?.m5 ?? 0,
    priceChange1h: raw.priceChange?.h1 ?? 0,
    priceChange6h: raw.priceChange?.h6 ?? 0,
    priceChange24h: raw.priceChange?.h24 ?? 0,
    liquidity: raw.liquidity ?? { usd: 0, base: 0, quote: 0 },
    txns24h: raw.txns?.h24 ?? { buys: 0, sells: 0 },
    fdv: raw.fdv,
    marketCap: raw.marketCap,
    pairCreatedAt: raw.pairCreatedAt ? new Date(raw.pairCreatedAt).toISOString() : null,
    lastUpdated: new Date().toISOString(),
  };
}
