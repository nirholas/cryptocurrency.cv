/**
 * DefiLlama Bridges Adapter
 *
 * DefiLlama aggregates bridge volume data across 30+ bridges.
 *
 * @module providers/adapters/bridges/defillama-bridges
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { BridgeVolume } from './types';

const BASE = 'https://bridges.llama.fi';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

export const defilllamaBridgesAdapter: DataProvider<BridgeVolume[]> = {
  name: 'defillama-bridges',
  description: 'DefiLlama — cross-chain bridge volume data',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['bridges'],

  async fetch(params: FetchParams): Promise<BridgeVolume[]> {
    const limit = params.limit ?? 20;

    const res = await fetch(`${BASE}/bridges?includeChains=true`);
    if (!res.ok) throw new Error(`DefiLlama bridges: ${res.status}`);

    const json = await res.json();
    const bridges: DefiLlamaBridge[] = json.bridges ?? [];
    const now = new Date().toISOString();

    return bridges
      .sort((a, b) => (b.currentDayVolume ?? 0) - (a.currentDayVolume ?? 0))
      .slice(0, limit)
      .map((b): BridgeVolume => ({
        name: b.displayName ?? b.name ?? 'Unknown',
        slug: (b.name ?? '').toLowerCase().replace(/\s+/g, '-'),
        volume24h: b.currentDayVolume ?? 0,
        volume7d: b.weeklyVolume ?? 0,
        volume30d: b.monthlyVolume ?? 0,
        tvl: b.lastHourlyVolume ?? 0,
        chains: b.chains ?? [],
        depositors24h: b.currentDayDeposits ?? 0,
        source: 'defillama-bridges',
        timestamp: now,
      }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/bridges`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: BridgeVolume[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface DefiLlamaBridge {
  id?: number;
  name?: string;
  displayName?: string;
  chains?: string[];
  currentDayVolume?: number;
  weeklyVolume?: number;
  monthlyVolume?: number;
  lastHourlyVolume?: number;
  currentDayDeposits?: number;
}
