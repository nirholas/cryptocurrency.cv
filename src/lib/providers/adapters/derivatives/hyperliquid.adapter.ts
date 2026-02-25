/**
 * Hyperliquid Adapter — Fastest-growing perpetual DEX
 *
 * Hyperliquid is a decentralized perpetual exchange:
 * - $5B+ daily volume
 * - No API key required
 * - High rate limits (120/min)
 * - Real-time funding, OI, mark prices
 *
 * @module providers/adapters/derivatives/hyperliquid
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OpenInterest, ExchangeOI } from './types';

const BASE = 'https://api.hyperliquid.xyz/info';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowMs: 60_000,
};

export const hyperliquidAdapter: DataProvider<OpenInterest[]> = {
  name: 'hyperliquid',
  description: 'Hyperliquid — Decentralized perpetual exchange with $5B+ daily volume',
  priority: 1,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['open-interest', 'funding-rate', 'liquidations'],

  async fetch(params: FetchParams): Promise<OpenInterest[]> {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`);
    }

    const [meta, contexts]: [
      { universe: { name: string; szDecimals: number }[] },
      { funding: string; openInterest: string; oraclePx: string; markPx: string }[],
    ] = await response.json();

    const symbols = params.symbols?.map(s => s.replace('USDT', '').replace('USD', '').toUpperCase());

    let results: OpenInterest[] = meta.universe.map((market, i) => {
      const ctx = contexts[i];
      const oi = parseFloat(ctx?.openInterest ?? '0');
      const oraclePx = parseFloat(ctx?.oraclePx ?? '0');

      return {
        symbol: market.name,
        openInterestUsd: oi * oraclePx,
        openInterestCoin: oi,
        change24h: 0, // Hyperliquid doesn't provide this directly
        exchanges: [{
          exchange: 'Hyperliquid',
          openInterestUsd: oi * oraclePx,
          openInterestCoin: oi,
        }] as ExchangeOI[],
        timestamp: new Date().toISOString(),
      };
    });

    if (symbols && symbols.length > 0) {
      results = results.filter(r => symbols.includes(r.symbol.toUpperCase()));
    }

    const limit = params.limit ?? 50;
    return results
      .sort((a, b) => b.openInterestUsd - a.openInterestUsd)
      .slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OpenInterest[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.symbol === 'string' &&
      typeof item.openInterestUsd === 'number',
    );
  },
};
