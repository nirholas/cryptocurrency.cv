/**
 * DeFi Pulse TVL Adapter — Legacy DeFi TVL data
 *
 * DeFi Pulse was one of the first TVL trackers. Now provides
 * complementary data to DefiLlama for cross-reference.
 *
 * @see https://defipulse.com/api
 * @module providers/adapters/defi/defi-pulse
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { ProtocolTvl } from './types';

const BASE = 'https://data-api.defipulse.com/api/v1/defipulse/api';
const DEFIPULSE_KEY = process.env.DEFIPULSE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const defiPulseAdapter: DataProvider<ProtocolTvl[]> = {
  name: 'defipulse-tvl',
  description: 'DeFi Pulse — Legacy TVL tracker for major DeFi protocols',
  priority: 3,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['tvl'],

  async fetch(params: FetchParams): Promise<ProtocolTvl[]> {
    if (!DEFIPULSE_KEY) throw new Error('DEFIPULSE_API_KEY not configured');

    const res = await fetch(
      `${BASE}/GetProjects?api-key=${DEFIPULSE_KEY}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) throw new Error(`DeFi Pulse API error: ${res.status}`);

    const projects: DeFiPulseProject[] = await res.json();
    const now = new Date().toISOString();
    const limit = params.limit ?? 50;

    const results: ProtocolTvl[] = projects
      .filter(p => p.value && p.value.tvl)
      .sort((a, b) => (b.value?.tvl?.USD ?? 0) - (a.value?.tvl?.USD ?? 0))
      .slice(0, limit)
      .map((p) => ({
        id: (p.name ?? '').toLowerCase().replace(/\s+/g, '-'),
        name: p.name ?? '',
        category: p.category ?? 'DeFi',
        chain: p.chain ?? 'Ethereum',
        chains: [p.chain ?? 'Ethereum'],
        tvl: p.value?.tvl?.USD ?? 0,
        tvlChange1d: 0,
        tvlChange7d: 0,
        url: '',
        logo: '',
        timestamp: now,
      }));

    if (results.length === 0) throw new Error('No DeFi Pulse TVL data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!DEFIPULSE_KEY) return false;
    try {
      const res = await fetch(
        `${BASE}/GetProjects?api-key=${DEFIPULSE_KEY}`,
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } catch { return false; }
  },

  validate(data: ProtocolTvl[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// Internal
interface DeFiPulseProject {
  name?: string;
  chain?: string;
  category?: string;
  value?: { tvl?: { USD?: number } };
}
