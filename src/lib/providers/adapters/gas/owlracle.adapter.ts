/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Owlracle Adapter — Multi-chain gas fee estimates
 *
 * Owlracle provides gas fee data for multiple chains:
 * - Ethereum, BSC, Polygon, Fantom, Avalanche, Arbitrum, Optimism
 * - Historical gas price data
 * - Free tier: 300 req/month, paid tiers available
 * - No key required for basic gas data
 *
 * @module providers/adapters/gas/owlracle
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

const OWLRACLE_BASE = 'https://api.owlracle.info/v4';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

// Chain IDs supported by Owlracle
const CHAIN_MAP: Record<string, string> = {
  ethereum: 'eth',
  bsc: 'bsc',
  polygon: 'poly',
  fantom: 'ftm',
  avalanche: 'avax',
  arbitrum: 'arb',
  optimism: 'opt',
  base: 'base',
};

/** Gas fee estimate for a speed tier */
export interface GasFeeEstimate {
  chain: string;
  baseFee: number;
  speeds: {
    slow: { gasPrice: number; estimatedSeconds: number };
    standard: { gasPrice: number; estimatedSeconds: number };
    fast: { gasPrice: number; estimatedSeconds: number };
    instant: { gasPrice: number; estimatedSeconds: number };
  };
  lastBlock: number;
  timestamp: string;
}

/**
 * Owlracle gas fee provider.
 *
 * Priority: 3 (tertiary gas source)
 * Weight: 0.15 (supplementary — multi-chain coverage)
 */
export const owlracleAdapter: DataProvider<GasFeeEstimate[]> = {
  name: 'owlracle',
  description: 'Owlracle — multi-chain gas fee estimates for 8+ networks',
  priority: 3,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['gas-fees'],

  async fetch(params: FetchParams): Promise<GasFeeEstimate[]> {
    const chain = params.chain ?? 'ethereum';
    const owlChain = CHAIN_MAP[chain] ?? 'eth';
    const apiKey = process.env.OWLRACLE_API_KEY ?? '';

    let url = `${OWLRACLE_BASE}/${owlChain}/gas`;
    if (apiKey) {
      url += `?apikey=${apiKey}`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Owlracle API error: ${response.status}`);
    }

    const data: OwlracleGasResponse = await response.json();
    const now = new Date().toISOString();

    if (data.error) {
      throw new Error(`Owlracle error: ${data.message || data.error}`);
    }

    const speeds = data.speeds || [];
    if (speeds.length === 0) {
      throw new Error('Owlracle returned no speed tiers');
    }

    // Owlracle does not publish a confirmation-time estimate. Each tier's
    // `acceptance` is the share of recent blocks it would have made, so the
    // expected wait is roughly one block time divided by that share.
    const blockSeconds = data.avgTime && data.avgTime > 0 ? data.avgTime : 12;

    const getSpeed = (acceptance: number) => {
      const tier = speeds.find((sp) => sp.acceptance >= acceptance) ?? speeds[speeds.length - 1];
      const share = tier.acceptance > 0 ? tier.acceptance : 1;
      return {
        gasPrice: tier.maxFeePerGas,
        estimatedSeconds: Math.round((blockSeconds / share) * 10) / 10,
      };
    };

    const result: GasFeeEstimate = {
      chain,
      // v4 reports base fee per tier; the cheapest tier tracks the network base
      // fee most closely.
      baseFee: speeds[0].baseFee,
      speeds: {
        slow: getSpeed(0.35),
        standard: getSpeed(0.6),
        fast: getSpeed(0.9),
        instant: getSpeed(0.99),
      },
      // Not published by v4. Callers read it as "unknown", never as block 0.
      lastBlock: 0,
      timestamp: now,
    };

    if (result.speeds.standard.gasPrice <= 0) {
      // A zeroed estimate is worse than no estimate: the chain would cache it
      // and stop failing over to Etherscan / Blocknative.
      throw new Error('Owlracle returned a zero gas price');
    }

    return [result];
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${OWLRACLE_BASE}/eth/gas`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: GasFeeEstimate[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(d => d.speeds && typeof d.baseFee === 'number');
  },
};

/**
 * Owlracle v4 `/{chain}/gas` response.
 *
 * v4 reports each speed tier as an EIP-1559 pair and carries no top-level
 * `baseFee`, `gasPrice` or `lastBlock`. The adapter used to read those three
 * fields, so every value it produced was `0` and the /gas page rendered a
 * column of zeroes whenever the chain fell through to this provider.
 */
interface OwlracleGasResponse {
  timestamp?: string;
  /** Average seconds per block, used to estimate confirmation time. */
  avgTime?: number;
  avgTx?: number;
  avgGas?: number;
  speeds?: Array<{
    /** Share of recent transactions this tier would have been included in. */
    acceptance: number;
    /** Total gwei per gas unit to bid for this tier. */
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
    /** Network base fee observed for this tier, in gwei. */
    baseFee: number;
    /** Estimated total fee in the chain's native currency. */
    estimatedFee: number;
  }>;
  error?: string;
  message?: string;
}
