/**
 * CoinPaprika API Integration
 * Free market data with no API key required
 *
 * Base URL: https://api.coinpaprika.com/v1
 * Rate Limit: ~10 requests/second (generous)
 *
 * @module coinpaprika
 */

import { EXTERNAL_APIS, CACHE_TTL, CoinPaprikaTicker } from './external-apis';
import { cache } from './cache';

const BASE_URL = EXTERNAL_APIS.COINPAPRIKA;

// =============================================================================
// Types
// =============================================================================

export interface CoinPaprikaCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  is_new: boolean;
  is_active: boolean;
  type: string;
}

export interface CoinPaprikaGlobal {
  market_cap_usd: number;
  volume_24h_usd: number;
  bitcoin_dominance_percentage: number;
  cryptocurrencies_number: number;
  market_cap_ath_value: number;
  market_cap_ath_date: string;
  volume_24h_ath_value: number;
  volume_24h_ath_date: string;
  market_cap_change_24h: number;
  volume_24h_change_24h: number;
  last_updated: number;
}

export interface CoinPaprikaOHLC {
  time_open: string;
  time_close: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  market_cap: number;
}

export interface CoinPaprikaExchange {
  id: string;
  name: string;
  description: string;
  active: boolean;
  website_status: boolean;
  api_status: boolean;
  message: string | null;
  links: {
    website: string[];
    twitter: string[];
  };
  markets_data_fetched: boolean;
  adjusted_rank: number;
  reported_rank: number;
  currencies: number;
  markets: number;
  fiats: { name: string; symbol: string }[];
  quotes: {
    USD: {
      reported_volume_24h: number;
      adjusted_volume_24h: number;
      reported_volume_7d: number;
      adjusted_volume_7d: number;
      reported_volume_30d: number;
      adjusted_volume_30d: number;
    };
  };
  last_updated: string;
}

export interface CoinPaprikaMarket {
  exchange_id: string;
  exchange_name: string;
  pair: string;
  base_currency_id: string;
  base_currency_name: string;
  quote_currency_id: string;
  quote_currency_name: string;
  market_url: string;
  category: string;
  fee_type: string;
  outlier: boolean;
  adjusted_volume_24h_share: number;
  quotes: {
    USD: {
      price: number;
      volume_24h: number;
    };
  };
  last_updated: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all coins (basic info)
 */
export async function getCoins(): Promise<CoinPaprikaCoin[]> {
  const cacheKey = 'coinpaprika:coins';
  const cached = cache.get<CoinPaprikaCoin[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/coins`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaCoin[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.static);

  return data;
}

/**
 * Get all tickers with market data
 */
export async function getTickers(quotes = 'USD'): Promise<CoinPaprikaTicker[]> {
  const cacheKey = `coinpaprika:tickers:${quotes}`;
  const cached = cache.get<CoinPaprikaTicker[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/tickers?quotes=${quotes}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaTicker[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.prices);

  return data;
}

/**
 * Get ticker for specific coin
 */
export async function getTicker(coinId: string, quotes = 'USD'): Promise<CoinPaprikaTicker> {
  const cacheKey = `coinpaprika:ticker:${coinId}:${quotes}`;
  const cached = cache.get<CoinPaprikaTicker>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/tickers/${coinId}?quotes=${quotes}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaTicker = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.prices);

  return data;
}

/**
 * Get global market data
 */
export async function getGlobal(): Promise<CoinPaprikaGlobal> {
  const cacheKey = 'coinpaprika:global';
  const cached = cache.get<CoinPaprikaGlobal>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/global`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaGlobal = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.global);

  return data;
}

/**
 * Get OHLCV data for a coin (latest)
 */
export async function getOHLCVLatest(coinId: string, quote = 'usd'): Promise<CoinPaprikaOHLC[]> {
  const cacheKey = `coinpaprika:ohlcv:latest:${coinId}:${quote}`;
  const cached = cache.get<CoinPaprikaOHLC[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/coins/${coinId}/ohlcv/latest?quote=${quote}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaOHLC[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.ohlc);

  return data;
}

/**
 * Get historical OHLCV data
 */
export async function getOHLCVHistorical(
  coinId: string,
  start: string,
  end?: string,
  limit = 366,
  quote = 'usd'
): Promise<CoinPaprikaOHLC[]> {
  const cacheKey = `coinpaprika:ohlcv:historical:${coinId}:${start}:${end}:${limit}`;
  const cached = cache.get<CoinPaprikaOHLC[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    start,
    limit: limit.toString(),
    quote,
  });
  if (end) params.set('end', end);

  const response = await fetch(`${BASE_URL}/coins/${coinId}/ohlcv/historical?${params}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaOHLC[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.historical_7d);

  return data;
}

/**
 * Get all exchanges
 */
export async function getExchanges(): Promise<CoinPaprikaExchange[]> {
  const cacheKey = 'coinpaprika:exchanges';
  const cached = cache.get<CoinPaprikaExchange[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/exchanges`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaExchange[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.static);

  return data;
}

/**
 * Get markets for a coin
 */
export async function getCoinMarkets(coinId: string, quotes = 'USD'): Promise<CoinPaprikaMarket[]> {
  const cacheKey = `coinpaprika:markets:${coinId}:${quotes}`;
  const cached = cache.get<CoinPaprikaMarket[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/coins/${coinId}/markets?quotes=${quotes}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data: CoinPaprikaMarket[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.markets);

  return data;
}

/**
 * Search for coins, exchanges, ICOs, people, tags
 */
export async function search(query: string): Promise<{
  currencies: CoinPaprikaCoin[];
  exchanges: { id: string; name: string }[];
  icos: unknown[];
  people: unknown[];
  tags: unknown[];
}> {
  const cacheKey = `coinpaprika:search:${query}`;
  const cached = cache.get<Awaited<ReturnType<typeof search>>>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`CoinPaprika API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.search);

  return data;
}

/**
 * Convert CoinPaprika ticker to our standard format
 */
export function normalizeTicker(ticker: CoinPaprikaTicker) {
  const usd = ticker.quotes.USD;
  return {
    id: ticker.id,
    symbol: ticker.symbol.toLowerCase(),
    name: ticker.name,
    current_price: usd.price,
    market_cap: usd.market_cap,
    market_cap_rank: ticker.rank,
    total_volume: usd.volume_24h,
    price_change_percentage_1h: usd.percent_change_1h,
    price_change_percentage_24h: usd.percent_change_24h,
    price_change_percentage_7d: usd.percent_change_7d,
    price_change_percentage_30d: usd.percent_change_30d,
    circulating_supply: ticker.circulating_supply,
    total_supply: ticker.total_supply,
    max_supply: ticker.max_supply,
    ath: usd.ath_price,
    ath_change_percentage: usd.percent_from_price_ath,
    ath_date: usd.ath_date,
  };
}
