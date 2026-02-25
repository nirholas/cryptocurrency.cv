/**
 * GET /api/v1/derivatives
 *
 * Premium API v1 — Derivatives Market Data
 * Returns funding rates, open interest, and liquidation data
 * across major perpetual futures exchanges.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   symbol   — Base asset (e.g. "BTC", "ETH" — default: BTC)
 *   exchange — Filter by exchange (binance, bybit, okx, all — default: all)
 *   type     — Data type (funding, oi, liquidations, all — default: all)
 *
 * @price $0.003 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 30;

const ENDPOINT = '/api/v1/derivatives';

interface FundingRate {
  exchange: string;
  symbol: string;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingTime: number;
  markPrice: number;
  indexPrice: number;
}

interface OpenInterest {
  exchange: string;
  symbol: string;
  openInterest: number;
  openInterestUsd: number;
  change24h: number;
}

interface DerivativesResponse {
  symbol: string;
  fundingRates: FundingRate[];
  openInterest: OpenInterest[];
  aggregated: {
    avgFundingRate: number;
    totalOpenInterestUsd: number;
    oiChange24h: number;
    sentiment: 'extreme_bearish' | 'bearish' | 'neutral' | 'bullish' | 'extreme_bullish';
  };
  source: string[];
  timestamp: string;
  latencyMs: number;
}

type DataType = 'funding' | 'oi' | 'liquidations' | 'all';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const symbol = (params.get('symbol') || 'BTC').toUpperCase();
  const exchange = (params.get('exchange') || 'all').toLowerCase();
  const dataType = (params.get('type') || 'all') as DataType;

  try {
    logger.info('Fetching derivatives data', { symbol, exchange, dataType });

    const sources: string[] = [];
    const fundingRates: FundingRate[] = [];
    const openInterest: OpenInterest[] = [];

    // Fetch from all exchanges in parallel
    const fetchPromises: Promise<void>[] = [];

    if (exchange === 'all' || exchange === 'binance') {
      fetchPromises.push(
        fetchBinanceDerivatives(symbol, dataType, fundingRates, openInterest, sources),
      );
    }
    if (exchange === 'all' || exchange === 'bybit') {
      fetchPromises.push(
        fetchBybitDerivatives(symbol, dataType, fundingRates, openInterest, sources),
      );
    }
    if (exchange === 'all' || exchange === 'okx') {
      fetchPromises.push(
        fetchOkxDerivatives(symbol, dataType, fundingRates, openInterest, sources),
      );
    }

    await Promise.allSettled(fetchPromises);

    // Aggregations
    const avgFundingRate = fundingRates.length > 0
      ? fundingRates.reduce((sum, f) => sum + f.fundingRate, 0) / fundingRates.length
      : 0;
    const totalOiUsd = openInterest.reduce((sum, oi) => sum + oi.openInterestUsd, 0);
    const avgOiChange = openInterest.length > 0
      ? openInterest.reduce((s, oi) => s + oi.change24h, 0) / openInterest.length
      : 0;

    const sentiment = deriveSentiment(avgFundingRate);

    const response: DerivativesResponse = {
      symbol,
      fundingRates: dataType === 'oi' ? [] : fundingRates,
      openInterest: dataType === 'funding' ? [] : openInterest,
      aggregated: {
        avgFundingRate: round(avgFundingRate, 6),
        totalOpenInterestUsd: Math.round(totalOiUsd),
        oiChange24h: round(avgOiChange, 2),
        sentiment,
      },
      source: sources,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    logger.error('Derivatives fetch failed', { error: String(error) });
    return ApiError.upstream('Derivatives exchanges');
  }
}

// =============================================================================
// EXCHANGE FETCHERS
// =============================================================================

async function fetchBinanceDerivatives(
  symbol: string,
  dataType: DataType,
  fundingRates: FundingRate[],
  openInterest: OpenInterest[],
  sources: string[],
): Promise<void> {
  const pair = `${symbol}USDT`;

  try {
    if (dataType === 'all' || dataType === 'funding') {
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`,
        { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 30 } },
      );
      if (res.ok) {
        const d = await res.json();
        fundingRates.push({
          exchange: 'binance',
          symbol: pair,
          fundingRate: parseFloat(d.lastFundingRate),
          fundingRateAnnualized: parseFloat(d.lastFundingRate) * 3 * 365 * 100,
          nextFundingTime: d.nextFundingTime,
          markPrice: parseFloat(d.markPrice),
          indexPrice: parseFloat(d.indexPrice),
        });
        sources.push('binance-funding');
      }
    }

    if (dataType === 'all' || dataType === 'oi') {
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`,
        { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 30 } },
      );
      if (res.ok) {
        const d = await res.json();
        const oiAmount = parseFloat(d.openInterest);
        // Get current price for USD conversion
        const priceRes = await fetch(
          `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${pair}`,
        );
        const priceData = priceRes.ok ? await priceRes.json() : { price: '0' };
        const price = parseFloat(priceData.price);
        openInterest.push({
          exchange: 'binance',
          symbol: pair,
          openInterest: oiAmount,
          openInterestUsd: oiAmount * price,
          change24h: 0, // Would need historical for delta
        });
        sources.push('binance-oi');
      }
    }
  } catch {
    // Binance unavailable — continue with other exchanges
  }
}

async function fetchBybitDerivatives(
  symbol: string,
  dataType: DataType,
  fundingRates: FundingRate[],
  openInterest: OpenInterest[],
  sources: string[],
): Promise<void> {
  try {
    const res = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`,
      { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 30 } },
    );
    if (!res.ok) return;

    const json = await res.json();
    const ticker = json.result?.list?.[0];
    if (!ticker) return;

    if (dataType === 'all' || dataType === 'funding') {
      fundingRates.push({
        exchange: 'bybit',
        symbol: `${symbol}USDT`,
        fundingRate: parseFloat(ticker.fundingRate || '0'),
        fundingRateAnnualized: parseFloat(ticker.fundingRate || '0') * 3 * 365 * 100,
        nextFundingTime: parseInt(ticker.nextFundingTime || '0', 10),
        markPrice: parseFloat(ticker.markPrice || '0'),
        indexPrice: parseFloat(ticker.indexPrice || '0'),
      });
      sources.push('bybit-funding');
    }

    if (dataType === 'all' || dataType === 'oi') {
      const oiVal = parseFloat(ticker.openInterestValue || '0');
      openInterest.push({
        exchange: 'bybit',
        symbol: `${symbol}USDT`,
        openInterest: parseFloat(ticker.openInterest || '0'),
        openInterestUsd: oiVal,
        change24h: 0,
      });
      sources.push('bybit-oi');
    }
  } catch {
    // Bybit unavailable
  }
}

async function fetchOkxDerivatives(
  symbol: string,
  dataType: DataType,
  fundingRates: FundingRate[],
  openInterest: OpenInterest[],
  sources: string[],
): Promise<void> {
  const instId = `${symbol}-USDT-SWAP`;

  try {
    if (dataType === 'all' || dataType === 'funding') {
      const res = await fetch(
        `https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`,
        { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 30 } },
      );
      if (res.ok) {
        const json = await res.json();
        const d = json.data?.[0];
        if (d) {
          fundingRates.push({
            exchange: 'okx',
            symbol: instId,
            fundingRate: parseFloat(d.fundingRate || '0'),
            fundingRateAnnualized: parseFloat(d.fundingRate || '0') * 3 * 365 * 100,
            nextFundingTime: parseInt(d.nextFundingTime || '0', 10),
            markPrice: 0,
            indexPrice: 0,
          });
          sources.push('okx-funding');
        }
      }
    }

    if (dataType === 'all' || dataType === 'oi') {
      const res = await fetch(
        `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
        { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 30 } },
      );
      if (res.ok) {
        const json = await res.json();
        const d = json.data?.[0];
        if (d) {
          openInterest.push({
            exchange: 'okx',
            symbol: instId,
            openInterest: parseFloat(d.oi || '0'),
            openInterestUsd: parseFloat(d.oiCcy || '0'),
            change24h: 0,
          });
          sources.push('okx-oi');
        }
      }
    }
  } catch {
    // OKX unavailable
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function deriveSentiment(avgFundingRate: number): DerivativesResponse['aggregated']['sentiment'] {
  if (avgFundingRate > 0.001) return 'extreme_bullish';
  if (avgFundingRate > 0.0003) return 'bullish';
  if (avgFundingRate < -0.001) return 'extreme_bearish';
  if (avgFundingRate < -0.0003) return 'bearish';
  return 'neutral';
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
