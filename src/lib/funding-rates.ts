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
 * Funding Rate Dashboard Service
 * 
 * Real-time funding rate aggregation across major perpetual exchanges.
 * Provides arbitrage opportunities, historical analysis, and predictive signals.
 * 
 * Exchanges Supported:
 * - Binance Futures
 * - Bybit
 * - OKX
 * - dYdX
 * - Hyperliquid
 * 
 * @module lib/funding-rates
 */

import { cache } from './cache';
import { EXTERNAL_APIS, CACHE_TTL } from './external-apis';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

// =============================================================================
// Types
// =============================================================================

export interface FundingRateData {
  symbol: string;
  baseAsset: string;
  exchange: string;
  fundingRate: number;
  fundingRateAnnualized: number;
  predictedRate?: number;
  markPrice: number;
  indexPrice: number;
  nextFundingTime: number;
  timeUntilFunding: number;
  openInterest: number;
  volume24h: number;
  fundingInterval: number; // hours
  lastUpdated: number;
}

export interface CrossExchangeFunding {
  symbol: string;
  baseAsset: string;
  exchanges: {
    exchange: string;
    rate: number;
    annualized: number;
    nextFunding: number;
    markPrice: number;
    openInterest: number;
  }[];
  spread: number;
  spreadAnnualized: number;
  arbitrageOpportunity: boolean;
  direction: 'long-short' | 'short-long' | 'neutral';
  bestLong: string;
  bestShort: string;
  timestamp: number;
}

export interface FundingHistory {
  symbol: string;
  exchange: string;
  history: {
    timestamp: number;
    rate: number;
    markPrice: number;
  }[];
  averageRate: number;
  maxRate: number;
  minRate: number;
  volatility: number;
  positiveRatio: number;
}

export interface FundingArbitrage {
  symbol: string;
  longExchange: string;
  shortExchange: string;
  longRate: number;
  shortRate: number;
  spread: number;
  annualizedYield: number;
  estimatedDailyYield: number;
  riskScore: number;
  liquidityScore: number;
  combinedScore: number;
  notes: string[];
}

export interface FundingDashboard {
  topPositive: FundingRateData[];
  topNegative: FundingRateData[];
  arbitrageOpportunities: FundingArbitrage[];
  crossExchange: CrossExchangeFunding[];
  marketSummary: {
    averageRate: number;
    totalOpenInterest: number;
    bullishBias: number;
    exchangeBreakdown: Record<string, { avgRate: number; totalOI: number }>;
  };
  lastUpdated: string;
}

// =============================================================================
// Configuration
// =============================================================================

const FUNDING_INTERVALS: Record<string, number> = {
  binance: 8,
  bybit: 8,
  okx: 8,
  dydx: 1,
  hyperliquid: 1,
};

const STANDARD_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT',
  'UNIUSDT', 'LTCUSDT', 'ATOMUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'SUIUSDT', 'SEIUSDT', 'TIAUSDT', 'INJUSDT',
];

// =============================================================================
// Binance Futures Funding
// =============================================================================

interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

