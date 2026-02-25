import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Stablecoins API — Stablecoin supply and chain distribution
 *
 * Powered by DefiLlama Stablecoins (free, no API key).
 *
 * GET /api/stablecoins                — all stablecoins ranked by market cap
 * GET /api/stablecoins?chains=true     — per-chain stablecoin breakdown
 * GET /api/stablecoins?limit=10        — top 10 stablecoins
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showChains = searchParams.get('chains') === 'true';
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    if (showChains) {
      const response = await fetch('https://stablecoins.llama.fi/stablecoinchains');
      if (!response.ok) {
        return NextResponse.json({ error: `API error: ${response.status}` }, { status: 502, headers: CORS_HEADERS });
      }

      const chains = await response.json();
      return NextResponse.json({
        type: 'chain-breakdown',
        count: Array.isArray(chains) ? chains.length : 0,
        data: chains,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const response = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 502, headers: CORS_HEADERS });
    }

    const json = await response.json();
    const assets = (json?.peggedAssets ?? []).slice(0, limit).map((a: Record<string, unknown>, i: number) => {
      const circ = a.circulating as Record<string, number> ?? {};
      return {
        rank: i + 1,
        name: a.name,
        symbol: a.symbol,
        pegType: a.pegType,
        circulatingUsd: circ.peggedUSD ?? circ.peggedEUR ?? 0,
        price: a.price,
        chains: a.chains,
      };
    });

    // Calculate total market cap
    const totalMarketCap = assets.reduce((sum: number, a: { circulatingUsd: number }) => sum + a.circulatingUsd, 0);

    return NextResponse.json({
      type: 'stablecoins',
      totalMarketCap,
      count: assets.length,
      data: assets,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stablecoin data', message: String(error) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
