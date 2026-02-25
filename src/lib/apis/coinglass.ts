/**
 * CoinGlass Derivatives Analytics API
 *
 * Crypto derivatives data — liquidations, open interest, funding rates,
 * long/short ratios, and more across all major exchanges.
 *
 * Free tier: 100 req/day. Pro: 1000 req/day ($49/mo).
 *
 * @see https://coinglass.com/api
 * @module lib/apis/coinglass
 */

const BASE_URL = 'https://open-api-v3.coinglass.com/api';
const API_KEY = process.env.COINGLASS_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface FundingRate {
  symbol: string;
  exchange: string;
  rate: number;
  annualizedRate: number;
  nextFundingTime: number;
  markPrice: number;
  indexPrice: number;
  timestamp: number;
}

export interface OpenInterest {
  symbol: string;
  openInterest: number;
  openInterestChange24h: number;
  openInterestChangePercent: number;
  topExchanges: Array<{
    exchange: string;
    openInterest: number;
    change24h: number;
  }>;
  timestamp: number;
}

export interface Liquidation {
  symbol: string;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  totalLiquidations24h: number;
  longLiquidations1h: number;
  shortLiquidations1h: number;
  largestSingleLiquidation: number;
  largestSingleSide: 'long' | 'short';
  timestamp: number;
}

export interface LongShortRatio {
  symbol: string;
  exchange: string;
  longPercent: number;
  shortPercent: number;
  longShortRatio: number;
  longAccount: number;
  shortAccount: number;
  timestamp: number;
}

export interface LiquidationHeatmap {
  symbol: string;
  priceRange: { low: number; high: number };
  liquidationLevels: Array<{
    price: number;
    longLiquidations: number;
    shortLiquidations: number;
  }>;
  timestamp: number;
}