async function fetchBinanceFundingRates(): Promise<FundingRateData[]> {
  const cacheKey = 'funding:binance:all';
  const cached = cache.get<FundingRateData[]>(cacheKey);
  if (cached) return cached;

  try {
    const [premiumResponse, oiResponse] = await Promise.all([
      resilientFetchResponse(`${EXTERNAL_APIS.BINANCE_FUTURES}/fapi/v1/premiumIndex`, { service: 'binance-futures', timeoutMs: 8000, retries: 1 }),
      resilientFetchResponse(`${EXTERNAL_APIS.BINANCE_FUTURES}/fapi/v1/openInterest?symbol=BTCUSDT`, { service: 'binance-futures', timeoutMs: 8000, retries: 1 }).catch(() => null),
    ]);

    if (!premiumResponse.ok) {
      console.warn(`Binance funding API returned ${premiumResponse.status} (likely geo-restricted from this region)`);
      return cache.get<FundingRateData[]>('funding:binance:stale') ?? [];
    }

    const premiumData: BinancePremiumIndex[] = await premiumResponse.json();
    
    // Fetch open interest and 24h volume for top symbols
    const oiMap = new Map<string, number>();
    const volMap = new Map<string, number>();

    // Fetch 24h ticker data for volume (single API call for all symbols)
    try {
      const tickerRes = await resilientFetchResponse(`${EXTERNAL_APIS.BINANCE_FUTURES}/fapi/v1/ticker/24hr`, { service: 'binance-futures', timeoutMs: 8000, retries: 1 });
      if (tickerRes.ok) {
        const tickers = await tickerRes.json();
        for (const t of tickers) {
          if (t.symbol && t.quoteVolume) {
            volMap.set(t.symbol, parseFloat(t.quoteVolume) || 0);
          }
        }
      }
    } catch { /* volume fetch failed — will use 0 */ }

    const oiPromises = STANDARD_SYMBOLS.slice(0, 20).map(async (symbol) => {
      try {
        const res = await resilientFetchResponse(`${EXTERNAL_APIS.BINANCE_FUTURES}/fapi/v1/openInterest?symbol=${symbol}`, { service: 'binance-futures', timeoutMs: 8000, retries: 1 });
        if (res.ok) {
          const data = await res.json();
          oiMap.set(symbol, parseFloat(data.openInterest) * parseFloat(
            premiumData.find(p => p.symbol === symbol)?.markPrice || '0'
          ));
        }
      } catch { /* ignore individual failures */ }
    });
    await Promise.all(oiPromises);

    const now = Date.now();
    const rates: FundingRateData[] = premiumData
      .filter(p => p.symbol.endsWith('USDT') && !p.symbol.includes('_'))
      .map(p => {
        const rate = parseFloat(p.lastFundingRate);
        const annualized = rate * 3 * 365 * 100; // 3 times per day * 365 days
        const markPrice = parseFloat(p.markPrice);
        const indexPrice = parseFloat(p.indexPrice);
        
        return {
          symbol: p.symbol,
          baseAsset: p.symbol.replace('USDT', ''),
          exchange: 'binance',
          fundingRate: rate * 100, // Convert to percentage
          fundingRateAnnualized: annualized,
          markPrice,
          indexPrice,
          nextFundingTime: p.nextFundingTime,
          timeUntilFunding: Math.max(0, p.nextFundingTime - now),
          openInterest: oiMap.get(p.symbol) || 0,
          volume24h: volMap.get(p.symbol) || 0,
          fundingInterval: FUNDING_INTERVALS.binance,
          lastUpdated: now,
        };
      });

    cache.set(cacheKey, rates, CACHE_TTL.funding);
    cache.set('funding:binance:stale', rates, 3600); // 1hr stale fallback
    return rates;
  } catch (error) {
    console.warn('Binance funding fetch failed (geo-restriction or network issue):', error instanceof Error ? error.message : error);
    return cache.get<FundingRateData[]>('funding:binance:stale') ?? [];
  }
}

// =============================================================================
// Bybit Funding
// =============================================================================

interface BybitFundingTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: string;
  openInterest: string;
  openInterestValue: string;
  volume24h: string;
  turnover24h: string;
}

async function fetchBybitFundingRates(): Promise<FundingRateData[]> {
  const cacheKey = 'funding:bybit:all';
  const cached = cache.get<FundingRateData[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await resilientFetchResponse(`${EXTERNAL_APIS.BYBIT}/market/tickers?category=linear`, { service: 'bybit', timeoutMs: 8000, retries: 1 });
    
    if (!response.ok) {
      console.warn(`Bybit funding API returned ${response.status} (likely geo-restricted from this region)`);
      return cache.get<FundingRateData[]>('funding:bybit:stale') ?? [];
    }

    const result = await response.json();
    const tickers: BybitFundingTicker[] = result.result?.list || [];
    
    const now = Date.now();
    const rates: FundingRateData[] = tickers
      .filter(t => t.symbol.endsWith('USDT'))
      .map(t => {
        const rate = parseFloat(t.fundingRate);
        const annualized = rate * 3 * 365 * 100;
        const nextFunding = parseInt(t.nextFundingTime);
        
        return {
          symbol: t.symbol,
          baseAsset: t.symbol.replace('USDT', ''),
          exchange: 'bybit',
          fundingRate: rate * 100,
          fundingRateAnnualized: annualized,
          markPrice: parseFloat(t.markPrice),
          indexPrice: parseFloat(t.indexPrice),
          nextFundingTime: nextFunding,
          timeUntilFunding: Math.max(0, nextFunding - now),
          openInterest: parseFloat(t.openInterestValue),
          volume24h: parseFloat(t.turnover24h),
          fundingInterval: FUNDING_INTERVALS.bybit,
          lastUpdated: now,
        };
      });

    cache.set(cacheKey, rates, CACHE_TTL.funding);
    cache.set('funding:bybit:stale', rates, 3600); // 1hr stale fallback
    return rates;
  } catch (error) {
    console.warn('Bybit funding fetch failed (geo-restriction or network issue):', error instanceof Error ? error.message : error);
    return cache.get<FundingRateData[]>('funding:bybit:stale') ?? [];
  }
}

