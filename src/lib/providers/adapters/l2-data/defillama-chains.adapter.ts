/**
 * DefiLlama Chains Adapter (L2 TVL)
 *
 * @module providers/adapters/l2-data/defillama-chains
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { L2Stats } from './types';

const BASE = 'https://api.llama.fi';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

const L2_CHAINS = new Set([
  'Arbitrum', 'Optimism', 'Polygon zkEVM', 'zkSync Era', 'Base', 'Linea',
  'Scroll', 'Blast', 'Manta Pacific', 'Mantle', 'Mode', 'Starknet',
  'Polygon', 'Immutable X', 'dYdX', 'Loopring', 'Metis',
]);

export const defillamaChainsAdapter: DataProvider<L2Stats[]> = {
  name: 'defillama-chains',
  description: 'DefiLlama — L2 chain TVL data',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['l2-data'],

  async fetch(params: FetchParams): Promise<L2Stats[]> {
    const limit = params.limit ?? 30;

    const res = await fetch(`${BASE}/v2/chains`);
    if (!res.ok) throw new Error(`DefiLlama chains: ${res.status}`);

    const chains: DefiLlamaChain[] = await res.json();
    const now = new Date().toISOString();

    return chains
      .filter((c) => L2_CHAINS.has(c.name ?? ''))
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, limit)
      .map((c): L2Stats => ({
        name: c.name ?? 'Unknown',
        slug: (c.name ?? '').toLowerCase().replace(/\s+/g, '-'),
        tvl: c.tvl ?? 0,
        tvlChange7d: 0,
        tps: 0,
        type: 'rollup',
        stage: 'N/A',
        dailyTxCount: 0,
        dailyActiveAddresses: 0,
        dailyCost: 0,
        canonicalTvl: c.tvl ?? 0,
        externalTvl: 0,
        source: 'defillama-chains',
        timestamp: now,
      }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/v2/chains`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: L2Stats[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface DefiLlamaChain {
  name?: string;
  tvl?: number;
  chainId?: number;
  gecko_id?: string;
  tokenSymbol?: string;
}
