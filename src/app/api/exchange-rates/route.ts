import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 minutes

/**
 * GET /api/exchange-rates
 *
 * Proxies CoinGecko exchange rates so client components never call
 * external APIs directly from the browser.
 */
export async function GET() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/exchange_rates', {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
