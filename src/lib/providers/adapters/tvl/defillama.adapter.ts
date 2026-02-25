/**
 * DefiLlama TVL Adapter — Total Value Locked provider
 *
 * DefiLlama is the gold standard for DeFi TVL data:
 * - 2,000+ protocols tracked across 200+ chains
 * - Free, no API key needed
 * - Generous rate limits
 *
 * Endpoints used:
 * - /protocols — All protocols with TVL
 * - /tvl/{protocol} — TVL for a specific protocol
 * - /v2/chains — TVL per chain
 *
 * @module providers/adapters/tvl/defillama
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface TVLData {
  /** Protocol or chain name */
  name: string;
  /** Slug identifier */
  slug: string;
  /** Chain(s) the protocol is on */
  chains: string[];
  /** Category (DEX, Lending, Bridge, etc.) */
  category: string;
  /** Current TVL in USD */
  tvl: number;
  /** 24h change in TVL (absolute USD) */
  change24h: number | null;
  /** 7d change in TVL (absolute USD) */
  change7d: number | null;
  /** 1h TVL change percentage */
  changePercent1h: number | null;
  /** 24h TVL change percentage */
  changePercent24h: number | null;
  /** 7d TVL change percentage */
  changePercent7d: number | null;
  /** Market cap / TVL ratio */
  mcapTvl: number | null;
  /** Token symbol if applicable */
  symbol: string | null;
  /** Logo URL */
  logo: string | null;
  /** Last updated ISO string */
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFILLAMA_BASE = 'https://api.llama.fi';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 300,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const defillamaTvlAdapter: DataProvider<TVLData[]> = {
  name: 'defillama-tvl',
  description: 'DefiLlama — DeFi TVL data for 2,000+ protocols across 200+ chains',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['tvl'],

  async fetch(params: FetchParams): Promise<TVLData[]> {
    const chain = params.chain;
    const limit = params.limit ?? 100;
    const category = params.category;

    // If requesting per-chain TVL
    if (params.extra?.mode === 'chains') {
      const res = await fetch(`${DEFILLAMA_BASE}/v2/chains`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`DefiLlama chains API error: ${res.status}`);
      const chains: DefiLlamaChain[] = await res.json();
      return chains.slice(0, limit).map(normalizeChain);
    }

    // Default: protocol TVL
    const res = await fetch(`${DEFILLAMA_BASE}/protocols`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`DefiLlama protocols API error: ${res.status}`);
    let protocols: DefiLlamaProtocol[] = await res.json();

    // Filter by chain if specified
    if (chain) {
      protocols = protocols.filter(p =>
        p.chains?.some(c => c.toLowerCase() === chain.toLowerCase()),
      );
    }

    // Filter by category if specified
    if (category) {
      protocols = protocols.filter(p =>
        p.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    // Sort by TVL descending and limit
    protocols.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return protocols.slice(0, limit).map(normalizeProtocol);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${DEFILLAMA_BASE}/v2/chains`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: TVLData[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.tvl === 'number' && item.tvl >= 0 && typeof item.name === 'string',
    );
  },
};

// =============================================================================
// INTERNAL — Raw API types and normalization
// =============================================================================

interface DefiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  chains: string[];
  category: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  mcapTvl: number | null;
  symbol: string;
  logo: string;
}

interface DefiLlamaChain {
  gecko_id: string | null;
  tvl: number;
  tokenSymbol: string | null;
  cmcId: string | null;
  name: string;
  chainId: number | null;
}

function normalizeProtocol(raw: DefiLlamaProtocol): TVLData {
  return {
    name: raw.name,
    slug: raw.slug ?? raw.name.toLowerCase().replace(/\s+/g, '-'),
    chains: raw.chains ?? [],
    category: raw.category ?? 'Unknown',
    tvl: raw.tvl ?? 0,
    change24h: null,
    change7d: null,
    changePercent1h: raw.change_1h ?? null,
    changePercent24h: raw.change_1d ?? null,
    changePercent7d: raw.change_7d ?? null,
    mcapTvl: raw.mcapTvl ?? null,
    symbol: raw.symbol ?? null,
    logo: raw.logo ?? null,
    lastUpdated: new Date().toISOString(),
  };
}

function normalizeChain(raw: DefiLlamaChain): TVLData {
  return {
    name: raw.name,
    slug: raw.name.toLowerCase().replace(/\s+/g, '-'),
    chains: [raw.name],
    category: 'Chain',
    tvl: raw.tvl ?? 0,
    change24h: null,
    change7d: null,
    changePercent1h: null,
    changePercent24h: null,
    changePercent7d: null,
    mcapTvl: null,
    symbol: raw.tokenSymbol ?? null,
    logo: null,
    lastUpdated: new Date().toISOString(),
  };
}
