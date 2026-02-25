import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Funding Rates API Proxy
 *
 * Proxies requests to the Binance Futures premiumIndex endpoint server-side
 * to avoid CORS errors when calling fapi.binance.com directly from the browser.
 */
export async function GET() {
  try {
    const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex', {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Binance API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Funding rates proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' },
      { status: 500 }
    );
  }
}
