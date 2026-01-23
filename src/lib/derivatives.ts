/**
 * Derivatives Data Integration
 * Free perpetuals/futures data from multiple exchanges
 *
 * Sources:
 * - Binance Futures: https://fapi.binance.com
 * - Bybit: https://api.bybit.com/v5
 * - dYdX: https://api.dydx.exchange/v3
 * - OKX: https://www.okx.com/api/v5
 *
 * @module derivatives
 */

import { EXTERNAL_APIS, CACHE_TTL, DydxMarket } from './external-apis';
import { cache } from './cache';

// =============================================================================
// Types
// =============================================================================

export interface FundingRate {
  symbol: string;
  exchange: string;
  fundingRate: number;
  nextFundingTime?: number;
  markPrice?: number;
  indexPrice?: number;
}

export interface OpenInterest {
  symbol: string;
  exchange: string;
  openInterest: number;
  openInterestValue: number;
  timestamp: number;
}

export interface DerivativesTicker {
  symbol: string;
  exchange: string;
  lastPrice: number;
  markPrice: number;
  indexPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  nextFundingTime: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}

export interface BybitTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  volume24h: string;
  turnover24h: string;
  openInterest: string;
  openInterestValue: string;
  fundingRate: string;
  nextFundingTime: string;
}

export interface OKXTicker {
  instId: string;
  last: string;
  lastSz: string;
  askPx: string;
  askSz: string;
  bidPx: string;
  bidSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  volCcy24h: string;
  vol24h: string;
  ts: string;
}

export interface OKXFundingRate {
  instId: string;
  instType: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
}

// =============================================================================
// Bybit API Functions
// =============================================================================

/**
 * Get Bybit perpetual tickers
 */
export async function getBybitTickers(
  category: 'linear' | 'inverse' = 'linear'
): Promise<BybitTicker[]> {
  const cacheKey = `bybit:tickers:${category}`;
  const cached = cache.get<BybitTicker[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.BYBIT}/market/tickers?category=${category}`);

  if (!response.ok) {
    throw new Error(`Bybit API error: ${response.status}`);
  }

  const result = await response.json();
  const data: BybitTicker[] = result.result?.list || [];
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get Bybit funding rate history
 */
export async function getBybitFundingHistory(
  symbol: string,
  limit = 50
): Promise<Array<{ symbol: string; fundingRate: string; fundingRateTimestamp: string }>> {
  const cacheKey = `bybit:funding:${symbol}:${limit}`;
  const cached = cache.get<Awaited<ReturnType<typeof getBybitFundingHistory>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${EXTERNAL_APIS.BYBIT}/market/funding/history?category=linear&symbol=${symbol}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Bybit API error: ${response.status}`);
  }

  const result = await response.json();
  const data = result.result?.list || [];
  cache.set(cacheKey, data, CACHE_TTL.funding);

  return data;
}

/**
 * Get Bybit open interest
 */
export async function getBybitOpenInterest(
  symbol: string,
  intervalTime: '5min' | '15min' | '30min' | '1h' | '4h' | '1d' = '1h',
  limit = 50
): Promise<Array<{ openInterest: string; timestamp: string }>> {
  const cacheKey = `bybit:oi:${symbol}:${intervalTime}:${limit}`;
  const cached = cache.get<Awaited<ReturnType<typeof getBybitOpenInterest>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${EXTERNAL_APIS.BYBIT}/market/open-interest?category=linear&symbol=${symbol}&intervalTime=${intervalTime}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Bybit API error: ${response.status}`);
  }

  const result = await response.json();
  const data = result.result?.list || [];
  cache.set(cacheKey, data, CACHE_TTL.openInterest);

  return data;
}

// =============================================================================
// OKX API Functions
// =============================================================================

/**
 * Get OKX perpetual tickers
 */
export async function getOKXTickers(instType: 'SWAP' | 'FUTURES' = 'SWAP'): Promise<OKXTicker[]> {
  const cacheKey = `okx:tickers:${instType}`;
  const cached = cache.get<OKXTicker[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.OKX}/market/tickers?instType=${instType}`);

  if (!response.ok) {
    throw new Error(`OKX API error: ${response.status}`);
  }

  const result = await response.json();
  const data: OKXTicker[] = result.data || [];
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get OKX funding rates
 */
