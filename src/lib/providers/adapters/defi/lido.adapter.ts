/**
 * Lido Adapter — Liquid staking yield data
 *
 * Lido is the largest liquid staking protocol:
 * - stETH APR from Ethereum staking rewards
 * - Total value staked
 * - wstETH exchange rate
 * - Free public API, no key required
 *
 * @module providers/adapters/defi/lido
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const LIDO_API_BASE = 'https://eth-api.lido.fi';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

/**
 * Lido staking yields provider.
 *
 * Priority: 4 (supplementary staking yields)
 * Weight: 0.20 (authoritative for Lido/stETH data)
 */
export const lidoAdapter: DataProvider<YieldPool[]> = {
  name: 'lido',
  description: 'Lido — liquid staking APR, stETH/wstETH metrics',
  priority: 4,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields'],

  async fetch(params: FetchParams): Promise<YieldPool[]> {
    const [aprRes, statsRes] = await Promise.all([
      fetch(`${LIDO_API_BASE}/v1/protocol/steth/apr/sma`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(`${LIDO_API_BASE}/v1/protocol/steth/stats`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }),
    ]);

    if (!aprRes.ok) {
      throw new Error(`Lido APR API error: ${aprRes.status}`);
    }

    const aprJson = await aprRes.json();
    const statsJson = statsRes.ok ? await statsRes.json() : null;

    const now = new Date().toISOString();
    const apr = aprJson?.data?.smaApr ?? aprJson?.data?.aprs?.[0]?.apr ?? 0;
    const totalStaked = statsJson?.data?.totalPooledEther
      ? parseFloat(statsJson.data.totalPooledEther) / 1e18
      : 0;
    const ethPrice = statsJson?.data?.ethPrice ?? 0;

    const results: YieldPool[] = [
      {
        poolId: 'lido-steth',
        project: 'lido',
        chain: 'ethereum',
        symbol: 'stETH',
        tvl: totalStaked * ethPrice,
        apyBase: typeof apr === 'number' ? apr : parseFloat(apr || '0'),
        apyReward: 0,
        totalApy: typeof apr === 'number' ? apr : parseFloat(apr || '0'),
        stablecoin: false,
        exposure: 'single',
        ilRisk: 'none',
        predictedClass: null,
        url: 'https://stake.lido.fi/',
      },
    ];

    // Also try to fetch wstETH data
    try {
      const wstethRes = await fetch(`${LIDO_API_BASE}/v1/protocol/wsteth/stats`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (wstethRes.ok) {
        results.push({
          poolId: 'lido-wsteth',
          project: 'lido',
          chain: 'ethereum',
          symbol: 'wstETH',
          tvl: totalStaked * ethPrice * 0.3,
          apyBase: typeof apr === 'number' ? apr : parseFloat(apr || '0'),
          apyReward: 0,
          totalApy: typeof apr === 'number' ? apr : parseFloat(apr || '0'),
          stablecoin: false,
          exposure: 'single',
          ilRisk: 'none',
          predictedClass: null,
          url: 'https://stake.lido.fi/wrap',
        });
      }
    } catch {
      // wstETH data is optional
    }

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${LIDO_API_BASE}/v1/protocol/steth/apr/sma`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: YieldPool[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(d => typeof d.apy === 'number');
  },
};
