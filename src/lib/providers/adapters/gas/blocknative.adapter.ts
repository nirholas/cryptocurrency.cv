/**
 * Blocknative Gas Adapter — Multi-chain gas estimation
 *
 * Blocknative provides highly accurate gas estimates using their mempool:
 * - Free tier: 1,000 req/month
 * - Ethereum mainnet + L2s (Base, Optimism, Arbitrum, Polygon)
 * - Confidence-based estimates (70%, 80%, 90%, 95%, 99%)
 * - Sign up: https://www.blocknative.com/gas-estimator
 *
 * @module providers/adapters/gas/blocknative
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { GasPrice } from './etherscan.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const BLOCKNATIVE_BASE = 'https://api.blocknative.com/gasprices/blockprices';
const BLOCKNATIVE_API_KEY = process.env.BLOCKNATIVE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const blocknativeGasAdapter: DataProvider<GasPrice> = {
  name: 'blocknative-gas',
  description: 'Blocknative Gas — mempool-based gas estimation with confidence levels',
  priority: 2,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['gas-fees'],

  async fetch(_params: FetchParams): Promise<GasPrice> {
    if (!BLOCKNATIVE_API_KEY) {
      throw new Error('Blocknative requires API key (BLOCKNATIVE_API_KEY)');
    }

    const response = await fetch(BLOCKNATIVE_BASE, {
      headers: {
        Accept: 'application/json',
        Authorization: BLOCKNATIVE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Blocknative API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return normalize(data);
  },

  async healthCheck(): Promise<boolean> {
    if (!BLOCKNATIVE_API_KEY) return false;
    try {
      const response = await fetch(BLOCKNATIVE_BASE, {
        headers: { Authorization: BLOCKNATIVE_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
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

interface BlocknativeResponse {
  system: string;
  network: string;
  unit: string;
  maxPrice: number;
  currentBlockNumber: number;
  msFastestBlock: number;
  msNormalBlock: number;
  blockPrices: Array<{
    blockNumber: number;
    estimatedTransactionCount: number;
    baseFeePerGas: number;
    estimatedPrices: Array<{
      confidence: number;
      price: number;
      maxPriorityFeePerGas: number;
      maxFeePerGas: number;
    }>;
  }>;
}

function normalize(raw: BlocknativeResponse): GasPrice {
  const block = raw.blockPrices?.[0];
  const prices = block?.estimatedPrices ?? [];

  // Map confidence levels to our speed tiers
  const conf99 = prices.find(p => p.confidence === 99);
  const conf90 = prices.find(p => p.confidence === 90);
  const conf80 = prices.find(p => p.confidence === 80);
  const conf70 = prices.find(p => p.confidence === 70);

  return {
    chain: 'ethereum',
    chainId: 1,
    slow: conf70?.maxFeePerGas ?? conf80?.maxFeePerGas ?? 0,
    standard: conf80?.maxFeePerGas ?? conf90?.maxFeePerGas ?? 0,
    fast: conf90?.maxFeePerGas ?? conf99?.maxFeePerGas ?? 0,
    instant: conf99?.maxFeePerGas ?? 0,
    baseFee: block?.baseFeePerGas ?? null,
    unit: 'gwei',
    lastUpdated: new Date().toISOString(),
  };
}
