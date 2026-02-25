/**
 * Helius Adapter (Solana)
 *
 * Helius provides Solana RPC + enhanced APIs:
 * - DAS (Digital Asset Standard) for NFTs and compressed NFTs
 * - Parsed transaction history
 * - Webhook support
 *
 * @module providers/adapters/solana-ecosystem/helius
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SolanaNetworkStats } from './types';

const API_KEY = process.env.HELIUS_API_KEY ?? '';
const BASE = `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`;

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 50 : 0,
  windowMs: 1_000,
};

export const heliusAdapter: DataProvider<SolanaNetworkStats> = {
  name: 'helius',
  description: 'Helius — Solana enhanced RPC + DAS APIs',
  priority: 3,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['solana-ecosystem'],

  async fetch(_params: FetchParams): Promise<SolanaNetworkStats> {
    if (!API_KEY) throw new Error('HELIUS_API_KEY not configured');

    const [perfRes, epochRes, supplyRes] = await Promise.all([
      jsonRpc('getRecentPerformanceSamples', [1]),
      jsonRpc('getEpochInfo', []),
      jsonRpc('getSupply', []),
    ]);

    const perfSample: Record<string, unknown> = perfRes.result?.[0] ?? {};
    const epochInfo: Record<string, unknown> = epochRes.result ?? {};
    const supply = supplyRes.result?.value ?? {};

    const txCount = Number(perfSample.numTransactions ?? 0);
    const samplePeriod = Number(perfSample.samplePeriodSecs ?? 60);
    const tps = samplePeriod > 0 ? txCount / samplePeriod : 0;
    const slotTimeMs = samplePeriod > 0 ? (samplePeriod * 1000) / Number(perfSample.numSlots ?? 1) : 400;

    return {
      tps: Math.round(tps),
      slot: Number(epochInfo.absoluteSlot ?? 0),
      epoch: Number(epochInfo.epoch ?? 0),
      validatorCount: 0,
      totalStaked: 0,
      slotTimeMs: Math.round(slotTimeMs),
      source: 'helius',
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await jsonRpc('getHealth', []);
      return String(res.result) === 'ok';
    } catch {
      return false;
    }
  },

  validate(data: SolanaNetworkStats): boolean {
    return typeof data.tps === 'number' && data.tps >= 0;
  },
};

interface RpcResult {
  result?: Record<string, unknown>;
}

interface PerformanceSample {
  numTransactions?: number;
  samplePeriodSecs?: number;
  numSlots?: number;
}

async function jsonRpc(method: string, params: unknown[]): Promise<RpcResult> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Helius RPC ${method}: ${res.status}`);
  return res.json();
}