export async function getOKXFundingRates(): Promise<OKXFundingRate[]> {
  const cacheKey = 'okx:funding';
  const cached = cache.get<OKXFundingRate[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.OKX}/public/funding-rate`);

  if (!response.ok) {
    throw new Error(`OKX API error: ${response.status}`);
  }

  const result = await response.json();
  const data: OKXFundingRate[] = result.data || [];
  cache.set(cacheKey, data, CACHE_TTL.funding);

  return data;
}

/**
 * Get OKX open interest
 */
export async function getOKXOpenInterest(
  instType: 'SWAP' | 'FUTURES' = 'SWAP'
): Promise<Array<{ instId: string; oi: string; oiCcy: string; ts: string }>> {
  const cacheKey = `okx:oi:${instType}`;
  const cached = cache.get<Awaited<ReturnType<typeof getOKXOpenInterest>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.OKX}/public/open-interest?instType=${instType}`);

  if (!response.ok) {
    throw new Error(`OKX API error: ${response.status}`);
  }

  const result = await response.json();
  const data = result.data || [];
  cache.set(cacheKey, data, CACHE_TTL.openInterest);

  return data;
}

// =============================================================================
// dYdX API Functions
// =============================================================================

/**
 * Get dYdX markets
 */
export async function getDydxMarkets(): Promise<Record<string, DydxMarket>> {
  const cacheKey = 'dydx:markets';
  const cached = cache.get<Record<string, DydxMarket>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.DYDX}/markets`);

  if (!response.ok) {
    throw new Error(`dYdX API error: ${response.status}`);
  }

  const result = await response.json();
  const data: Record<string, DydxMarket> = result.markets || {};
  cache.set(cacheKey, data, CACHE_TTL.ticker);

  return data;
}

/**
 * Get dYdX order book
 */
export async function getDydxOrderbook(market: string): Promise<{
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}> {
  const cacheKey = `dydx:orderbook:${market}`;
  const cached = cache.get<Awaited<ReturnType<typeof getDydxOrderbook>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.DYDX}/orderbook/${market}`);

  if (!response.ok) {
    throw new Error(`dYdX API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.orderbook);

  return data;
}

/**
 * Get dYdX trades
 */
export async function getDydxTrades(
  market: string,
  limit = 100
): Promise<
  Array<{
    id: string;
    side: string;
    size: string;
    price: string;
    createdAt: string;
  }>
> {
  const cacheKey = `dydx:trades:${market}:${limit}`;
  const cached = cache.get<Awaited<ReturnType<typeof getDydxTrades>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${EXTERNAL_APIS.DYDX}/trades/${market}?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`dYdX API error: ${response.status}`);
  }

  const result = await response.json();
  const data = result.trades || [];
  cache.set(cacheKey, data, CACHE_TTL.trades);

  return data;
}

// =============================================================================
// Aggregated Functions
// =============================================================================

/**
 * Get aggregated funding rates from all exchanges
 */
export async function getAggregatedFundingRates(): Promise<FundingRate[]> {
  const cacheKey = 'derivatives:funding:all';
  const cached = cache.get<FundingRate[]>(cacheKey);
  if (cached) return cached;

  const [bybitTickers, okxRates, dydxMarkets] = await Promise.allSettled([
    getBybitTickers(),
    getOKXFundingRates(),
    getDydxMarkets(),
  ]);

  const rates: FundingRate[] = [];

  // Bybit
  if (bybitTickers.status === 'fulfilled') {
    for (const t of bybitTickers.value) {
      if (t.fundingRate) {
        rates.push({
          symbol: t.symbol.replace('USDT', ''),
          exchange: 'bybit',
          fundingRate: parseFloat(t.fundingRate) * 100,
          nextFundingTime: parseInt(t.nextFundingTime),
          markPrice: parseFloat(t.markPrice),
          indexPrice: parseFloat(t.indexPrice),
        });
      }
    }
  }

  // OKX
  if (okxRates.status === 'fulfilled') {
    for (const r of okxRates.value) {
      const symbol = r.instId.split('-')[0];
      rates.push({
        symbol,
        exchange: 'okx',
        fundingRate: parseFloat(r.fundingRate) * 100,
        nextFundingTime: parseInt(r.nextFundingTime),
      });
    }
  }

  // dYdX
  if (dydxMarkets.status === 'fulfilled') {
    for (const [, m] of Object.entries(dydxMarkets.value)) {
      if (m.nextFundingRate) {
        rates.push({
          symbol: m.baseAsset,
          exchange: 'dydx',
          fundingRate: parseFloat(m.nextFundingRate) * 100,
          markPrice: parseFloat(m.oraclePrice),
          indexPrice: parseFloat(m.indexPrice),
        });
      }
    }
  }

  cache.set(cacheKey, rates, CACHE_TTL.funding);
  return rates;
}

/**
 * Get aggregated open interest from all exchanges
 */
export async function getAggregatedOpenInterest(): Promise<OpenInterest[]> {
  const cacheKey = 'derivatives:oi:all';
  const cached = cache.get<OpenInterest[]>(cacheKey);
  if (cached) return cached;

  const [bybitTickers, okxOI, dydxMarkets] = await Promise.allSettled([
    getBybitTickers(),
    getOKXOpenInterest(),
    getDydxMarkets(),
  ]);

  const ois: OpenInterest[] = [];
  const now = Date.now();

  // Bybit
  if (bybitTickers.status === 'fulfilled') {
    for (const t of bybitTickers.value) {
      if (t.openInterestValue) {
        ois.push({
          symbol: t.symbol.replace('USDT', ''),
          exchange: 'bybit',
          openInterest: parseFloat(t.openInterest),
          openInterestValue: parseFloat(t.openInterestValue),
          timestamp: now,
        });
      }
    }
  }

  // OKX
  if (okxOI.status === 'fulfilled') {
    for (const o of okxOI.value) {
      const symbol = o.instId.split('-')[0];
      ois.push({
        symbol,
        exchange: 'okx',
        openInterest: parseFloat(o.oi),
        openInterestValue: parseFloat(o.oiCcy),
        timestamp: parseInt(o.ts),
      });
    }
  }

  // dYdX
  if (dydxMarkets.status === 'fulfilled') {
    for (const [, m] of Object.entries(dydxMarkets.value)) {
      if (m.openInterest) {
        const price = parseFloat(m.oraclePrice);
        const oi = parseFloat(m.openInterest);
        ois.push({
          symbol: m.baseAsset,
          exchange: 'dydx',
          openInterest: oi,
          openInterestValue: oi * price,
          timestamp: now,
        });
      }
    }
  }

  cache.set(cacheKey, ois, CACHE_TTL.openInterest);
  return ois;
}

/**
 * Get funding rate for a specific symbol across exchanges
 */
export async function getSymbolFundingRates(symbol: string): Promise<FundingRate[]> {
  const allRates = await getAggregatedFundingRates();
  return allRates.filter((r) => r.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Get top funding rate opportunities (highest positive/negative)
 */
export async function getTopFundingOpportunities(limit = 10): Promise<{
  highest: FundingRate[];
  lowest: FundingRate[];
}> {
  const rates = await getAggregatedFundingRates();

  const sorted = [...rates].sort((a, b) => b.fundingRate - a.fundingRate);

  return {
    highest: sorted.slice(0, limit),
    lowest: sorted.slice(-limit).reverse(),
  };
}
