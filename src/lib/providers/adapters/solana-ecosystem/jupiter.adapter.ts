/**
 * Jupiter Aggregator Adapter (Solana)
 *
 * Jupiter is the #1 DEX aggregator on Solana:
 * - Aggregates all major Solana DEXes
 * - Token list with pricing
 * - No API key required
 *
 * @module providers/adapters/solana-ecosystem/jupiter
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SolanaToken } from './types';

const BASE = 'https://token.jup.ag';
const PRICE_BASE = 'https://price.jup.ag/v6';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

const TOP_SOLANA_MINTS = [
  'So11111111111111111111111111111111111111112',  // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a',  // RLBB
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',  // HNT
];

export const jupiterAdapter: DataProvider<SolanaToken[]> = {
  name: 'jupiter',
  description: 'Jupiter — #1 Solana DEX aggregator, token pricing',
  priority: 1,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['solana-ecosystem'],

  async fetch(params: FetchParams): Promise<SolanaToken[]> {
    const mints = params.extra?.mints as string[] ?? TOP_SOLANA_MINTS;
    const ids = mints.join(',');

    const res = await fetch(`${PRICE_BASE}/price?ids=${ids}`);
    if (!res.ok) throw new Error(`Jupiter price API: ${res.status}`);

    const json = await res.json();
    const prices: Record<string, JupiterPrice> = json.data ?? {};
    const now = new Date().toISOString();

    return Object.entries(prices).map(([mint, p]): SolanaToken => ({
      address: mint,
      symbol: p.mintSymbol ?? 'UNKNOWN',
      name: p.mintSymbol ?? 'Unknown Token',
      decimals: 0,
      priceUsd: p.price ?? 0,
      volume24h: 0,
      marketCap: 0,
      priceChange24h: 0,
      holders: undefined,
      verified: true,
      source: 'jupiter',
      timestamp: now,
    }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${PRICE_BASE}/price?ids=So11111111111111111111111111111111111111112`, {
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

interface JupiterPrice {
  id: string;
  mintSymbol?: string;
  vsToken?: string;
  vsTokenSymbol?: string;
  price: number;
}
