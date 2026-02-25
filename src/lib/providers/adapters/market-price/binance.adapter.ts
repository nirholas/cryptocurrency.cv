/**
 * Binance Adapter — High-frequency market price provider
 *
 * Binance provides the most liquid and real-time pricing data:
 * - No API key required for public endpoints
 * - 1200 req/min rate limit
 * - Sub-second price updates
 * - Most liquid exchange globally
 *
 * Binance uses trading pair format (e.g., "BTCUSDT") rather than
 * coin IDs, so this adapter handles the conversion.
 *
 * @module providers/adapters/market-price/binance
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../providers/types';
import type { MarketPrice } from './coingecko.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const BINANCE_BASE = 'https://api.binance.com/api/v3';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 1200,
  windowMs: 60_000,
};

/**
 * Mapping from CoinGecko IDs to Binance trading pair symbols.
 * Binance uses SYMBOLUSDT format.
 */
const COINGECKO_TO_BINANCE: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  ripple: 'XRPUSDT',
  solana: 'SOLUSDT',
  cardano: 'ADAUSDT',
  dogecoin: 'DOGEUSDT',
  polkadot: 'DOTUSDT',
  'avalanche-2': 'AVAXUSDT',
  chainlink: 'LINKUSDT',
  'matic-network': 'MATICUSDT',
  litecoin: 'LTCUSDT',
  'shiba-inu': 'SHIBUSDT',
  uniswap: 'UNIUSDT',
  cosmos: 'ATOMUSDT',
  stellar: 'XLMUSDT',
  'near': 'NEARUSDT',
  'internet-computer': 'ICPUSDT',
  aptos: 'APTUSDT',
  'filecoin': 'FILUSDT',
  arbitrum: 'ARBUSDT',
  optimism: 'OPUSDT',
  'render-token': 'RENDERUSDT',
  sui: 'SUIUSDT',
  aave: 'AAVEUSDT',
  'the-graph': 'GRTUSDT',
};

const BINANCE_SYMBOL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_TO_BINANCE).map(([id, symbol]) => [symbol, id]),
);

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * Binance market price provider.
 *
 * Priority: 3 (secondary fallback)
 * Weight: 0.3 (high trust for listed pairs — most liquid exchange)
 *
 * Note: Binance only covers coins with USDT pairs on their exchange,
 * which is a subset of CoinGecko's 13,000+ coins. However, for the
 * coins it does cover, Binance prices are considered the most accurate
 * due to highest trading volume.
 */
export const binanceAdapter: DataProvider<MarketPrice[]> = {
  name: 'binance',
  description: 'Binance Spot API — highest-liquidity exchange pricing',
  priority: 3,
  weight: 0.3,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price', 'ohlcv', 'order-book'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    // Determine which symbols to fetch
    let symbols: string[];

    if (params.coinIds && params.coinIds.length > 0) {
      symbols = params.coinIds
        .map(id => COINGECKO_TO_BINANCE[id])
        .filter((s): s is string => s !== undefined);

      if (symbols.length === 0) {
        // None of the requested coins have Binance pairs
        throw new Error('No Binance trading pairs found for requested coin IDs');
      }
    } else {
      // Default: top coins by market cap that we have mappings for
      symbols = Object.values(COINGECKO_TO_BINANCE);
    }

    // Binance supports fetching multiple tickers at once
    const symbolsParam = JSON.stringify(symbols);
    const url = `${BINANCE_BASE}/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 429) {
      throw new Error('Binance rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const raw: BinanceTicker24hr[] = await response.json();

    // Apply limit
    const limit = params.limit ?? 100;
    return raw
      .map(normalize)
      .filter(item => item.currentPrice > 0)
      .slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${BINANCE_BASE}/ping`, {
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

interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

function normalize(raw: BinanceTicker24hr): MarketPrice {
  const price = parseFloat(raw.lastPrice) || 0;
  const priceChange = parseFloat(raw.priceChange) || 0;
  const changePct = parseFloat(raw.priceChangePercent) || 0;

  // Extract the base symbol from the trading pair (e.g., "BTCUSDT" → "BTC")
  const baseSymbol = raw.symbol.replace(/USDT$/, '');
  const coinId = BINANCE_SYMBOL_TO_ID[raw.symbol] ?? raw.symbol.toLowerCase();

  return {
    id: coinId,
    symbol: baseSymbol,
    name: baseSymbol, // Binance doesn't provide full names
    currentPrice: price,
    marketCap: 0, // Binance doesn't provide market cap
    marketCapRank: 0,
    totalVolume: parseFloat(raw.quoteVolume) || 0,
    priceChange24h: priceChange,
    priceChangePercentage24h: changePct,
    high24h: parseFloat(raw.highPrice) || 0,
    low24h: parseFloat(raw.lowPrice) || 0,
    circulatingSupply: 0,
    totalSupply: null,
    lastUpdated: new Date(raw.closeTime).toISOString(),
  };
}
