/**
 * EigenLayer Restaking Adapter — Restaking protocol metrics
 *
 * EigenLayer tracks restaked ETH, AVS (Actively Validated Services),
 * operator data, and restaking yields.
 *
 * @see https://docs.eigenlayer.xyz/
 * @module providers/adapters/defi/eigenlayer
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const BASE = 'https://api.eigenlayer.xyz/api/v1';
const DUNE_BASE = 'https://api.dune.com/api/v1';
const DUNE_KEY = process.env.DUNE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };

/** EigenLayer restaking data query (Dune) — use community query */
const EIGENLAYER_QUERY_ID = process.env.EIGENLAYER_DUNE_QUERY_ID ?? '3228284';

export interface EigenLayerData {
  totalRestaked: number;
  totalRestakers: number;
  totalOperators: number;
  totalAvs: number;
  strategies: EigenStrategy[];
  timestamp: string;
}

export interface EigenStrategy {
  name: string;
  symbol: string;
  tvl: number;
  apy: number;
  restakers: number;
}

export const eigenlayerAdapter: DataProvider<YieldPool[]> = {
  name: 'eigenlayer-restaking',
  description: 'EigenLayer — Restaking protocol TVL & yield data',
  priority: 5,
  weight: 0.10,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields', 'tvl'],

  async fetch(_params: FetchParams): Promise<YieldPool[]> {
    // Try DefiLlama first for EigenLayer TVL (no key needed)
    const strategies = await fetchEigenStrategies();
    const now = new Date().toISOString();

    const results: YieldPool[] = strategies.map(s => ({
      poolId: `eigenlayer-${s.symbol.toLowerCase()}`,
      project: 'EigenLayer',
      chain: 'Ethereum',
      symbol: s.symbol,
      apyBase: s.apy,
      apyReward: 0,
      totalApy: s.apy,
      tvl: s.tvl,
      stablecoin: false,
      exposure: 'single',
      ilRisk: 'none',
      predictedClass: null,
      url: 'https://app.eigenlayer.xyz/',
    }));

    if (results.length === 0) throw new Error('No EigenLayer data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      // Check DefiLlama for EigenLayer protocol
      const res = await fetch(
        'https://api.llama.fi/protocol/eigenlayer',
        { signal: AbortSignal.timeout(5000) },
      );
      return res.ok;
    } catch { return false; }
  },

  validate(data: YieldPool[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchEigenStrategies(): Promise<EigenStrategy[]> {
  // Primary: DefiLlama protocol data for EigenLayer
  try {
    const res = await fetch('https://api.llama.fi/protocol/eigenlayer', {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const tvl = data?.tvl?.at(-1)?.totalLiquidityUSD ?? 0;
      // DefiLlama doesn't break down strategies, so return as single pool
      return [{
        name: 'EigenLayer Restaking',
        symbol: 'ETH',
        tvl,
        apy: 0, // Would need separate data source
        restakers: 0,
      }];
    }
  } catch { /* fall through */ }

  // Fallback: Dune query
  if (DUNE_KEY) {
    try {
      const res = await fetch(
        `${DUNE_BASE}/query/${EIGENLAYER_QUERY_ID}/results?limit=20`,
        {
          headers: { 'X-Dune-API-Key': DUNE_KEY },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (res.ok) {
        const json = await res.json();
        const rows: DuneEigenRow[] = json?.result?.rows ?? [];
        return rows.map(r => ({
          name: r.strategy_name ?? 'Unknown',
          symbol: r.symbol ?? 'ETH',
          tvl: r.tvl_usd ?? 0,
          apy: r.apy ?? 0,
          restakers: r.restakers ?? 0,
        }));
      }
    } catch { /* fall through */ }
  }

  // Last resort: static known strategies
  return [
    { name: 'stETH Strategy', symbol: 'stETH', tvl: 0, apy: 0, restakers: 0 },
    { name: 'rETH Strategy', symbol: 'rETH', tvl: 0, apy: 0, restakers: 0 },
    { name: 'cbETH Strategy', symbol: 'cbETH', tvl: 0, apy: 0, restakers: 0 },
    { name: 'Native ETH', symbol: 'ETH', tvl: 0, apy: 0, restakers: 0 },
  ];
}

// Internal
interface DuneEigenRow {
  strategy_name?: string;
  symbol?: string;
  tvl_usd?: number;
  apy?: number;
  restakers?: number;
}
