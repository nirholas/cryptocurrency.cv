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
    const getSpeed = (acceptance: number) => {
      const s = speeds.find(sp => sp.acceptance >= acceptance) || speeds[0];
      return {
        gasPrice: s?.gasPrice ?? 0,
        estimatedSeconds: s?.estimatedFee ?? 0,
      };
    };

    const result: GasFeeEstimate = {
      chain,
      baseFee: data.baseFee ?? 0,
      speeds: {
        slow: getSpeed(0.35),
        standard: getSpeed(0.6),
        fast: getSpeed(0.9),
        instant: getSpeed(0.99),
      },
      lastBlock: data.lastBlock ?? 0,
      timestamp: now,
    };

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

interface OwlracleGasResponse {
  baseFee?: number;
  lastBlock?: number;
  avgTime?: number;
  avgTx?: number;
  avgGas?: number;
  speeds?: Array<{
    acceptance: number;
    gasPrice: number;
    estimatedFee: number;
  }>;
  error?: string;
  message?: string;
}
