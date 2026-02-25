import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GeckoTerminal API — DEX pair data from 100+ networks
 *
 * GET /api/geckoterminal                         — trending pools on Ethereum
 * GET /api/geckoterminal?network=solana           — trending pools on Solana
 * GET /api/geckoterminal?type=new                 — newly deployed pools
 * GET /api/geckoterminal?network=eth&dex=uniswap_v3 — top pools on a specific DEX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') ?? 'eth';
    const type = searchParams.get('type') ?? 'trending';
    const dex = searchParams.get('dex');

    let url: string;

    if (dex) {
      url = `https://api.geckoterminal.com/api/v2/networks/${network}/dexes/${dex}/pools?sort=h24_volume_usd_liquidity_desc`;
    } else if (type === 'new') {
      url = `https://api.geckoterminal.com/api/v2/networks/${network}/new_pools`;
    } else {
      url = `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `GeckoTerminal API error: ${response.status}` },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const json = await response.json();
    const pools = (json?.data ?? []).map((pool: Record<string, unknown>) => {
      const attrs = pool.attributes as Record<string, unknown> ?? {};
      return {
        id: pool.id,
        name: attrs.name,
        address: attrs.address,
        baseTokenPriceUsd: attrs.base_token_price_usd,
        quoteTokenPriceUsd: attrs.quote_token_price_usd,
        fdvUsd: attrs.fdv_usd,
        marketCapUsd: attrs.market_cap_usd,
        priceChange: attrs.price_change_percentage,
        volume: attrs.volume_usd,
        reserveUsd: attrs.reserve_in_usd,
      };
    });

    return NextResponse.json({
      network,
      type,
      count: pools.length,
      data: pools,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch DEX data', message: String(error) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
