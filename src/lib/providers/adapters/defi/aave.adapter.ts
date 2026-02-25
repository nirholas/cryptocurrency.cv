/**
 * Aave Adapter — On-chain lending yield data
 *
 * Aave provides lending/borrowing yields directly from the protocol:
 * - Supply APY for all supported assets
 * - Borrow APY (variable + stable)
 * - Total deposits and borrows
 * - Multi-chain: Ethereum, Arbitrum, Optimism, Polygon, Avalanche, Base
 * - Free public API via The Graph / Aave API
 *
 * @module providers/adapters/defi/aave
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const AAVE_API_BASE = 'https://aave-api-v2.aave.com';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

/**
 * Aave yields provider.
 *
 * Priority: 3 (supplementary yields source)
 * Weight: 0.25 (authoritative for Aave yields)
 */
export const aaveAdapter: DataProvider<YieldPool[]> = {
  name: 'aave',
  description: 'Aave — on-chain lending/borrowing yields across multiple chains',
  priority: 3,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields'],

  async fetch(params: FetchParams): Promise<YieldPool[]> {
    const limit = params.limit ?? 50;

    // Fetch Aave V3 reserve data
    const response = await fetch(`${AAVE_API_BASE}/data/reserves-data?currentTimestamp=${Math.floor(Date.now() / 1000)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      // Fallback to DeFi Llama Aave pools
      return this._fetchFromDefiLlama(limit);
    }

    const json = await response.json();
    const reserves: AaveReserve[] = json ?? [];
    const now = new Date().toISOString();

    const results: YieldPool[] = reserves
      .filter(r => r.isActive && !r.isFrozen)
      .map((r, i) => ({
        poolId: `aave-v3-${r.symbol?.toLowerCase() || i}`,
        project: 'aave-v3',
        chain: 'ethereum',
        symbol: r.symbol || '',
        tvl: parseFloat(r.totalLiquidity || '0') * parseFloat(r.priceInUsd || '0'),
        apyBase: parseFloat(r.liquidityRate || '0') * 100,
        apyReward: parseFloat(r.aIncentivesAPY || '0') * 100,
        totalApy: (parseFloat(r.liquidityRate || '0') + parseFloat(r.aIncentivesAPY || '0')) * 100,
        stablecoin: ['USDT', 'USDC', 'DAI', 'FRAX', 'LUSD'].includes(r.symbol || ''),
        exposure: 'single',
        ilRisk: 'none',
        predictedClass: null,
        url: `https://app.aave.com/reserve-overview/?underlyingAsset=${r.symbol?.toLowerCase() || ''}`,
      }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${AAVE_API_BASE}/data/reserves-data?currentTimestamp=${Math.floor(Date.now() / 1000)}`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: YieldPool[]): boolean {
    if (!Array.isArray(data)) return false;
    return data.every(d => typeof d.tvl === 'number');
  },
};

/** Fallback: fetch Aave yields from DeFi Llama */
async function _fetchFromDefiLlama(limit: number): Promise<YieldPool[]> {
  const response = await fetch('https://yields.llama.fi/pools', {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`DeFi Llama yields API error: ${response.status}`);
  }

  const json = await response.json();
  const pools: DefiLlamaPool[] = (json?.data ?? []).filter(
    (p: DefiLlamaPool) => p.project === 'aave-v3' || p.project === 'aave-v2',
  );

  return pools
    .map((p, i) => ({
      poolId: p.pool || `aave-llama-${i}`,
      project: p.project,
      chain: p.chain?.toLowerCase() || 'ethereum',
      symbol: p.symbol || '',
      tvl: p.tvlUsd || 0,
      apyBase: p.apyBase || 0,
      apyReward: p.apyReward || 0,
      totalApy: p.apy || 0,
      stablecoin: p.stablecoin ?? false,
      exposure: 'single',
      ilRisk: 'none',
      predictedClass: null,
      url: '',
    }))
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit);
}

// Bind the fallback method
Object.defineProperty(aaveAdapter, '_fetchFromDefiLlama', {
  value: _fetchFromDefiLlama,
  writable: false,
});

interface AaveReserve {
  symbol?: string;
  isActive: boolean;
  isFrozen: boolean;
  totalLiquidity?: string;
  priceInUsd?: string;
  liquidityRate?: string;
  variableBorrowRate?: string;
  stableBorrowRate?: string;
  aIncentivesAPY?: string;
  vIncentivesAPY?: string;
}

interface DefiLlamaPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  rewardTokens: string[];
}
