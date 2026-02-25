/**
 * Dune Analytics Stablecoins Adapter — SQL-derived stablecoin metrics
 *
 * Queries pre-built Dune dashboards for on-chain stablecoin transfer volume,
 * mints/burns, and per-chain breakdown.
 *
 * @see https://docs.dune.com/api-reference/
 * @module providers/adapters/stablecoin-flows/dune
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { StablecoinFlow } from './types';

const BASE = 'https://api.dune.com/api/v1';
const DUNE_KEY = process.env.DUNE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };

/**
 * Pre-existing Dune query IDs for stablecoin supply.
 * Replace with your own query IDs if desired.
 */
const SUPPLY_QUERY_ID = process.env.DUNE_STABLECOIN_QUERY_ID ?? '2411093';

export const duneStablecoinsAdapter: DataProvider<StablecoinFlow[]> = {
  name: 'dune-stablecoins',
  description: 'Dune Analytics — SQL-powered stablecoin on-chain data',
  priority: 4,
  weight: 0.10,
  rateLimit: RATE_LIMIT,
  capabilities: ['stablecoin-flows'],

  async fetch(_params: FetchParams): Promise<StablecoinFlow[]> {
    if (!DUNE_KEY) throw new Error('DUNE_API_KEY not configured');

    const headers: Record<string, string> = {
      'X-Dune-API-Key': DUNE_KEY,
    };

    // Fetch latest query results (pre-executed query)
    const res = await fetch(
      `${BASE}/query/${SUPPLY_QUERY_ID}/results?limit=50`,
      { headers, signal: AbortSignal.timeout(15_000) },
    );

    if (!res.ok) throw new Error(`Dune API error: ${res.status}`);

    const json = await res.json();
    const rows: DuneRow[] = json?.result?.rows ?? [];
    const now = new Date().toISOString();

    const results: StablecoinFlow[] = rows.map((r, i) => ({
      id: r.symbol?.toLowerCase() ?? `dune-${i}`,
      name: r.name ?? r.symbol ?? '',
      symbol: r.symbol ?? '',
      pegType: 'peggedUSD',
      circulatingUsd: r.total_supply ?? r.market_cap ?? 0,
      circulatingChange24h: r.supply_change_24h ?? 0,
      circulatingChange7d: r.supply_change_7d ?? 0,
      chainDistribution: r.chain ? [{ chain: r.chain, amount: r.total_supply ?? 0 }] : [],
      price: r.price ?? 1.0,
      rank: i + 1,
      timestamp: r.timestamp ?? now,
    }));

    if (results.length === 0) throw new Error('No Dune stablecoin data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!DUNE_KEY) return false;
    try {
      const res = await fetch(`${BASE}/query/${SUPPLY_QUERY_ID}/results?limit=1`, {
        headers: { 'X-Dune-API-Key': DUNE_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: StablecoinFlow[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// Internal
interface DuneRow {
  symbol?: string;
  name?: string;
  total_supply?: number;
  market_cap?: number;
  supply_change_24h?: number;
  supply_change_7d?: number;
  chain?: string;
  price?: number;
  timestamp?: string;
}
