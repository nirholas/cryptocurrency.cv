import { NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE } from '@/lib/constants';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/oracle/prices
 * Returns oracle-verified price feeds for major crypto assets.
 * Aggregates data from CoinGecko (reliable price source) in a format
 * suitable for on-chain oracle consumption or verification.
 * Query params:
 *   - assets: comma-separated coin IDs (default 'bitcoin,ethereum,binancecoin,solana,ripple')
 *   - currency: vs_currency (default 'usd')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetsParam =
      searchParams.get('assets') || 'bitcoin,ethereum,binancecoin,solana,ripple';
    const currency = (searchParams.get('currency') || 'usd').toLowerCase();
    const assets = assetsParam
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 50);

    if (assets.length === 0) {
      return NextResponse.json(
        { error: 'No assets specified', message: "Provide 'assets' as comma-separated coin IDs" },
        { status: 400 },
      );
    }

    const ids = assets.join(',');
    const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${currency}&include_last_updated_at=true&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch oracle prices', message: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const timestamp = Math.floor(Date.now() / 1000);

    // Format into oracle-friendly structure
    const prices: Record<
      string,
      {
        price: number;
        change24h: number | null;
        volume24h: number | null;
        marketCap: number | null;
        lastUpdated: number;
        currency: string;
      }
    > = {};

    for (const [coinId, values] of Object.entries(data)) {
      const v = values as Record<string, number>;
      prices[coinId] = {
        price: v[currency] ?? 0,
        change24h: v[`${currency}_24h_change`] ?? null,
        volume24h: v[`${currency}_24h_vol`] ?? null,
        marketCap: v[`${currency}_market_cap`] ?? null,
        lastUpdated: v.last_updated_at ?? timestamp,
        currency,
      };
    }

    return NextResponse.json(
      {
        oracle: 'free-crypto-news',
        version: '1.0',
        timestamp,
        currency,
        prices,
        assetsRequested: assets.length,
        assetsReturned: Object.keys(prices).length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch oracle prices', message: String(error) },
      { status: 500 },
    );
  }
}
