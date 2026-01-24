/**
 * CoinCap API Integration
 * Free market data with no API key required
 *
 * Base URL: https://api.coincap.io/v2
 * Rate Limit: 200 requests/minute
 * WebSocket: wss://ws.coincap.io/prices?assets=bitcoin,ethereum
 *
 * @module coincap
 */

import { EXTERNAL_APIS, CACHE_TTL, CoinCapAsset } from './external-apis';
import { cache } from './cache';

const BASE_URL = EXTERNAL_APIS.COINCAP;

// =============================================================================
// Types
// =============================================================================

export interface CoinCapResponse<T> {
  data: T;
  timestamp: number;
}

export interface CoinCapHistory {
  priceUsd: string;
  time: number;
  date: string;
}

export interface CoinCapMarket {
  exchangeId: string;
  baseId: string;
  quoteId: string;
  baseSymbol: string;
  quoteSymbol: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  volumePercent: string;
}

export interface CoinCapExchange {
  exchangeId: string;
  name: string;
  rank: string;
  percentTotalVolume: string;
  volumeUsd: string;
  tradingPairs: string;
  socket: boolean;
  exchangeUrl: string;
  updated: number;
}

export interface CoinCapRate {
  id: string;
  symbol: string;
  currencySymbol: string;
  type: string;
  rateUsd: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all assets with market data
 */
export async function getAssets(options?: {
  search?: string;
  ids?: string[];
  limit?: number;
  offset?: number;
}): Promise<CoinCapAsset[]> {
  const cacheKey = `coincap:assets:${JSON.stringify(options || {})}`;
  const cached = cache.get<CoinCapAsset[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.ids) params.set('ids', options.ids.join(','));
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const url = `${BASE_URL}/assets${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapAsset[]> = await response.json();
  cache.set(cacheKey, result.data, CACHE_TTL.prices);

  return result.data;
}

/**
 * Get single asset by ID
 */
export async function getAsset(id: string): Promise<CoinCapAsset> {
  const cacheKey = `coincap:asset:${id}`;
  const cached = cache.get<CoinCapAsset>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/assets/${id}`);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapAsset> = await response.json();
  cache.set(cacheKey, result.data, CACHE_TTL.prices);

  return result.data;
}

/**
 * Get asset price history
 */
export async function getAssetHistory(
  id: string,
  interval: 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h2' | 'h6' | 'h12' | 'd1' = 'd1',
  start?: number,
  end?: number
): Promise<CoinCapHistory[]> {
  const params = new URLSearchParams({ interval });
  if (start) params.set('start', start.toString());
  if (end) params.set('end', end.toString());

  const cacheKey = `coincap:history:${id}:${interval}:${start}:${end}`;
  const cached = cache.get<CoinCapHistory[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/assets/${id}/history?${params}`);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapHistory[]> = await response.json();

  const ttl = interval === 'd1' ? CACHE_TTL.historical_7d : CACHE_TTL.historical_1d;
  cache.set(cacheKey, result.data, ttl);

  return result.data;
}

/**
 * Get markets for an asset
 */
export async function getAssetMarkets(
  id: string,
  limit = 50,
  offset = 0
): Promise<CoinCapMarket[]> {
  const cacheKey = `coincap:markets:${id}:${limit}:${offset}`;
  const cached = cache.get<CoinCapMarket[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${BASE_URL}/assets/${id}/markets?${params}`);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapMarket[]> = await response.json();
  cache.set(cacheKey, result.data, CACHE_TTL.markets);

  return result.data;
}

/**
 * Get all exchanges
 */
export async function getExchanges(): Promise<CoinCapExchange[]> {
  const cacheKey = 'coincap:exchanges';
  const cached = cache.get<CoinCapExchange[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/exchanges`);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapExchange[]> = await response.json();
  cache.set(cacheKey, result.data, CACHE_TTL.static);

  return result.data;
}

/**
 * Get currency rates
 */
export async function getRates(): Promise<CoinCapRate[]> {
  const cacheKey = 'coincap:rates';
  const cached = cache.get<CoinCapRate[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/rates`);

  if (!response.ok) {
    throw new Error(`CoinCap API error: ${response.status}`);
  }

  const result: CoinCapResponse<CoinCapRate[]> = await response.json();
  cache.set(cacheKey, result.data, CACHE_TTL.prices);

  return result.data;
}

/**
 * Convert CoinCap asset to our standard format
 */
export function normalizeAsset(asset: CoinCapAsset) {
  return {
    id: asset.id,
    symbol: asset.symbol.toLowerCase(),
    name: asset.name,
    current_price: parseFloat(asset.priceUsd),
    market_cap: parseFloat(asset.marketCapUsd),
    market_cap_rank: parseInt(asset.rank),
    total_volume: parseFloat(asset.volumeUsd24Hr),
    price_change_percentage_24h: parseFloat(asset.changePercent24Hr),
    circulating_supply: parseFloat(asset.supply),
    max_supply: asset.maxSupply ? parseFloat(asset.maxSupply) : null,
    total_supply: asset.maxSupply ? parseFloat(asset.maxSupply) : null,
  };
}
