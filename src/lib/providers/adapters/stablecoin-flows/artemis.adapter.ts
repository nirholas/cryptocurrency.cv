/**
 * Artemis Stablecoins Adapter — Cross-chain stablecoin analytics
 *
 * Artemis provides chain-level stablecoin supply, transfer volume,
 * and active addresses. Free tier available.
 *
 * @see https://docs.artemis.xyz/
 * @module providers/adapters/stablecoin-flows/artemis
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { StablecoinFlow } from './types';

const BASE = 'https://api.artemis.xyz/stablecoins';
const ARTEMIS_KEY = process.env.ARTEMIS_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const artemisStablecoinsAdapter: DataProvider<StablecoinFlow[]> = {
  name: 'artemis-stablecoins',
  description: 'Artemis — Cross-chain stablecoin analytics & transfer data',
  priority: 3,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['stablecoin-flows'],

  async fetch(params: FetchParams): Promise<StablecoinFlow[]> {
    if (!ARTEMIS_KEY) throw new Error('ARTEMIS_API_KEY not configured');

    const headers: Record<string, string> = {
      'X-Artemis-API-Key': ARTEMIS_KEY,
      Accept: 'application/json',
    };

    const res = await fetch(`${BASE}/market`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`Artemis API error: ${res.status}`);

    const json = await res.json();
    const assets: ArtemisStablecoin[] = json?.data ?? json ?? [];
    const now = new Date().toISOString();
    const limit = params.limit ?? 50;

    const results: StablecoinFlow[] = assets
      .slice(0, limit)
      .map((a, i) => ({
        id: a.id ?? a.symbol?.toLowerCase() ?? `artemis-${i}`,
        name: a.name ?? '',
        symbol: a.symbol ?? '',
        pegType: 'peggedUSD',
        circulatingUsd: a.marketCap ?? a.circulatingSupply ?? 0,
        circulatingChange24h: a.marketCapChange24h ?? 0,
        circulatingChange7d: a.marketCapChange7d ?? 0,
        chainDistribution: (a.chains ?? []).map(c => ({
          chain: c.chain,
          amount: c.supply ?? 0,
        })),
        price: a.price ?? 1.0,
        rank: i + 1,
        timestamp: now,
      }));

    if (results.length === 0) throw new Error('No Artemis stablecoin data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!ARTEMIS_KEY) return false;
    try {
      const res = await fetch(`${BASE}/market`, {
        headers: { 'X-Artemis-API-Key': ARTEMIS_KEY },
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

// Internal
interface ArtemisStablecoin {
  id?: string;
  name?: string;
  symbol?: string;
  marketCap?: number;
  circulatingSupply?: number;
  marketCapChange24h?: number;
  marketCapChange7d?: number;
  price?: number;
  chains?: { chain: string; supply: number }[];
}
