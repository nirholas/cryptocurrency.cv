/**
 * Glassnode Stablecoins Adapter — Exchange flows & supply data
 *
 * Paid API (~$29/mo). Provides: exchange inflow/outflow, net supply change.
 *
 * @see https://docs.glassnode.com/
 * @module providers/adapters/stablecoin-flows/glassnode
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { StablecoinFlow } from './types';

const GN_BASE = 'https://api.glassnode.com/v1/metrics';
const GN_API_KEY = process.env.GLASSNODE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };

/** Symbols Glassnode tracks for stablecoins */
const STABLECOINS = [
  { asset: 'USDT', id: 'tether', name: 'Tether' },
  { asset: 'USDC', id: 'usdc', name: 'USD Coin' },
  { asset: 'DAI', id: 'dai', name: 'Dai' },
  { asset: 'BUSD', id: 'busd', name: 'Binance USD' },
];

export const glassnodeStablecoinsAdapter: DataProvider<StablecoinFlow[]> = {
  name: 'glassnode-stablecoins',
  description: 'Glassnode — stablecoin exchange flows & supply metrics',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['stablecoin-flows'],

  async fetch(_params: FetchParams): Promise<StablecoinFlow[]> {
    if (!GN_API_KEY) throw new Error('GLASSNODE_API_KEY not configured');

    const results: StablecoinFlow[] = [];

    for (const sc of STABLECOINS) {
      try {
        const url =
          `${GN_BASE}/supply/current?a=${sc.asset}&api_key=${GN_API_KEY}&i=24h&f=JSON`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const latest = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null;
        const prev = Array.isArray(data) && data.length > 1 ? data[data.length - 2] : null;

        const supply = latest?.v ?? 0;
        const prevSupply = prev?.v ?? supply;

        results.push({
          id: sc.id,
          name: sc.name,
          symbol: sc.asset,
          pegType: 'peggedUSD',
          circulatingUsd: supply,
          circulatingChange24h: supply - prevSupply,
          circulatingChange7d: 0,
          chainDistribution: [],
          price: 1.0,
          rank: results.length + 1,
          timestamp: new Date().toISOString(),
        });
      } catch { /* skip individual failures */ }

      await new Promise(r => setTimeout(r, 200)); // Rate limit
    }

    if (results.length === 0) throw new Error('No Glassnode stablecoin data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!GN_API_KEY) return false;
    try {
      const res = await fetch(
        `${GN_BASE}/supply/current?a=USDT&api_key=${GN_API_KEY}&i=24h&f=JSON&s=${Math.floor(Date.now() / 1000) - 86400}`,
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } catch { return false; }
  },

  validate(data: StablecoinFlow[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};
