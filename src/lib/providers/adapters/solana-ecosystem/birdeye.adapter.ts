/**
 * Birdeye Adapter (Solana)
 *
 * Birdeye provides comprehensive Solana DeFi analytics:
 * - Token overview with price, volume, market cap
 * - Trending tokens with momentum metrics
 * - Top gainers/losers
 *
 * @module providers/adapters/solana-ecosystem/birdeye
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SolanaToken } from './types';

const BASE = 'https://public-api.birdeye.so';
const API_KEY = process.env.BIRDEYE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 100 : 0,
  windowMs: 60_000,
};

export const birdeyeAdapter: DataProvider<SolanaToken[]> = {
  name: 'birdeye',
  description: 'Birdeye — Solana DeFi analytics, trending tokens',
  priority: 2,
  weight: 0.35,
  rateLimit: RATE_LIMIT,
  capabilities: ['solana-ecosystem'],

  async fetch(params: FetchParams): Promise<SolanaToken[]> {
    if (!API_KEY) throw new Error('BIRDEYE_API_KEY not configured');

    const limit = params.limit ?? 50;
    const sortBy = (params.extra?.sortBy as string) ?? 'v24hUSD';
    const sortType = (params.extra?.sortType as string) ?? 'desc';

    const res = await fetch(
      `${BASE}/defi/tokenlist?sort_by=${sortBy}&sort_type=${sortType}&offset=0&limit=${limit}`,
      {
        headers: {
          'X-API-KEY': API_KEY,
          'x-chain': 'solana',
        },
      },
    );

    if (!res.ok) throw new Error(`Birdeye API: ${res.status}`);

    const json = await res.json();
    const tokens: BirdeyeToken[] = json.data?.tokens ?? [];
    const now = new Date().toISOString();

    return tokens.map((t): SolanaToken => ({
      address: t.address,
      symbol: t.symbol ?? 'UNKNOWN',
      name: t.name ?? t.symbol ?? 'Unknown',
      decimals: t.decimals ?? 0,
      priceUsd: t.price ?? 0,
      volume24h: t.v24hUSD ?? 0,
      marketCap: t.mc ?? 0,
      priceChange24h: t.v24hChangePercent ?? 0,
      holders: t.holder,
      verified: true,
      source: 'birdeye',
      timestamp: now,
    }));
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/defi/tokenlist?limit=1`, {
        headers: { 'X-API-KEY': API_KEY, 'x-chain': 'solana' },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: SolanaToken[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface BirdeyeToken {
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  price?: number;
  v24hUSD?: number;
  v24hChangePercent?: number;
  mc?: number;
  holder?: number;
}
