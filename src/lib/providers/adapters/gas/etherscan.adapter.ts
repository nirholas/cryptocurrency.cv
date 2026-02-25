/**
 * Etherscan Gas Adapter — Ethereum gas price oracle
 *
 * Etherscan provides real-time gas price estimates:
 * - Free tier: 5 req/s (with API key)
 * - SafeGasPrice, ProposeGasPrice, FastGasPrice, suggestBaseFee
 * - Sign up: https://etherscan.io/apis
 *
 * @module providers/adapters/gas/etherscan
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface GasPrice {
  chain: string;
  chainId: number;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  baseFee: number | null;
  unit: 'gwei';
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ETHERSCAN_BASE = 'https://api.etherscan.io/api';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: ETHERSCAN_API_KEY ? 300 : 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const etherscanGasAdapter: DataProvider<GasPrice> = {
  name: 'etherscan-gas',
  description: 'Etherscan Gas Oracle — Ethereum gas price estimates (Gwei)',
  priority: 1,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['gas-fees'],

  async fetch(_params: FetchParams): Promise<GasPrice> {
    const url = `${ETHERSCAN_BASE}?module=gastracker&action=gasoracle${
      ETHERSCAN_API_KEY ? `&apikey=${ETHERSCAN_API_KEY}` : ''
    }`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== '1' || !data.result) {
      throw new Error(`Etherscan API returned error: ${data.message ?? 'Unknown'}`);
    }

    return normalize(data.result);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${ETHERSCAN_BASE}?module=gastracker&action=gasoracle${
        ETHERSCAN_API_KEY ? `&apikey=${ETHERSCAN_API_KEY}` : ''
      }`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: GasPrice): boolean {
    return (
      typeof data.slow === 'number' &&
      data.slow > 0 &&
      typeof data.fast === 'number' &&
      data.fast > 0
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface EtherscanGasResult {
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
}

function normalize(raw: EtherscanGasResult): GasPrice {
  return {
    chain: 'ethereum',
    chainId: 1,
    slow: parseFloat(raw.SafeGasPrice) || 0,
    standard: parseFloat(raw.ProposeGasPrice) || 0,
    fast: parseFloat(raw.FastGasPrice) || 0,
    instant: Math.round((parseFloat(raw.FastGasPrice) || 0) * 1.2),
    baseFee: parseFloat(raw.suggestBaseFee) || null,
    unit: 'gwei',
    lastUpdated: new Date().toISOString(),
  };
}
