/**
 * Etherscan Adapter — Ethereum on-chain data
 *
 * Etherscan provides:
 * - Gas price oracle
 * - ETH supply & staking stats
 * - ERC-20 top tokens
 *
 * Requires ETHERSCAN_API_KEY env var (free tier: 5/sec).
 *
 * @module providers/adapters/on-chain/etherscan
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OnChainMetric } from './types';

const BASE = 'https://api.etherscan.io/api';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 1_000,
};

export const etherscanAdapter: DataProvider<OnChainMetric[]> = {
  name: 'etherscan',
  description: 'Etherscan — Ethereum gas prices, supply stats, and block data',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['on-chain', 'gas-fees'],

  async fetch(_params: FetchParams): Promise<OnChainMetric[]> {
    if (!ETHERSCAN_API_KEY) {
      throw new Error('Etherscan API key not configured (ETHERSCAN_API_KEY)');
    }

    const now = new Date().toISOString();
    const metrics: OnChainMetric[] = [];

    // Fetch gas oracle + ETH supply in parallel
    const [gasResponse, supplyResponse] = await Promise.allSettled([
      fetch(`${BASE}?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`),
      fetch(`${BASE}?module=stats&action=ethsupply2&apikey=${ETHERSCAN_API_KEY}`),
    ]);

    if (gasResponse.status === 'fulfilled' && gasResponse.value.ok) {
      const json = await gasResponse.value.json();
      const gas = json?.result;

      if (gas) {
        metrics.push(
          {
            metricId: 'eth_gas_safe',
            name: 'Ethereum Gas (Safe)',
            asset: 'ethereum',
            value: parseFloat(gas.SafeGasPrice ?? '0'),
            unit: 'gwei',
            resolution: 'realtime',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
          {
            metricId: 'eth_gas_standard',
            name: 'Ethereum Gas (Standard)',
            asset: 'ethereum',
            value: parseFloat(gas.ProposeGasPrice ?? '0'),
            unit: 'gwei',
            resolution: 'realtime',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
          {
            metricId: 'eth_gas_fast',
            name: 'Ethereum Gas (Fast)',
            asset: 'ethereum',
            value: parseFloat(gas.FastGasPrice ?? '0'),
            unit: 'gwei',
            resolution: 'realtime',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
          {
            metricId: 'eth_base_fee',
            name: 'Ethereum Base Fee',
            asset: 'ethereum',
            value: parseFloat(gas.suggestBaseFee ?? '0'),
            unit: 'gwei',
            resolution: 'realtime',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
        );
      }
    }

    if (supplyResponse.status === 'fulfilled' && supplyResponse.value.ok) {
      const json = await supplyResponse.value.json();
      const supply = json?.result;

      if (supply) {
        metrics.push(
          {
            metricId: 'eth_total_supply',
            name: 'ETH Total Supply',
            asset: 'ethereum',
            value: parseFloat(supply.EthSupply ?? '0') / 1e18,
            unit: 'ETH',
            resolution: '24h',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
          {
            metricId: 'eth_staking',
            name: 'ETH Staked (Beacon Chain)',
            asset: 'ethereum',
            value: parseFloat(supply.Eth2Staking ?? '0') / 1e18,
            unit: 'ETH',
            resolution: '24h',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
          {
            metricId: 'eth_burnt',
            name: 'ETH Burnt (EIP-1559)',
            asset: 'ethereum',
            value: parseFloat(supply.BurntFees ?? '0') / 1e18,
            unit: 'ETH',
            resolution: '24h',
            change: 0,
            source: 'etherscan',
            timestamp: now,
          },
        );
      }
    }

    return metrics;
  },

  async healthCheck(): Promise<boolean> {
    if (!ETHERSCAN_API_KEY) return false;
    try {
      const res = await fetch(`${BASE}?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OnChainMetric[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(m => typeof m.value === 'number' && typeof m.metricId === 'string');
  },
};
