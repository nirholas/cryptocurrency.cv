/**
 * Binance Public API Integration
 * Free market data with no API key required
 *
 * Base URL: https://api.binance.com/api/v3
 * Futures: https://fapi.binance.com
 * Rate Limit: 1200 requests/minute
 * WebSocket: wss://stream.binance.com:9443/ws
 *
 * @module binance
 */

import {
  EXTERNAL_APIS,
  CACHE_TTL,
  BinanceTicker,
  BinanceFundingRate,
  BinanceOpenInterest,
} from './external-apis';
import { cache } from './cache';

const BASE_URL = EXTERNAL_APIS.BINANCE;
const FUTURES_URL = EXTERNAL_APIS.BINANCE_FUTURES;

// =============================================================================
// Types
// =============================================================================

export interface BinancePrice {
  symbol: string;
  price: string;
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
  }>;
}

export interface BinanceFuturesMarkPrice {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export interface BinanceLongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}

// =============================================================================
// Spot API Functions
// =============================================================================

/**
 * Get all prices
 */
export async function getAllPrices(): Promise<BinancePrice[]> {
  const cacheKey = 'binance:prices';
  const cached = cache.get<BinancePrice[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/ticker/price`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinancePrice[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get price for symbol
 */
export async function getPrice(symbol: string): Promise<BinancePrice> {
  const cacheKey = `binance:price:${symbol}`;
  const cached = cache.get<BinancePrice>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/ticker/price?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinancePrice = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get 24hr ticker for all symbols
 */
export async function get24hrTickers(): Promise<BinanceTicker[]> {
  const cacheKey = 'binance:tickers:24hr';
  const cached = cache.get<BinanceTicker[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/ticker/24hr`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceTicker[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get 24hr ticker for symbol
 */
export async function get24hrTicker(symbol: string): Promise<BinanceTicker> {
  const cacheKey = `binance:ticker:24hr:${symbol}`;
  const cached = cache.get<BinanceTicker>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/ticker/24hr?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceTicker = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get order book
 */
export async function getOrderBook(symbol: string, limit = 100): Promise<BinanceOrderBook> {
  const cacheKey = `binance:orderbook:${symbol}:${limit}`;
  const cached = cache.get<BinanceOrderBook>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/depth?symbol=${symbol}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceOrderBook = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.orderbook);

  return data;
}

/**
 * Get recent trades
 */
export async function getRecentTrades(symbol: string, limit = 500): Promise<BinanceTrade[]> {
  const cacheKey = `binance:trades:${symbol}:${limit}`;
  const cached = cache.get<BinanceTrade[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/trades?symbol=${symbol}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceTrade[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.trades);

  return data;
}

/**
 * Get klines/candlestick data
 */
export async function getKlines(
  symbol: string,
  interval:
    | '1m'
    | '3m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '2h'
    | '4h'
    | '6h'
    | '8h'
    | '12h'
    | '1d'
    | '3d'
    | '1w'
    | '1M',
  limit = 500,
  startTime?: number,
  endTime?: number
): Promise<BinanceKline[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: limit.toString(),
  });
  if (startTime) params.set('startTime', startTime.toString());
  if (endTime) params.set('endTime', endTime.toString());

  const cacheKey = `binance:klines:${symbol}:${interval}:${limit}:${startTime}:${endTime}`;
  const cached = cache.get<BinanceKline[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/klines?${params}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const rawData: unknown[][] = await response.json();

  const data: BinanceKline[] = rawData.map((k) => ({
    openTime: k[0] as number,
    open: k[1] as string,
    high: k[2] as string,
    low: k[3] as string,
    close: k[4] as string,
    volume: k[5] as string,
    closeTime: k[6] as number,
    quoteAssetVolume: k[7] as string,
    numberOfTrades: k[8] as number,
    takerBuyBaseAssetVolume: k[9] as string,
    takerBuyQuoteAssetVolume: k[10] as string,
  }));

  const ttl =
    interval.includes('d') || interval.includes('w') || interval.includes('M')
      ? CACHE_TTL.historical_7d
      : CACHE_TTL.ohlc;
  cache.set(cacheKey, data, ttl);

  return data;
}

/**
 * Get exchange info
 */
export async function getExchangeInfo(): Promise<BinanceExchangeInfo> {
  const cacheKey = 'binance:exchangeInfo';
  const cached = cache.get<BinanceExchangeInfo>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/exchangeInfo`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceExchangeInfo = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.static);

  return data;
}

// =============================================================================
// Futures API Functions
// =============================================================================

/**
 * Get funding rates
 */
export async function getFundingRates(symbol?: string): Promise<BinanceFundingRate[]> {
  const cacheKey = `binance:funding:${symbol || 'all'}`;
  const cached = cache.get<BinanceFundingRate[]>(cacheKey);
  if (cached) return cached;

  const url = symbol
    ? `${FUTURES_URL}/fapi/v1/premiumIndex?symbol=${symbol}`
    : `${FUTURES_URL}/fapi/v1/premiumIndex`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Binance Futures API error: ${response.status}`);
  }

  const data = await response.json();
  const result = Array.isArray(data) ? data : [data];
  cache.set(cacheKey, result, CACHE_TTL.funding);

  return result;
}

/**
 * Get open interest
 */
export async function getOpenInterest(symbol: string): Promise<BinanceOpenInterest> {
  const cacheKey = `binance:oi:${symbol}`;
  const cached = cache.get<BinanceOpenInterest>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${FUTURES_URL}/fapi/v1/openInterest?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance Futures API error: ${response.status}`);
  }

  const data: BinanceOpenInterest = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.openInterest);

  return data;
}

/**
 * Get mark prices for all symbols
 */
export async function getMarkPrices(): Promise<BinanceFuturesMarkPrice[]> {
  const cacheKey = 'binance:markPrices';
  const cached = cache.get<BinanceFuturesMarkPrice[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${FUTURES_URL}/fapi/v1/premiumIndex`);

  if (!response.ok) {
    throw new Error(`Binance Futures API error: ${response.status}`);
  }

  const data: BinanceFuturesMarkPrice[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get long/short ratio
 */
export async function getLongShortRatio(
  symbol: string,
  period: '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' = '1h',
  limit = 30
): Promise<BinanceLongShortRatio[]> {
  const cacheKey = `binance:lsr:${symbol}:${period}:${limit}`;
  const cached = cache.get<BinanceLongShortRatio[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${FUTURES_URL}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Binance Futures API error: ${response.status}`);
  }

  const data: BinanceLongShortRatio[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.funding);

  return data;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get USDT pairs only
 */
export async function getUsdtPairs(): Promise<BinanceTicker[]> {
  const tickers = await get24hrTickers();
  return tickers.filter((t) => t.symbol.endsWith('USDT'));
}

/**
 * Convert Binance ticker to our standard format
 */
export function normalizeTicker(ticker: BinanceTicker, baseAsset: string) {
  return {
    symbol: baseAsset.toLowerCase(),
    current_price: parseFloat(ticker.lastPrice),
    price_change_24h: parseFloat(ticker.priceChange),
    price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
    high_24h: parseFloat(ticker.highPrice),
    low_24h: parseFloat(ticker.lowPrice),
    total_volume: parseFloat(ticker.quoteVolume),
    volume_24h: parseFloat(ticker.volume),
  };
}

/**
 * Get top gainers
 */
export async function getTopGainers(limit = 10): Promise<BinanceTicker[]> {
  const tickers = await getUsdtPairs();
  return tickers
    .filter((t) => parseFloat(t.quoteVolume) > 1000000) // Min volume filter
    .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
    .slice(0, limit);
}

/**
 * Get top losers
 */
export async function getTopLosers(limit = 10): Promise<BinanceTicker[]> {
  const tickers = await getUsdtPairs();
  return tickers
    .filter((t) => parseFloat(t.quoteVolume) > 1000000) // Min volume filter
    .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
    .slice(0, limit);
}

/**
 * Get highest volume pairs
 */
export async function getHighestVolume(limit = 10): Promise<BinanceTicker[]> {
  const tickers = await getUsdtPairs();
  return tickers
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, limit);
}