// =============================================================================
// OKX Funding
// =============================================================================

interface OKXFundingInfo {
  instId: string;
  instType: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
}

interface OKXTicker {
  instId: string;
  last: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  volCcy24h: string;
}

async function fetchOKXFundingRates(): Promise<FundingRateData[]> {
  const cacheKey = 'funding:okx:all';
  const cached = cache.get<FundingRateData[]>(cacheKey);
  if (cached) return cached;

  try {
    const [fundingResponse, tickerResponse] = await Promise.all([
      resilientFetchResponse(`${EXTERNAL_APIS.OKX}/public/funding-rate?instType=SWAP`, { service: 'okx', timeoutMs: 8000, retries: 1 }),
      resilientFetchResponse(`${EXTERNAL_APIS.OKX}/market/tickers?instType=SWAP`, { service: 'okx', timeoutMs: 8000, retries: 1 }),
    ]);

    if (!fundingResponse.ok) {
      console.warn(`OKX funding API returned ${fundingResponse.status} (likely geo-restricted from this region)`);
      return cache.get<FundingRateData[]>('funding:okx:stale') ?? [];
    }

    const fundingResult = await fundingResponse.json();
    const fundingData: OKXFundingInfo[] = fundingResult.data || [];
    
    const tickerResult = await tickerResponse.json();
    const tickers: OKXTicker[] = tickerResult.data || [];
    const tickerMap = new Map(tickers.map(t => [t.instId, t]));

    const now = Date.now();
    const rates: FundingRateData[] = fundingData
      .filter(f => f.instId.includes('-USDT-'))
      .map(f => {
        const rate = parseFloat(f.fundingRate);
        const annualized = rate * 3 * 365 * 100;
        const nextFunding = parseInt(f.nextFundingTime);
        const ticker = tickerMap.get(f.instId);
        
        // Convert OKX symbol format (BTC-USDT-SWAP -> BTCUSDT)
        const symbol = f.instId.replace('-USDT-SWAP', 'USDT');
        
        return {
          symbol,
          baseAsset: symbol.replace('USDT', ''),
          exchange: 'okx',
          fundingRate: rate * 100,
          fundingRateAnnualized: annualized,
          predictedRate: parseFloat(f.nextFundingRate) * 100,
          markPrice: ticker ? parseFloat(ticker.last) : 0,
          indexPrice: ticker ? parseFloat(ticker.last) : 0,
          nextFundingTime: nextFunding,
          timeUntilFunding: Math.max(0, nextFunding - now),
          openInterest: 0,
          volume24h: ticker ? parseFloat(ticker.volCcy24h) : 0,
          fundingInterval: FUNDING_INTERVALS.okx,
          lastUpdated: now,
        };
      });

    cache.set(cacheKey, rates, CACHE_TTL.funding);
    cache.set('funding:okx:stale', rates, 3600); // 1hr stale fallback
    return rates;
  } catch (error) {
    console.warn('OKX funding fetch failed (geo-restriction or network issue):', error instanceof Error ? error.message : error);
    return cache.get<FundingRateData[]>('funding:okx:stale') ?? [];
  }
}

// =============================================================================
// Hyperliquid Funding
// =============================================================================

interface HyperliquidMeta {
  universe: {
    name: string;
    szDecimals: number;
  }[];
}

interface HyperliquidAssetCtx {
  dayNtlVlm: string;
  funding: string;
  impactPxs: [string, string];
  markPx: string;
  midPx: string;
  openInterest: string;
  oraclePx: string;
  premium: string;
}

