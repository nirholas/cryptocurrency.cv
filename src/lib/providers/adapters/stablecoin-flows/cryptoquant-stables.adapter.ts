/**
 * CryptoQuant Stablecoin Flows Adapter
 *
 * @module providers/adapters/stablecoin-flows/cryptoquant-stables
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { StablecoinFlow } from './types';

const BASE = 'https://api.cryptoquant.com/v1';
const API_KEY = process.env.CRYPTOQUANT_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 30 : 0,
  windowMs: 60_000,
};

export const cryptoquantStablesAdapter: DataProvider<StablecoinFlow[]> = {
  name: 'cryptoquant-stables',
  description: 'CryptoQuant — stablecoin exchange reserves and flows',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['stablecoin-flows'],

  async fetch(params: FetchParams): Promise<StablecoinFlow[]> {
    if (!API_KEY) throw new Error('CRYPTOQUANT_API_KEY not configured');

    const stablecoins = ['usdt', 'usdc'];
    const now = new Date().toISOString();

    const results = await Promise.allSettled(
      stablecoins.map(async (coin): Promise<StablecoinFlow> => {
        const res = await fetch(
          `${BASE}/stablecoin/${coin}/exchange-reserve?window=day&limit=2`,
          { headers: { Authorization: `Bearer ${API_KEY}` } },
        );

        if (!res.ok) throw new Error(`CryptoQuant ${coin}: ${res.status}`);

        const json = await res.json();
        const data = json.result?.data ?? [];
        const latest = data[data.length - 1];
        const previous = data.length > 1 ? data[data.length - 2] : null;

        const supply = latest?.reserve ?? 0;
        const prevSupply = previous?.reserve ?? supply;
        const change = prevSupply !== 0 ? ((supply - prevSupply) / prevSupply) * 100 : 0;

        return {
          id: coin,
          symbol: coin.toUpperCase(),
          name: coin.toUpperCase(),
          pegType: 'peggedUSD',
          circulatingUsd: supply,
          circulatingChange24h: supply - prevSupply,
          circulatingChange7d: 0,
          chainDistribution: [],
          price: 1.0,
          rank: 0,
          timestamp: now,
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<StablecoinFlow> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/stablecoin/usdt/exchange-reserve?window=day&limit=1`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: StablecoinFlow[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};
