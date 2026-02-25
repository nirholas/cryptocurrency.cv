/**
 * CoinCap Adapter — Secondary market price provider
 *
 * CoinCap provides real-time pricing data for 1,500+ coins.
 * - No API key required
 * - WebSocket support for real-time updates
 * - 200 req/min on free tier
 *
 * CoinCap uses different ID conventions than CoinGecko,
 * so this adapter includes ID mapping.
 *
 * @module providers/adapters/market-price/coincap
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../providers/types';
import type { MarketPrice } from './coingecko.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const COINCAP_BASE = 'https://api.coincap.io/v2';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 200,
  windowMs: 60_000,
};

/**
 * Mapping from CoinGecko IDs to CoinCap IDs for common coins.
 * CoinCap uses lowercase names (e.g., "bitcoin", "ethereum").
 */
const COINGECKO_TO_COINCAP: Record<string, string> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  tether: 'tether',
  'binancecoin': 'binance-coin',
  ripple: 'xrp',
  'usd-coin': 'usd-coin',
  solana: 'solana',
  cardano: 'cardano',
  dogecoin: 'dogecoin',
  'staked-ether': 'lido-staked-ether',
  polkadot: 'polkadot',
  'avalanche-2': 'avalanche',
  chainlink: 'chainlink',
  'matic-network': 'polygon',
  litecoin: 'litecoin',
  'shiba-inu': 'shiba-inu',
  'wrapped-bitcoin': 'wrapped-bitcoin',
  uniswap: 'uniswap',
  cosmos: 'cosmos',
  stellar: 'stellar',
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * CoinCap market price provider.
 *
 * Priority: 2 (first fallback)
 * Weight: 0.25 (moderate trust — good real-time data, fewer coins)
 */
export const coincapAdapter: DataProvider<MarketPrice[]> = {
  name: 'coincap',
  description: 'CoinCap API v2 — real-time cryptocurrency pricing (1,500+ coins)',
  priority: 2,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const limit = params.limit ?? 100;

    // CoinCap supports fetching by IDs
    let url: string;
    if (params.coinIds && params.coinIds.length > 0) {
      const coincapIds = params.coinIds
        .map(id => COINGECKO_TO_COINCAP[id] ?? id)
        .join(',');
      url = `${COINCAP_BASE}/assets?ids=${coincapIds}&limit=${limit}`;
    } else {
      url = `${COINCAP_BASE}/assets?limit=${limit}`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CoinCap API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const raw: CoinCapAsset[] = result.data ?? [];
    return raw.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COINCAP_BASE}/assets?limit=1`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.currentPrice === 'number' &&
      item.currentPrice > 0,
    );
  },
};

// =============================================================================
// INTERNAL — Raw API types and normalization
// =============================================================================

interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

/**
 * Reverse mapping: CoinCap ID → CoinGecko ID.
 */
const COINCAP_TO_COINGECKO: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_TO_COINCAP).map(([cg, cc]) => [cc, cg]),
);

function normalize(raw: CoinCapAsset): MarketPrice {
  const price = parseFloat(raw.priceUsd) || 0;
  const changePct = parseFloat(raw.changePercent24Hr) || 0;
  const priceChange = price * (changePct / 100);

  return {
    id: COINCAP_TO_COINGECKO[raw.id] ?? raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    currentPrice: price,
    marketCap: parseFloat(raw.marketCapUsd) || 0,
    marketCapRank: parseInt(raw.rank, 10) || 0,
    totalVolume: parseFloat(raw.volumeUsd24Hr) || 0,
    priceChange24h: priceChange,
    priceChangePercentage24h: changePct,
    high24h: 0, // CoinCap doesn't provide high/low
    low24h: 0,
    circulatingSupply: parseFloat(raw.supply) || 0,
    totalSupply: raw.maxSupply ? parseFloat(raw.maxSupply) : null,
    lastUpdated: new Date().toISOString(),
  };
}