async function fetchHyperliquidFundingRates(): Promise<FundingRateData[]> {
  const cacheKey = 'funding:hyperliquid:all';
  const cached = cache.get<FundingRateData[]>(cacheKey);
  if (cached) return cached;

  try {
    const [metaResponse, assetCtxResponse] = await Promise.all([
      resilientFetchResponse('https://api.hyperliquid.xyz/info', {
        service: 'hyperliquid', timeoutMs: 8000, retries: 1,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta' }),
      }),
      resilientFetchResponse('https://api.hyperliquid.xyz/info', {
        service: 'hyperliquid', timeoutMs: 8000, retries: 1,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      }),
    ]);

    if (!metaResponse.ok || !assetCtxResponse.ok) {
      throw new Error('Hyperliquid API error');
    }

    const meta: HyperliquidMeta = await metaResponse.json();
    const assetCtxs: [HyperliquidMeta, HyperliquidAssetCtx[]] = await assetCtxResponse.json();
    
    const now = Date.now();
    const rates: FundingRateData[] = [];
    
    const contexts = assetCtxs[1] || [];
    meta.universe.forEach((asset, index) => {
      const ctx = contexts[index];
      if (!ctx) return;
      
      const rate = parseFloat(ctx.funding);
      // Hyperliquid has hourly funding
      const annualized = rate * 24 * 365 * 100;
      const markPrice = parseFloat(ctx.markPx);
      
      rates.push({
        symbol: `${asset.name}USDT`,
        baseAsset: asset.name,
        exchange: 'hyperliquid',
        fundingRate: rate * 100,
        fundingRateAnnualized: annualized,
        markPrice,
        indexPrice: parseFloat(ctx.oraclePx),
        nextFundingTime: now + 3600000, // Next hour
        timeUntilFunding: 3600000 - (now % 3600000),
        openInterest: parseFloat(ctx.openInterest) * markPrice,
        volume24h: parseFloat(ctx.dayNtlVlm),
        fundingInterval: FUNDING_INTERVALS.hyperliquid,
        lastUpdated: now,
      });
    });

    cache.set(cacheKey, rates, CACHE_TTL.funding);
    cache.set('funding:hyperliquid:stale', rates, 3600);
    return rates;
  } catch (error) {
    console.warn('Hyperliquid funding fetch failed:', error instanceof Error ? error.message : error);
    return cache.get<FundingRateData[]>('funding:hyperliquid:stale') ?? [];
  }
}

// =============================================================================
// Cross-Exchange Analysis
// =============================================================================

function calculateCrossExchangeFunding(
  allRates: FundingRateData[]
): CrossExchangeFunding[] {
  // Group by base asset
  const byAsset = new Map<string, FundingRateData[]>();
  
  for (const rate of allRates) {
    const existing = byAsset.get(rate.baseAsset) || [];
    existing.push(rate);
    byAsset.set(rate.baseAsset, existing);
  }

  const crossExchange: CrossExchangeFunding[] = [];

  for (const [asset, rates] of byAsset.entries()) {
    if (rates.length < 2) continue;
    
    // Sort by funding rate
    const sorted = [...rates].sort((a, b) => a.fundingRate - b.fundingRate);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    
    const spread = highest.fundingRate - lowest.fundingRate;
    // Calculate annualized spread based on funding intervals
    const avgInterval = (lowest.fundingInterval + highest.fundingInterval) / 2;
    const spreadAnnualized = spread * (24 / avgInterval) * 365;
    
    crossExchange.push({
      symbol: `${asset}USDT`,
      baseAsset: asset,
      exchanges: rates.map(r => ({
        exchange: r.exchange,
        rate: r.fundingRate,
        annualized: r.fundingRateAnnualized,
        nextFunding: r.nextFundingTime,
        markPrice: r.markPrice,
        openInterest: r.openInterest,
      })),
      spread,
      spreadAnnualized,
      arbitrageOpportunity: spread > 0.01, // 0.01% threshold
      direction: spread > 0.005 ? 'long-short' : spread < -0.005 ? 'short-long' : 'neutral',
      bestLong: lowest.exchange,
      bestShort: highest.exchange,
      timestamp: Date.now(),
    });
  }

  return crossExchange.sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread));
}

