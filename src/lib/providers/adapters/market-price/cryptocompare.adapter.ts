/**
 * CryptoCompare Adapter — High-frequency market price provider
 *
 * CryptoCompare aggregates from 250+ exchanges:
 * - Real-time CCCAGG (CryptoCompare Aggregate Index)
 * - Historical minute/hour/day OHLCV
 * - No API key required for basic access
 * - Free tier: 100,000 calls/month
 *
 * @module providers/adapters/market-price/cryptocompare
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const CC_BASE = 'https://min-api.cryptocompare.com/data';

const CC_API_KEY = process.env.CRYPTOCOMPARE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: CC_API_KEY ? 100 : 50,
  windowMs: 60_000,
};

/**
 * Map CoinGecko IDs → CryptoCompare symbols.
 * CryptoCompare uses standard ticker symbols.
 */
const COINGECKO_TO_CC: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  tether: 'USDT',
  binancecoin: 'BNB',
  solana: 'SOL',
  'usd-coin': 'USDC',
  ripple: 'XRP',
  dogecoin: 'DOGE',
  cardano: 'ADA',
  'avalanche-2': 'AVAX',
  chainlink: 'LINK',
  polkadot: 'DOT',
  tron: 'TRX',
  'shiba-inu': 'SHIB',
  dai: 'DAI',
  litecoin: 'LTC',
  'bitcoin-cash': 'BCH',
  uniswap: 'UNI',
  'matic-network': 'MATIC',
  stellar: 'XLM',
  near: 'NEAR',
  aptos: 'APT',
  sui: 'SUI',
  cosmos: 'ATOM',
  arbitrum: 'ARB',
  optimism: 'OP',
  filecoin: 'FIL',
  'the-graph': 'GRT',
  aave: 'AAVE',
  maker: 'MKR',
  render: 'RENDER',
  'fetch-ai': 'FET',
  injective: 'INJ',
  sei: 'SEI',
  'internet-computer': 'ICP',
  'staked-ether': 'STETH',
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * CryptoCompare market price provider.
 *
 * Priority: 5 (tertiary fallback — aggregated exchange index)
 * Weight: 0.20 (moderate — aggregates 250+ exchanges but less metadata)
 */
export const cryptocompareAdapter: DataProvider<MarketPrice[]> = {
  name: 'cryptocompare',
  description: 'CryptoCompare CCCAGG — aggregate index across 250+ exchanges',
  priority: 5,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price', 'ohlcv'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const vsCurrency = (params.vsCurrency ?? 'usd').toUpperCase();

    // Determine which symbols to fetch
    let symbols: string[];
    if (params.coinIds?.length) {
      symbols = params.coinIds
        .map(id => COINGECKO_TO_CC[id])
        .filter(Boolean);

      if (symbols.length === 0) {
        throw new Error('No CryptoCompare symbol mapping for requested coins');
      }
    } else {
      // Default: top coins
      symbols = Object.values(COINGECKO_TO_CC).slice(0, params.limit ?? 30);
    }

    const url =
      `${CC_BASE}/pricemultifull?fsyms=${symbols.join(',')}&tsyms=${vsCurrency}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (CC_API_KEY) {
      headers['authorization'] = `Apikey ${CC_API_KEY}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const json = await response.json();
    const rawData = json.RAW;

    if (!rawData || typeof rawData !== 'object') {
      throw new Error('CryptoCompare returned no data');
    }

    return symbols
      .filter(sym => rawData[sym]?.[vsCurrency])
      .map(sym => normalize(sym, rawData[sym][vsCurrency]));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${CC_BASE}/price?fsym=BTC&tsyms=USD`, {
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
// INTERNAL — Normalization
// =============================================================================

/** Reverse lookup: CC symbol → CoinGecko ID */
const CC_TO_COINGECKO: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_TO_CC).map(([cg, cc]) => [cc, cg]),
);

interface CcRawEntry {
  FROMSYMBOL: string;
  TOSYMBOL: string;
  PRICE: number;
  VOLUME24HOUR: number;
  VOLUME24HOURTO: number;
  CHANGEPCT24HOUR: number;
  CHANGE24HOUR: number;
  HIGH24HOUR: number;
  LOW24HOUR: number;
  MKTCAP: number;
  SUPPLY: number;
  TOTALVOLUME24HTO: number;
  LASTUPDATE: number;
}

function normalize(symbol: string, raw: CcRawEntry): MarketPrice {
  const geckoId = CC_TO_COINGECKO[symbol] ?? symbol.toLowerCase();

  return {
    id: geckoId,
    symbol: raw.FROMSYMBOL ?? symbol,
    name: symbol,
    currentPrice: raw.PRICE ?? 0,
    marketCap: raw.MKTCAP ?? 0,
    marketCapRank: 0, // CryptoCompare doesn't provide rank
    totalVolume: raw.TOTALVOLUME24HTO ?? raw.VOLUME24HOURTO ?? 0,
    priceChange24h: raw.CHANGE24HOUR ?? 0,
    priceChangePercentage24h: raw.CHANGEPCT24HOUR ?? 0,
    high24h: raw.HIGH24HOUR ?? 0,
    low24h: raw.LOW24HOUR ?? 0,
    circulatingSupply: raw.SUPPLY ?? 0,
    totalSupply: null,
    lastUpdated: raw.LASTUPDATE
      ? new Date(raw.LASTUPDATE * 1000).toISOString()
      : new Date().toISOString(),
  };
}
