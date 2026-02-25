import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Hyperliquid API — Decentralized perpetual exchange data
 *
 * Returns all perpetual markets with live funding rates, open interest,
 * mark prices, and oracle prices. No API key required.
 *
 * GET /api/hyperliquid
 * GET /api/hyperliquid?type=funding   — funding rates only
 * GET /api/hyperliquid?type=oi        — open interest only
 * GET /api/hyperliquid?symbol=BTC     — filter by symbol
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'all';
    const symbolFilter = searchParams.get('symbol')?.toUpperCase();

    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Hyperliquid API error: ${response.status}` },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const [meta, contexts] = await response.json();
    const universe = meta?.universe ?? [];

    let markets = universe.map((market: { name: string; maxLeverage: number }, i: number) => {
      const ctx = contexts[i] ?? {};
      const oraclePx = parseFloat(ctx.oraclePx ?? '0');
      const markPx = parseFloat(ctx.markPx ?? '0');
      const oi = parseFloat(ctx.openInterest ?? '0');

      return {
        symbol: market.name,
        maxLeverage: market.maxLeverage,
        oraclePrice: oraclePx,
        markPrice: markPx,
        fundingRate: parseFloat(ctx.funding ?? '0'),
        openInterest: oi,
        openInterestUsd: oi * oraclePx,
        volume24h: parseFloat(ctx.dayNtlVlm ?? '0'),
        premium: parseFloat(ctx.premium ?? '0'),
      };
    });

    if (symbolFilter) {
      markets = markets.filter((m: { symbol: string }) => m.symbol.includes(symbolFilter));
    }

    if (type === 'funding') {
      markets = markets.map((m: Record<string, unknown>) => ({
        symbol: m.symbol,
        fundingRate: m.fundingRate,
        markPrice: m.markPrice,
      }));
    } else if (type === 'oi') {
      markets = markets.map((m: Record<string, unknown>) => ({
        symbol: m.symbol,
        openInterest: m.openInterest,
        openInterestUsd: m.openInterestUsd,
      }));
    }

    return NextResponse.json({
      exchange: 'hyperliquid',
      count: markets.length,
      data: markets,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Hyperliquid data', message: String(error) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
