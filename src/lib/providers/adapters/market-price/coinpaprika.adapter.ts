/**
 * CoinPaprika Adapter — High-coverage fallback market price provider
 *
 * CoinPaprika is a fully free crypto API:
 * - 2,700+ coins tracked
 * - No API key required
 * - No rate limit documentation (reliable in practice at ~100 req/min)
 * - Independent price aggregation (not a CoinGecko mirror)
 *
 * @module providers/adapters/market-price/coinpaprika
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};

/**
 * Map CoinGecko IDs → CoinPaprika IDs.
 * CoinPaprika uses format like "btc-bitcoin".
 */
const COINGECKO_TO_PAPRIKA: Record<string, string> = {
  bitcoin: 'btc-bitcoin',
  ethereum: 'eth-ethereum',
  tether: 'usdt-tether',
  binancecoin: 'bnb-binance-coin',
  solana: 'sol-solana',
  'usd-coin': 'usdc-usd-coin',
  ripple: 'xrp-xrp',
  dogecoin: 'doge-dogecoin',
  cardano: 'ada-cardano',
  'avalanche-2': 'avax-avalanche',
  chainlink: 'link-chainlink',
  polkadot: 'dot-polkadot',
  tron: 'trx-tron',
  'shiba-inu': 'shib-shiba-inu',
  dai: 'dai-dai',
  litecoin: 'ltc-litecoin',
  'bitcoin-cash': 'bch-bitcoin-cash',
  uniswap: 'uni-uniswap',
  'matic-network': 'matic-polygon',
  stellar: 'xlm-stellar',
  near: 'near-near-protocol',
  aptos: 'apt-aptos',
  sui: 'sui-sui',
  'internet-computer': 'icp-internet-computer',
  cosmos: 'atom-cosmos',
  'wrapped-bitcoin': 'wbtc-wrapped-bitcoin',
  arbitrum: 'arb-arbitrum',
  optimism: 'op-optimism',
  filecoin: 'fil-filecoin',
  'the-graph': 'grt-the-graph',
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * CoinPaprika market price provider.
 *
 * Priority: 4 (quaternary — good coverage, independent aggregation)
 * Weight: 0.15 (lower — smaller dataset, less granular)
 */
export const coinpaprikaAdapter: DataProvider<MarketPrice[]> = {
  name: 'coinpaprika',
  description: 'CoinPaprika API — free crypto data with independent price aggregation (2,700+ coins)',
  priority: 4,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price', 'ohlcv'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const limit = params.limit ?? 100;

    if (params.coinIds?.length) {
      // Fetch specific coins in parallel
      const paprikaIds = params.coinIds
        .map(id => COINGECKO_TO_PAPRIKA[id])
        .filter(Boolean);

      if (paprikaIds.length === 0) {
        throw new Error('No CoinPaprika ID mapping found for requested coins');
      }

      const results = await Promise.allSettled(
        paprikaIds.map(async (pid) => {
          const res = await fetch(`${COINPAPRIKA_BASE}/tickers/${pid}`);
          if (!res.ok) throw new Error(`CoinPaprika ${pid}: ${res.status}`);
          return res.json() as Promise<PaprikaTicker>;
        }),
      );

      return results
        .filter((r): r is PromiseFulfilledResult<PaprikaTicker> =>
          r.status === 'fulfilled',
        )
        .map(r => normalize(r.value));
    }

    // Top coins
    const response = await fetch(`${COINPAPRIKA_BASE}/tickers?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`CoinPaprika API error: ${response.status}`);
    }

    const tickers: PaprikaTicker[] = await response.json();
    return tickers.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COINPAPRIKA_BASE}/global`, {
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
// INTERNAL — Raw types and normalization
// =============================================================================

interface PaprikaTicker {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  last_updated: string;
  quotes: {
    USD: {
      price: number;
      volume_24h: number;
      market_cap: number;
      percent_change_24h: number;
      ath_price: number;
    };
  };
}

/** Reverse lookup: Paprika ID → CoinGecko ID */
const PAPRIKA_TO_COINGECKO: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_TO_PAPRIKA).map(([cg, pp]) => [pp, cg]),
);

function normalize(ticker: PaprikaTicker): MarketPrice {
  const usd = ticker.quotes?.USD ?? {} as PaprikaTicker['quotes']['USD'];

  return {
    id: PAPRIKA_TO_COINGECKO[ticker.id] ?? ticker.id,
    symbol: ticker.symbol.toUpperCase(),
    name: ticker.name,
    currentPrice: usd.price ?? 0,
    marketCap: usd.market_cap ?? 0,
    marketCapRank: ticker.rank ?? 0,
    totalVolume: usd.volume_24h ?? 0,
    priceChange24h: 0,
    priceChangePercentage24h: usd.percent_change_24h ?? 0,
    high24h: 0,
    low24h: 0,
    circulatingSupply: ticker.circulating_supply ?? 0,
    totalSupply: ticker.total_supply ?? null,
    lastUpdated: ticker.last_updated ?? new Date().toISOString(),
  };
}