function findArbitrageOpportunities(
  crossExchange: CrossExchangeFunding[]
): FundingArbitrage[] {
  const opportunities: FundingArbitrage[] = [];

  for (const item of crossExchange) {
    if (!item.arbitrageOpportunity) continue;
    
    const longExchange = item.exchanges.reduce((min, e) => 
      e.rate < min.rate ? e : min
    );
    const shortExchange = item.exchanges.reduce((max, e) => 
      e.rate > max.rate ? e : max
    );
    
    const spread = shortExchange.rate - longExchange.rate;
    const annualizedYield = spread * 3 * 365; // Assuming 8hr funding
    const dailyYield = spread * 3;
    
    // Calculate risk and liquidity scores
    const combinedOI = longExchange.openInterest + shortExchange.openInterest;
    const liquidityScore = Math.min(100, combinedOI / 10000000); // $10M = 100
    
    // Risk factors
    const riskFactors: string[] = [];
    if (combinedOI < 1000000) riskFactors.push('Low liquidity');
    if (Math.abs(spread) > 0.1) riskFactors.push('Extreme spread - may be volatile');
    if (longExchange.exchange === 'dydx' || shortExchange.exchange === 'dydx') {
      riskFactors.push('dYdX has hourly funding - higher execution complexity');
    }
    
    const riskScore = Math.max(0, 100 - riskFactors.length * 20);
    const combinedScore = (annualizedYield * 0.4 + liquidityScore * 0.3 + riskScore * 0.3);

    opportunities.push({
      symbol: item.symbol,
      longExchange: longExchange.exchange,
      shortExchange: shortExchange.exchange,
      longRate: longExchange.rate,
      shortRate: shortExchange.rate,
      spread,
      annualizedYield,
      estimatedDailyYield: dailyYield,
      riskScore,
      liquidityScore,
      combinedScore,
      notes: riskFactors.length > 0 ? riskFactors : ['Healthy arbitrage opportunity'],
    });
  }

  return opportunities.sort((a, b) => b.combinedScore - a.combinedScore);
}

// =============================================================================
// Historical Funding Analysis
// =============================================================================

export async function getFundingHistory(
  symbol: string,
  exchange: string,
  limit = 100
): Promise<FundingHistory> {
  const cacheKey = `funding:history:${exchange}:${symbol}:${limit}`;
  const cached = cache.get<FundingHistory>(cacheKey);
  if (cached) return cached;

  const history: { timestamp: number; rate: number; markPrice: number }[] = [];

  try {
    switch (exchange) {
      case 'binance': {
        const response = await resilientFetchResponse(
          `${EXTERNAL_APIS.BINANCE_FUTURES}/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`,
      { service: 'binance-futures', timeoutMs: 8000, retries: 1 },
    );
        if (response.ok) {
          const data = await response.json();
          for (const item of data) {
            history.push({
              timestamp: item.fundingTime,
              rate: parseFloat(item.fundingRate) * 100,
              markPrice: parseFloat(item.markPrice || '0'),
            });
          }
        }
        break;
      }
      case 'bybit': {
        const response = await resilientFetchResponse(
          `${EXTERNAL_APIS.BYBIT}/market/funding/history?category=linear&symbol=${symbol}&limit=${limit}`,
      { service: 'bybit', timeoutMs: 8000, retries: 1 },
    );
        if (response.ok) {
          const result = await response.json();
          for (const item of result.result?.list || []) {
            history.push({
              timestamp: parseInt(item.fundingRateTimestamp),
              rate: parseFloat(item.fundingRate) * 100,
              markPrice: 0,
            });
          }
        }
        break;
      }
      default:
        throw new Error(`History not available for ${exchange}`);
    }
  } catch (error) {
    console.error(`Funding history fetch error for ${exchange}:${symbol}:`, error);
  }

  // Calculate statistics
  const rates = history.map(h => h.rate);
  const averageRate = rates.length > 0 
    ? rates.reduce((a, b) => a + b, 0) / rates.length 
    : 0;
  const maxRate = Math.max(...rates, 0);
  const minRate = Math.min(...rates, 0);
  
  // Volatility (standard deviation)
  const variance = rates.length > 0
    ? rates.reduce((sum, r) => sum + Math.pow(r - averageRate, 2), 0) / rates.length
    : 0;
  const volatility = Math.sqrt(variance);
  
  // Positive ratio
  const positiveCount = rates.filter(r => r > 0).length;
  const positiveRatio = rates.length > 0 ? positiveCount / rates.length : 0.5;

  const result: FundingHistory = {
    symbol,
    exchange,
    history: history.sort((a, b) => b.timestamp - a.timestamp),
    averageRate,
    maxRate,
    minRate,
    volatility,
    positiveRatio,
  };

  cache.set(cacheKey, result, CACHE_TTL.historical_7d);
  return result;
}

// =============================================================================
// Main Dashboard Function
// =============================================================================

