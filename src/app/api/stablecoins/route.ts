import { NextRequest, NextResponse } from 'next/server';
import { getStablecoins } from '@/lib/apis/defillama';
import { registry } from '@/lib/providers/registry';
import type { StablecoinFlow } from '@/lib/providers/adapters/stablecoin-flows';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Stablecoins API — Stablecoin supply and chain distribution
 *
 * Uses provider framework (DefiLlama + Glassnode + Artemis + Dune + CryptoQuant)
 * with circuit breakers and caching, falling back to direct DefiLlama fetch.
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

    // Chain breakdown mode — direct fetch (not covered by provider chain)
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

    // Layer 1: Provider framework (broadcast across DefiLlama, Glassnode, Artemis, Dune, CryptoQuant)
    try {
      const result = await registry.fetch<StablecoinFlow[]>('stablecoin-flows', { limit });
      const flows = result.data.slice(0, limit);

      const assets = flows.map((f, i) => ({
        rank: f.rank || i + 1,
        name: f.name,
        symbol: f.symbol,
        pegType: f.pegType,
        circulatingUsd: f.circulatingUsd,
        price: f.price,
        chains: f.chainDistribution.map(c => c.chain),
      }));

      const totalMarketCap = assets.reduce((sum, a) => sum + a.circulatingUsd, 0);

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
          'X-Provider': result.lineage.provider,
          'X-Cache': result.cached ? 'HIT' : 'MISS',
        },
      });
    } catch { /* provider chain miss — fall through to direct fetch */ }

    // Layer 2: Direct DefiLlama fallback (legacy)
    const stablecoins = await getStablecoins();
    const assets = stablecoins.slice(0, limit).map((a, i) => {
      const circ = a.circulating ?? {};
      return {
        rank: i + 1,
        name: a.name,
        symbol: a.symbol,
        pegType: a.pegType,
        circulatingUsd: circ.peggedUSD ?? circ.peggedEUR ?? 0,
        price: a.price,
        chains: Object.keys(a.circulating),
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
        'X-Cache': 'DIRECT',
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
