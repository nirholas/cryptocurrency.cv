/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Derivatives & Futures Data — Funding rates, open interest, liquidations, options
 *
 * Sources: Coinglass, Deribit, Bybit, OKX, Hyperliquid, CoinGecko
 *
 * @module data-sources/derivatives
 */

import { coinglass, deribit, bybit, okx, hyperliquid } from './index';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FundingRate {
  exchange: string;
  symbol: string;
  rate: number;
  annualized: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface OpenInterest {
  exchange: string;
  symbol: string;
  openInterest: number; // in USD
  openInterestChange24h: number;
  timestamp: number;
}

export interface Liquidation {
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number; // in USD
  price: number;
  timestamp: number;
}

export interface LiquidationSummary {
  symbol: string;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  totalLiquidations24h: number;
  longShortRatio: number;
}

export interface OptionsData {
  instrument: string;
  underlying: string;
  strikePrice: number;
  optionType: 'call' | 'put';
  expirationDate: number;
  markPrice: number;
  impliedVolatility: number;
  openInterest: number;
  volume24h: number;
  delta: number;
  gamma: number;
}

export interface LongShortRatio {
  exchange: string;
  symbol: string;
  longAccount: number;
  shortAccount: number;
  longShortRatio: number;
  timestamp: number;
}

export interface PerpMarket {
  exchange: string;
  symbol: string;
  markPrice: number;
  indexPrice: number;
  basis: number; // mark - index
  basisPercentage: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

interface CoinglassFundingItem {
  exchangeName?: string;
  symbol?: string;
  rate?: number;
  nextFundingTime?: number;
}

interface CoinglassOIItem {
  exchangeName?: string;
  symbol?: string;
  openInterest?: number;
  openInterestChange24h?: number;
}

interface CoinglassLiquidationData {
  longLiquidationUsd?: number;
  shortLiquidationUsd?: number;
}

interface CoinglassLongShortItem {
  exchangeName?: string;
  longAccount?: number;
  shortAccount?: number;
  longShortRatio?: number;
}

// ═══════════════════════════════════════════════════════════════
// COINGLASS — AGGREGATED DERIVATIVES DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Get funding rates across exchanges via Coinglass
 */
export async function getAggregatedFundingRates(symbol = 'BTC'): Promise<FundingRate[]> {
  try {
    const data = await coinglass.fetch<{ data: CoinglassFundingItem[] }>('/funding', { symbol });
    return (data.data || []).map((item) => ({
      exchange: item.exchangeName || '',
      symbol: item.symbol || symbol,
      rate: item.rate || 0,
      annualized: (item.rate || 0) * 3 * 365 * 100, // 8h funding → annualized %
      nextFundingTime: item.nextFundingTime || 0,
      timestamp: Date.now(),
    }));
  } catch {
    return [];
  }
}

/**
 * Get aggregated open interest from Coinglass
 */
export async function getAggregatedOpenInterest(symbol = 'BTC'): Promise<OpenInterest[]> {
  try {
    const data = await coinglass.fetch<{ data: CoinglassOIItem[] }>('/open_interest', { symbol });
    return (data.data || []).map((item) => ({
      exchange: item.exchangeName || '',
      symbol: item.symbol || symbol,
      openInterest: item.openInterest || 0,
      openInterestChange24h: item.openInterestChange24h || 0,
      timestamp: Date.now(),
    }));
  } catch {
    return [];
  }
}

/**
 * Get liquidation data from Coinglass
 */
export async function getLiquidations(symbol = 'BTC'): Promise<LiquidationSummary> {
  try {
    const data = await coinglass.fetch<{ data: CoinglassLiquidationData }>('/liquidation', { symbol });
    const d = data.data || {};
    return {
      symbol,
      longLiquidations24h: d.longLiquidationUsd || 0,
      shortLiquidations24h: d.shortLiquidationUsd || 0,
      totalLiquidations24h: (d.longLiquidationUsd || 0) + (d.shortLiquidationUsd || 0),
      longShortRatio: d.longLiquidationUsd && d.shortLiquidationUsd
        ? d.longLiquidationUsd / d.shortLiquidationUsd
        : 1,
    };
  } catch {
    return {
      symbol,
      longLiquidations24h: 0,
      shortLiquidations24h: 0,
      totalLiquidations24h: 0,
      longShortRatio: 1,
    };
  }
}

/**
 * Get long/short ratio from Coinglass
 */
export async function getLongShortRatio(symbol = 'BTC'): Promise<LongShortRatio[]> {
  try {
    const data = await coinglass.fetch<{ data: CoinglassLongShortItem[] }>('/long_short', { symbol });
    return (data.data || []).map((item) => ({
      exchange: item.exchangeName || '',
      symbol,
      longAccount: item.longAccount || 0,
      shortAccount: item.shortAccount || 0,
      longShortRatio: item.longShortRatio || 1,
      timestamp: Date.now(),
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// DERIBIT — OPTIONS
// ═══════════════════════════════════════════════════════════════

interface DeribitInstrument {
  instrument_name: string;
  strike?: number;
  option_type?: string;
  expiration_timestamp?: number;
  open_interest?: number;
}

/**
 * Get BTC/ETH options from Deribit
 */
export async function getOptionsChain(
  currency: 'BTC' | 'ETH' = 'BTC',
  kind: 'option' | 'future' = 'option',
): Promise<OptionsData[]> {
  try {
    const data = await deribit.fetch<{
      result: DeribitInstrument[];
    }>(`/get_instruments?currency=${currency}&kind=${kind}&expired=false`);

    return (data.result || []).slice(0, 100).map((inst) => ({
      instrument: inst.instrument_name,
      underlying: currency,
      strikePrice: inst.strike || 0,
      optionType: inst.option_type === 'call' ? ('call' as const) : ('put' as const),
      expirationDate: inst.expiration_timestamp || 0,
      markPrice: 0, // Need separate ticker call
      impliedVolatility: 0,
      openInterest: inst.open_interest || 0,
      volume24h: 0,
      delta: 0,
      gamma: 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get Deribit BTC index price
 */
export async function getDeribitIndex(currency: 'BTC' | 'ETH' = 'BTC'): Promise<{
  indexPrice: number;
  estimatedDeliveryPrice: number;
}> {
  const data = await deribit.fetch<{
    result: { index_price: number; estimated_delivery_price: number };
  }>(`/get_index_price?index_name=${currency.toLowerCase()}_usd`);

  return {
    indexPrice: data.result.index_price,
    estimatedDeliveryPrice: data.result.estimated_delivery_price,
  };
}

/**
 * Get BTC/ETH volatility index from Deribit
 */
export async function getVolatilityIndex(currency: 'BTC' | 'ETH' = 'BTC'): Promise<{
  volatility: number;
  timestamp: number;
}> {
  try {
    const data = await deribit.fetch<{
      result: { volatility: number; index_price: number };
    }>(`/get_volatility_index_data?currency=${currency}&resolution=3600&start_timestamp=${Date.now() - 3600000}&end_timestamp=${Date.now()}`);

    return {
      volatility: data.result?.volatility || 0,
      timestamp: Date.now(),
    };
  } catch {
    return { volatility: 0, timestamp: Date.now() };
  }
}

// ═══════════════════════════════════════════════════════════════
// BYBIT — PERPS & FUTURES
// ═══════════════════════════════════════════════════════════════

interface BybitTicker {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  fundingRate: string;
  openInterest: string;
  turnover24h: string;
}

interface BybitFundingRecord {
  symbol: string;
  fundingRate: string;
  fundingRateTimestamp: string;
}

/**
 * Get Bybit perpetual market tickers
 */
export async function getBybitPerps(
  symbol?: string,
): Promise<PerpMarket[]> {
  const params: Record<string, string> = { category: 'linear' };
  if (symbol) params.symbol = `${symbol}USDT`;

  const data = await bybit.fetch<{
    result: { list: BybitTicker[] };
  }>('/market/tickers', params);

  return (data.result?.list || []).slice(0, 50).map((t) => {
    const markPrice = parseFloat(t.markPrice) || 0;
    const indexPrice = parseFloat(t.indexPrice) || 0;
    return {
      exchange: 'bybit' as const,
      symbol: t.symbol,
      markPrice,
      indexPrice,
      basis: markPrice - indexPrice,
      basisPercentage: indexPrice > 0 ? ((markPrice - indexPrice) / indexPrice) * 100 : 0,
      fundingRate: parseFloat(t.fundingRate) || 0,
      openInterest: parseFloat(t.openInterest) || 0,
      volume24h: parseFloat(t.turnover24h) || 0,
    };
  });
}

/**
 * Get Bybit funding rate history
 */
export async function getBybitFundingHistory(
  symbol: string,
  limit = 20,
): Promise<FundingRate[]> {
  const data = await bybit.fetch<{
    result: { list: BybitFundingRecord[] };
  }>('/market/funding/history', {
    category: 'linear',
    symbol: `${symbol}USDT`,
    limit: String(limit),
  });

  return (data.result?.list || []).map((f) => ({
    exchange: 'bybit' as const,
    symbol: f.symbol,
    rate: parseFloat(f.fundingRate) || 0,
    annualized: (parseFloat(f.fundingRate) || 0) * 3 * 365 * 100,
    nextFundingTime: 0,
    timestamp: parseInt(f.fundingRateTimestamp) || Date.now(),
  }));
}

// ═══════════════════════════════════════════════════════════════
// OKX — PERPS & FUTURES
// ═══════════════════════════════════════════════════════════════

interface OKXTicker {
  instId: string;
  last: string;
  openInterest: string;
  vol24h: string;
}

interface OKXIndexTicker {
  instId: string;
  idxPx: string;
}

interface OKXFundingRateData {
  fundingRate?: string;
  nextFundingTime?: string;
  fundingTime?: string;
}

/**
 * Get OKX perpetual tickers
 */
export async function getOKXPerps(instId?: string): Promise<PerpMarket[]> {
  const params: Record<string, string> = { instType: 'SWAP' };
  if (instId) params.instId = instId;

  const data = await okx.fetch<{ data: OKXTicker[] }>('/market/tickers', params);

  // Also fetch index prices for basis calculation
  const indexMap = new Map<string, number>();
  try {
    const indexRes = await okx.fetch<{ data: OKXIndexTicker[] }>('/market/index-tickers', { instType: 'SWAP' });
    for (const idx of (indexRes.data || [])) {
      indexMap.set(idx.instId, parseFloat(idx.idxPx) || 0);
    }
  } catch { /* index prices unavailable — will use 0 */ }

  return (data.data || []).slice(0, 50).map((t) => {
    const markPrice = parseFloat(t.last) || 0;
    const indexPrice = indexMap.get(t.instId) || 0;
    const basis = indexPrice > 0 ? markPrice - indexPrice : 0;
    const basisPercentage = indexPrice > 0 ? (basis / indexPrice) * 100 : 0;
    return {
      exchange: 'okx' as const,
      symbol: t.instId,
      markPrice,
      indexPrice,
      basis,
      basisPercentage,
      fundingRate: 0,
      openInterest: parseFloat(t.openInterest) || 0,
      volume24h: parseFloat(t.vol24h) || 0,
    };
  });
}

/**
 * Get OKX funding rate
 */
export async function getOKXFundingRate(instId = 'BTC-USDT-SWAP'): Promise<FundingRate> {
  const data = await okx.fetch<{ data: OKXFundingRateData[] }>('/public/funding-rate', { instId });
  const d = data.data?.[0] || {};

  return {
    exchange: 'okx',
    symbol: instId,
    rate: parseFloat(d.fundingRate || '0') || 0,
    annualized: (parseFloat(d.fundingRate || '0') || 0) * 3 * 365 * 100,
    nextFundingTime: parseInt(d.nextFundingTime || '0') || 0,
    timestamp: parseInt(d.fundingTime || '0') || Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════
// HYPERLIQUID — DECENTRALIZED PERPS
// ═══════════════════════════════════════════════════════════════

interface HyperliquidMeta {
  name: string;
}

interface HyperliquidAssetCtx {
  markPx?: string;
  oraclePx?: string;
  funding?: string;
  openInterest?: string;
  dayNtlVlm?: string;
}

/**
 * Get Hyperliquid market data — posted via JSON body
 */
export async function getHyperliquidMarkets(): Promise<PerpMarket[]> {
  try {
    // Hyperliquid uses POST with JSON body
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (!response.ok) return [];
    const data: [{ universe: HyperliquidMeta[] }, HyperliquidAssetCtx[]] = await response.json();

    const meta = data[0]?.universe || [];
    const ctxs = data[1] || [];

    return meta.map((m, i) => {
      const ctx = ctxs[i] || {};
      const markPrice = parseFloat(ctx.markPx || '0') || 0;
      const oraclePrice = parseFloat(ctx.oraclePx || '0') || 0;
      return {
        exchange: 'hyperliquid' as const,
        symbol: m.name,
        markPrice,
        indexPrice: oraclePrice,
        basis: markPrice - oraclePrice,
        basisPercentage: oraclePrice > 0 ? ((markPrice - oraclePrice) / oraclePrice) * 100 : 0,
        fundingRate: parseFloat(ctx.funding || '0') || 0,
        openInterest: parseFloat(ctx.openInterest || '0') || 0,
        volume24h: parseFloat(ctx.dayNtlVlm || '0') || 0,
      };
    });
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATED VIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Cross-exchange funding rate comparison
 */
export async function getCrossExchangeFunding(symbol = 'BTC'): Promise<{
  aggregated: FundingRate[];
  bybit: FundingRate[];
  okx: FundingRate | null;
  average: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}> {
  const [aggregated, bybitRates, okxRate] = await Promise.allSettled([
    getAggregatedFundingRates(symbol),
    getBybitFundingHistory(symbol, 5),
    getOKXFundingRate(`${symbol}-USDT-SWAP`),
  ]);

  const allRates = [
    ...(aggregated.status === 'fulfilled' ? aggregated.value : []),
    ...(bybitRates.status === 'fulfilled' ? bybitRates.value : []),
  ];

  const avg =
    allRates.length > 0
      ? allRates.reduce((sum, r) => sum + r.rate, 0) / allRates.length
      : 0;

  return {
    aggregated: aggregated.status === 'fulfilled' ? aggregated.value : [],
    bybit: bybitRates.status === 'fulfilled' ? bybitRates.value : [],
    okx: okxRate.status === 'fulfilled' ? okxRate.value : null,
    average: avg,
    sentiment: avg > 0.0001 ? 'bullish' : avg < -0.0001 ? 'bearish' : 'neutral',
  };
}

/**
 * Full derivatives dashboard — funding, OI, liquidations, options
 */
export async function getDerivativesDashboard(symbol = 'BTC'): Promise<{
  funding: FundingRate[];
  openInterest: OpenInterest[];
  liquidations: LiquidationSummary;
  longShortRatio: LongShortRatio[];
  bybitPerps: PerpMarket[];
  hyperliquidMarkets: PerpMarket[];
  deribitIndex: { indexPrice: number; estimatedDeliveryPrice: number } | null;
}> {
  const [funding, oi, liqs, lsr, bybitP, hlMarkets, dIdx] = await Promise.allSettled([
    getAggregatedFundingRates(symbol),
    getAggregatedOpenInterest(symbol),
    getLiquidations(symbol),
    getLongShortRatio(symbol),
    getBybitPerps(symbol),
    getHyperliquidMarkets(),
    getDeribitIndex(symbol as 'BTC' | 'ETH'),
  ]);

  return {
    funding: funding.status === 'fulfilled' ? funding.value : [],
    openInterest: oi.status === 'fulfilled' ? oi.value : [],
    liquidations: liqs.status === 'fulfilled'
      ? liqs.value
      : { symbol, longLiquidations24h: 0, shortLiquidations24h: 0, totalLiquidations24h: 0, longShortRatio: 1 },
    longShortRatio: lsr.status === 'fulfilled' ? lsr.value : [],
    bybitPerps: bybitP.status === 'fulfilled' ? bybitP.value : [],
    hyperliquidMarkets: hlMarkets.status === 'fulfilled'
      ? hlMarkets.value.filter((m) => m.symbol.includes(symbol))
      : [],
    deribitIndex: dIdx.status === 'fulfilled' ? dIdx.value : null,
  };
}