export async function getFundingDashboard(): Promise<FundingDashboard> {
  const cacheKey = 'funding:dashboard';
  const cached = cache.get<FundingDashboard>(cacheKey);
  if (cached) return cached;

  // Fetch from all exchanges in parallel
  const [binanceRates, bybitRates, okxRates, hyperliquidRates] = await Promise.all([
    fetchBinanceFundingRates(),
    fetchBybitFundingRates(),
    fetchOKXFundingRates(),
    fetchHyperliquidFundingRates(),
  ]);

  const allRates = [...binanceRates, ...bybitRates, ...okxRates, ...hyperliquidRates];

  // Sort for top positive/negative
  const sortedByRate = [...allRates].sort((a, b) => b.fundingRate - a.fundingRate);
  const topPositive = sortedByRate.slice(0, 20);
  const topNegative = sortedByRate.slice(-20).reverse();

  // Cross-exchange analysis
  const crossExchange = calculateCrossExchangeFunding(allRates);
  const arbitrageOpportunities = findArbitrageOpportunities(crossExchange);

  // Market summary
  const totalOI = allRates.reduce((sum, r) => sum + r.openInterest, 0);
  const avgRate = allRates.length > 0
    ? allRates.reduce((sum, r) => sum + r.fundingRate, 0) / allRates.length
    : 0;
  
  const positiveCount = allRates.filter(r => r.fundingRate > 0).length;
  const bullishBias = allRates.length > 0 ? positiveCount / allRates.length : 0.5;

  // Exchange breakdown
  const exchangeBreakdown: Record<string, { avgRate: number; totalOI: number }> = {};
  const exchanges = ['binance', 'bybit', 'okx', 'hyperliquid'];
  
  for (const exchange of exchanges) {
    const exchangeRates = allRates.filter(r => r.exchange === exchange);
    if (exchangeRates.length > 0) {
      exchangeBreakdown[exchange] = {
        avgRate: exchangeRates.reduce((sum, r) => sum + r.fundingRate, 0) / exchangeRates.length,
        totalOI: exchangeRates.reduce((sum, r) => sum + r.openInterest, 0),
      };
    }
  }

  const dashboard: FundingDashboard = {
    topPositive,
    topNegative,
    arbitrageOpportunities,
    crossExchange: crossExchange.slice(0, 50),
    marketSummary: {
      averageRate: avgRate,
      totalOpenInterest: totalOI,
      bullishBias,
      exchangeBreakdown,
    },
    lastUpdated: new Date().toISOString(),
  };

  cache.set(cacheKey, dashboard, CACHE_TTL.funding);
  return dashboard;
}

// =============================================================================
// Funding Rate Alerts
// =============================================================================

export interface FundingAlert {
  symbol: string;
  exchange: string;
  alertType: 'extreme_positive' | 'extreme_negative' | 'arbitrage' | 'reversal';
  currentRate: number;
  threshold: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export function generateFundingAlerts(dashboard: FundingDashboard): FundingAlert[] {
  const alerts: FundingAlert[] = [];
  const now = Date.now();

  // Check for extreme funding rates
  for (const rate of dashboard.topPositive) {
    if (rate.fundingRate > 0.1) { // > 0.1% per 8hr
      alerts.push({
        symbol: rate.symbol,
        exchange: rate.exchange,
        alertType: 'extreme_positive',
        currentRate: rate.fundingRate,
        threshold: 0.1,
        message: `Extreme positive funding on ${rate.exchange}: ${rate.fundingRate.toFixed(4)}% (${rate.fundingRateAnnualized.toFixed(1)}% APR)`,
        severity: rate.fundingRate > 0.2 ? 'critical' : 'warning',
        timestamp: now,
      });
    }
  }

  for (const rate of dashboard.topNegative) {
    if (rate.fundingRate < -0.1) {
      alerts.push({
        symbol: rate.symbol,
        exchange: rate.exchange,
        alertType: 'extreme_negative',
        currentRate: rate.fundingRate,
        threshold: -0.1,
        message: `Extreme negative funding on ${rate.exchange}: ${rate.fundingRate.toFixed(4)}% (${rate.fundingRateAnnualized.toFixed(1)}% APR)`,
        severity: rate.fundingRate < -0.2 ? 'critical' : 'warning',
        timestamp: now,
      });
    }
  }

  // Check for arbitrage opportunities
  for (const arb of dashboard.arbitrageOpportunities.slice(0, 5)) {
    if (arb.annualizedYield > 50) { // > 50% APR
      alerts.push({
        symbol: arb.symbol,
        exchange: `${arb.longExchange}/${arb.shortExchange}`,
        alertType: 'arbitrage',
        currentRate: arb.spread,
        threshold: 0.05,
        message: `Funding arbitrage: Long ${arb.longExchange} (${arb.longRate.toFixed(4)}%) / Short ${arb.shortExchange} (${arb.shortRate.toFixed(4)}%) = ${arb.annualizedYield.toFixed(1)}% APR`,
        severity: arb.annualizedYield > 100 ? 'critical' : 'warning',
        timestamp: now,
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
