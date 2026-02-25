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
// COINGLASS — AGGREGATED DERIVATIVES DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Get funding rates across exchanges via Coinglass
 */
export async function getAggregatedFundingRates(symbol = 'BTC'): Promise<FundingRate[]> {
  try {
    const data = await coinglass.fetch<{ data: any[] }>('/funding', { symbol });
    return (data.data || []).map((item: any) => ({
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
    const data = await coinglass.fetch<{ data: any[] }>('/open_interest', { symbol });
    return (data.data || []).map((item: any) => ({
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
    const data = await coinglass.fetch<{ data: any }>('/liquidation', { symbol });
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
    const data = await coinglass.fetch<{ data: any[] }>('/long_short', { symbol });
    return (data.data || []).map((item: any) => ({
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

/**
 * Get BTC/ETH options from Deribit
 */
export async function getOptionsChain(
  currency: 'BTC' | 'ETH' = 'BTC',
  kind: 'option' | 'future' = 'option',
): Promise<OptionsData[]> {
  try {
    const data = await deribit.fetch<{
      result: any[];
    }>(`/get_instruments?currency=${currency}&kind=${kind}&expired=false`);

    return (data.result || []).slice(0, 100).map((inst: any) => ({
      instrument: inst.instrument_name,
      underlying: currency,
      strikePrice: inst.strike || 0,
      optionType: inst.option_type === 'call' ? 'call' : 'put',
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

/**
 * Get Bybit perpetual market tickers
 */
export async function getBybitPerps(
  symbol?: string,
): Promise<PerpMarket[]> {
  const params: Record<string, string> = { category: 'linear' };
  if (symbol) params.symbol = `${symbol}USDT`;

  const data = await bybit.fetch<{
    result: { list: any[] };
  }>('/market/tickers', params);

  return (data.result?.list || []).slice(0, 50).map((t: any) => ({
    exchange: 'bybit',
    symbol: t.symbol,
    markPrice: parseFloat(t.markPrice) || 0,
    indexPrice: parseFloat(t.indexPrice) || 0,
    basis: (parseFloat(t.markPrice) || 0) - (parseFloat(t.indexPrice) || 0),
    basisPercentage:
      parseFloat(t.indexPrice) > 0
        ? ((parseFloat(t.markPrice) - parseFloat(t.indexPrice)) / parseFloat(t.indexPrice)) * 100
        : 0,
    fundingRate: parseFloat(t.fundingRate) || 0,
    openInterest: parseFloat(t.openInterest) || 0,
    volume24h: parseFloat(t.turnover24h) || 0,
  }));
}

/**
 * Get Bybit funding rate history
 */
export async function getBybitFundingHistory(
  symbol: string,
  limit = 20,
): Promise<FundingRate[]> {
  const data = await bybit.fetch<{
    result: { list: any[] };
  }>('/market/funding/history', {
    category: 'linear',
    symbol: `${symbol}USDT`,
    limit: String(limit),
  });

  return (data.result?.list || []).map((f: any) => ({
    exchange: 'bybit',
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

/**
 * Get OKX perpetual tickers
 */
export async function getOKXPerps(instId?: string): Promise<PerpMarket[]> {
  const params: Record<string, string> = { instType: 'SWAP' };
  if (instId) params.instId = instId;

  const data = await okx.fetch<{ data: any[] }>('/market/tickers', params);

  return (data.data || []).slice(0, 50).map((t: any) => ({
    exchange: 'okx',
    symbol: t.instId,
    markPrice: parseFloat(t.last) || 0,
    indexPrice: 0, // Would need separate API call
    basis: 0,
    basisPercentage: 0,
    fundingRate: 0,
    openInterest: parseFloat(t.openInterest) || 0,
    volume24h: parseFloat(t.vol24h) || 0,
  }));
}

/**
 * Get OKX funding rate
 */
export async function getOKXFundingRate(instId = 'BTC-USDT-SWAP'): Promise<FundingRate> {
  const data = await okx.fetch<{ data: any[] }>('/public/funding-rate', { instId });
  const d = data.data?.[0] || {};

  return {
    exchange: 'okx',
    symbol: instId,
    rate: parseFloat(d.fundingRate) || 0,
    annualized: (parseFloat(d.fundingRate) || 0) * 3 * 365 * 100,
    nextFundingTime: parseInt(d.nextFundingTime) || 0,
    timestamp: parseInt(d.fundingTime) || Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════
// HYPERLIQUID — DECENTRALIZED PERPS
// ═══════════════════════════════════════════════════════════════

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
    const data = await response.json();

    const meta = data?.[0]?.universe || [];
    const ctxs = data?.[1] || [];

    return meta.map((m: any, i: number) => {
      const ctx = ctxs[i] || {};
      return {
        exchange: 'hyperliquid',
        symbol: m.name,
        markPrice: parseFloat(ctx.markPx) || 0,
        indexPrice: parseFloat(ctx.oraclePx) || 0,
        basis: (parseFloat(ctx.markPx) || 0) - (parseFloat(ctx.oraclePx) || 0),
        basisPercentage:
          parseFloat(ctx.oraclePx) > 0
            ? ((parseFloat(ctx.markPx) - parseFloat(ctx.oraclePx)) / parseFloat(ctx.oraclePx)) * 100
            : 0,
        fundingRate: parseFloat(ctx.funding) || 0,
        openInterest: parseFloat(ctx.openInterest) || 0,
        volume24h: parseFloat(ctx.dayNtlVlm) || 0,
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
