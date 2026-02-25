/**
 * L2Beat Adapter — Layer 2 TVL and risk data
 *
 * L2Beat is the primary source for L2 protocol data:
 * - TVL per L2 chain
 * - Risk assessment (sequencer, proposer, state validation)
 * - Activity metrics (TPS, transaction count)
 * - Free public API, no key required
 *
 * @module providers/adapters/defi/l2beat
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { ProtocolTvl } from './types';

const L2BEAT_BASE = 'https://l2beat.com/api';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

/**
 * L2Beat TVL provider.
 *
 * Priority: 3 (supplementary)
 * Weight: 0.20 (authoritative for L2 data)
 */
export const l2beatAdapter: DataProvider<ProtocolTvl[]> = {
  name: 'l2beat',
  description: 'L2Beat — Layer 2 TVL, risk scores, and activity metrics',
  priority: 3,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['tvl'],

  async fetch(params: FetchParams): Promise<ProtocolTvl[]> {
    const limit = params.limit ?? 50;

    const response = await fetch(`${L2BEAT_BASE}/scaling/summary`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`L2Beat API error: ${response.status}`);
    }

    const json = await response.json();
    const projects: L2BeatProject[] = json?.data?.projects ?? json?.projects ?? [];
    const now = new Date().toISOString();

    const results: ProtocolTvl[] = projects
      .filter((p) => p.type === 'layer2' || p.type === 'layer3')
      .map((p, i) => ({
        id: p.slug || p.id || `l2beat-${i}`,
        name: p.name || '',
        category: p.type === 'layer3' ? 'Layer 3' : 'Layer 2',
        chain: 'ethereum',
        chains: ['ethereum'],
        tvl: p.tvl?.canonical ?? p.tvl?.total ?? 0,
        tvlChange1d: p.tvlChange?.day ?? 0,
        tvlChange7d: p.tvlChange?.week ?? 0,
        url: `https://l2beat.com/scaling/projects/${p.slug || p.id || ''}`,
        logo: '',
        timestamp: now,
      }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${L2BEAT_BASE}/scaling/summary`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: ProtocolTvl[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(d => typeof d.tvl === 'number');
  },
};

interface L2BeatProject {
  id?: string;
  slug?: string;
  name: string;
  type: string;
  tvl?: {
    canonical?: number;
    external?: number;
    native?: number;
    total?: number;
  };
  tvlChange?: {
    day?: number;
    week?: number;
    month?: number;
  };
  stage?: string;
  risks?: {
    sequencerFailure?: string;
    stateValidation?: string;
    dataAvailability?: string;
    exitWindow?: string;
    proposerFailure?: string;
  };
}