export interface DerivativeSummary {
  totalOpenInterest: number;
  totalOpenInterestChange24h: number;
  totalLiquidations24h: number;
  avgFundingRate: number;
  topSymbols: Array<{
    symbol: string;
    openInterest: number;
    liquidations24h: number;
    fundingRate: number;
  }>;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from CoinGlass API with key auth.
 */
async function cgFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn('CoinGlass: COINGLASS_API_KEY not set — skipping request');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        accept: 'application/json',
        CG_API_KEY: API_KEY,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`CoinGlass API error ${res.status}: ${path}`);
      return null;
    }

    const json = await res.json();
    // CoinGlass wraps data in { code, msg, data }
    if (json.code !== '0' && json.code !== 0) {
      console.error(`CoinGlass API code=${json.code}: ${json.msg}`);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error('CoinGlass API request failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Funding Rates
// ---------------------------------------------------------------------------

/**
 * Get current funding rates across exchanges.
 */
export async function getFundingRates(symbol?: string): Promise<FundingRate[]> {
  const path = symbol
    ? `/futures/funding-rate?symbol=${encodeURIComponent(symbol)}`
    : '/futures/funding-rate';

  const data = await cgFetch<
    Array<{
      symbol: string;
      exchangeList: Array<{
        exchangeName: string;
        rate: number;
        annualizedRate: number;
        nextFundingTime: number;
        markPrice: number;
        indexPrice: number;
      }>;
    }>
  >(path);

  if (!data) return [];

  const rates: FundingRate[] = [];
  const now = Date.now();

  for (const item of data) {
    for (const ex of item.exchangeList || []) {
      rates.push({
        symbol: item.symbol,
        exchange: ex.exchangeName,
        rate: ex.rate || 0,
        annualizedRate: ex.annualizedRate || 0,
        nextFundingTime: ex.nextFundingTime || 0,
        markPrice: ex.markPrice || 0,
        indexPrice: ex.indexPrice || 0,
        timestamp: now,
      });
    }
  }

  return rates;
}

// ---------------------------------------------------------------------------
// Open Interest
// ---------------------------------------------------------------------------

/**
 * Get aggregated open interest data.
 */
export async function getOpenInterest(symbol?: string): Promise<OpenInterest[]> {
  const path = symbol
    ? `/futures/openInterest?symbol=${encodeURIComponent(symbol)}`
    : '/futures/openInterest';

  const data = await cgFetch<
    Array<{
      symbol: string;
      openInterest: number;
      h24Change: number;
      h24ChangePercent: number;
      exchangeList?: Array<{
        exchangeName: string;
        openInterest: number;
        h24Change: number;
      }>;
    }>
  >(path);

  if (!data) return [];

  return data.map((item) => ({
    symbol: item.symbol,
    openInterest: item.openInterest || 0,
    openInterestChange24h: item.h24Change || 0,
    openInterestChangePercent: item.h24ChangePercent || 0,
    topExchanges: (item.exchangeList || []).map((ex) => ({
      exchange: ex.exchangeName,
      openInterest: ex.openInterest || 0,
      change24h: ex.h24Change || 0,
    })),
    timestamp: Date.now(),
  }));
}

// ---------------------------------------------------------------------------
// Liquidations
// ---------------------------------------------------------------------------

/**
 * Get liquidation data for top coins.
 */
export async function getLiquidations(symbol?: string): Promise<Liquidation[]> {
  const path = symbol
    ? `/futures/liquidation/detail?symbol=${encodeURIComponent(symbol)}`
    : '/futures/liquidation/detail';

  const data = await cgFetch<
    Array<{
      symbol: string;
      longLiquidationUsd: number;
      shortLiquidationUsd: number;
      h1LongLiquidationUsd: number;
      h1ShortLiquidationUsd: number;
      largestLiquidation?: number;
      largestLiquidationSide?: string;
    }>
  >(path);

  if (!data) return [];

  return data.map((item) => ({
    symbol: item.symbol,
    longLiquidations24h: item.longLiquidationUsd || 0,
    shortLiquidations24h: item.shortLiquidationUsd || 0,
    totalLiquidations24h:
      (item.longLiquidationUsd || 0) + (item.shortLiquidationUsd || 0),
    longLiquidations1h: item.h1LongLiquidationUsd || 0,
    shortLiquidations1h: item.h1ShortLiquidationUsd || 0,
    largestSingleLiquidation: item.largestLiquidation || 0,
    largestSingleSide: (item.largestLiquidationSide as 'long' | 'short') || 'long',
    timestamp: Date.now(),
  }));
}

// ---------------------------------------------------------------------------
// Long/Short Ratio
// ---------------------------------------------------------------------------

/**
 * Get long/short account ratio from top exchanges.
 */
export async function getLongShortRatio(
  symbol: string = 'BTC',
): Promise<LongShortRatio[]> {
  const data = await cgFetch<
    Array<{
      exchangeName: string;
      longPercent: number;
      shortPercent: number;
      longShortRatio: number;
      longAccount: number;
      shortAccount: number;
    }>
  >(`/futures/longShort?symbol=${encodeURIComponent(symbol)}`);

  if (!data) return [];

  return data.map((item) => ({
    symbol,
    exchange: item.exchangeName,
    longPercent: item.longPercent || 50,
    shortPercent: item.shortPercent || 50,
    longShortRatio: item.longShortRatio || 1,
    longAccount: item.longAccount || 0,
    shortAccount: item.shortAccount || 0,
    timestamp: Date.now(),
  }));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get comprehensive derivatives market summary.
 */
export async function getDerivativeSummary(): Promise<DerivativeSummary> {
  const [oi, liqs, funding] = await Promise.all([
    getOpenInterest(),
    getLiquidations(),
    getFundingRates(),
  ]);

  const totalOI = oi.reduce((s, i) => s + i.openInterest, 0);
  const totalOIChange = oi.reduce((s, i) => s + i.openInterestChange24h, 0);
  const totalLiqs = liqs.reduce((s, l) => s + l.totalLiquidations24h, 0);

  // Average funding across all BTC rates
  const btcFunding = funding.filter((f) => f.symbol === 'BTC');
  const avgFunding =
    btcFunding.length > 0
      ? btcFunding.reduce((s, f) => s + f.rate, 0) / btcFunding.length
      : 0;

  // Top symbols by OI
  const topSymbols = oi
    .sort((a, b) => b.openInterest - a.openInterest)
    .slice(0, 20)
    .map((item) => {
      const liq = liqs.find((l) => l.symbol === item.symbol);
      const fund = funding.find(
        (f) => f.symbol === item.symbol && f.exchange === 'Binance',
      );
      return {
        symbol: item.symbol,
        openInterest: item.openInterest,
        liquidations24h: liq?.totalLiquidations24h || 0,
        fundingRate: fund?.rate || 0,
      };
    });

  return {
    totalOpenInterest: totalOI,
    totalOpenInterestChange24h: totalOIChange,
    totalLiquidations24h: totalLiqs,
    avgFundingRate: avgFunding,
    topSymbols,
    timestamp: new Date().toISOString(),
  };
}
