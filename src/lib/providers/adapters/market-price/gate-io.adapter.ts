/**
 * Gate.io Adapter — Altcoin-focused market price provider
 *
 * Gate.io provides extensive altcoin coverage:
 * - 1,700+ trading pairs
 * - No API key required for public endpoints
 * - Good for long-tail altcoins
 *
 * @module providers/adapters/market-price/gate-io
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const GATEIO_BASE = 'https://api.gateio.ws/api/v4';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 300,
  windowMs: 60_000,
};

const COINGECKO_TO_GATEIO: Record<string, string> = {
  bitcoin: 'BTC_USDT',
  ethereum: 'ETH_USDT',
  solana: 'SOL_USDT',
  ripple: 'XRP_USDT',
  cardano: 'ADA_USDT',
  dogecoin: 'DOGE_USDT',
  polkadot: 'DOT_USDT',
  'avalanche-2': 'AVAX_USDT',
  chainlink: 'LINK_USDT',
  'matic-network': 'MATIC_USDT',
  litecoin: 'LTC_USDT',
  'shiba-inu': 'SHIB_USDT',
  uniswap: 'UNI_USDT',
  cosmos: 'ATOM_USDT',
  stellar: 'XLM_USDT',
  near: 'NEAR_USDT',
  aptos: 'APT_USDT',
  arbitrum: 'ARB_USDT',
  optimism: 'OP_USDT',
  sui: 'SUI_USDT',
  aave: 'AAVE_USDT',
  'the-graph': 'GRT_USDT',
  'render-token': 'RENDER_USDT',
  'filecoin': 'FIL_USDT',
};

/**
 * Gate.io market price provider.
 *
 * Priority: 8 (low priority — supplementary source for altcoins)
 * Weight: 0.05 (low weight — used for breadth not depth)
 */
export const gateioAdapter: DataProvider<MarketPrice[]> = {
  name: 'gate-io',
  description: 'Gate.io — extensive altcoin market data (1,700+ pairs)',
  priority: 8,
  weight: 0.05,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    let pairs: { id: string; pair: string }[];

    if (params.coinIds && params.coinIds.length > 0) {
      pairs = params.coinIds
        .map(id => ({ id, pair: COINGECKO_TO_GATEIO[id] }))
        .filter((p): p is { id: string; pair: string } => p.pair !== undefined);

      if (pairs.length === 0) {
        throw new Error('None of the requested coins have Gate.io pairs');
      }
    } else {
      pairs = [{ id: 'bitcoin', pair: 'BTC_USDT' }];
    }

    const results: MarketPrice[] = [];

    for (const { id, pair } of pairs) {
      const response = await fetch(
        `${GATEIO_BASE}/spot/tickers?currency_pair=${pair}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!response.ok) {
        throw new Error(`Gate.io API error: ${response.status}`);
      }

      const data: GateioTicker[] = await response.json();
      if (!data || data.length === 0) {
        throw new Error(`Gate.io: no data for ${pair}`);
      }

      const ticker = data[0];
      const price = parseFloat(ticker.last);
      const changePercent = parseFloat(ticker.change_percentage || '0');

      results.push({
        id,
        symbol: pair.split('_')[0].toLowerCase(),
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
        currentPrice: price,
        marketCap: 0,
        marketCapRank: 0,
        totalVolume: parseFloat(ticker.quote_volume || '0'),
        priceChange24h: price * (changePercent / 100),
        priceChangePercentage24h: changePercent,
        high24h: parseFloat(ticker.high_24h || '0'),
        low24h: parseFloat(ticker.low_24h || '0'),
        circulatingSupply: 0,
        totalSupply: null,
        lastUpdated: new Date().toISOString(),
      });
    }

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${GATEIO_BASE}/spot/tickers?currency_pair=BTC_USDT`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(d => typeof d.currentPrice === 'number' && d.currentPrice > 0);
  },
};

interface GateioTicker {
  currency_pair: string;
  last: string;
  lowest_ask: string;
  highest_bid: string;
  change_percentage: string;
  base_volume: string;
  quote_volume: string;
  high_24h: string;
  low_24h: string;
}
