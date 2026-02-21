import { NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE } from '@/lib/constants';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/exchange-rates/convert
 * Convert between currencies using CoinGecko exchange rates.
 * Query params:
 *   - from: source currency (e.g. "btc", "eth", "usd") — required
 *   - to: target currency (e.g. "usd", "eur", "btc") — required
 *   - amount: number to convert (default 1)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from')?.toLowerCase();
    const to = searchParams.get('to')?.toLowerCase();
    const amount = parseFloat(searchParams.get('amount') || '1');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing parameters', message: "'from' and 'to' query params are required" },
        { status: 400 },
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount', message: "'amount' must be a positive number" },
        { status: 400 },
      );
    }

    // Fetch exchange rates from CoinGecko
    const res = await fetch(`${COINGECKO_BASE}/exchange_rates`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates', message: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const rates: Record<string, { name: string; unit: string; value: number; type: string }> =
      data.rates || {};

    // CoinGecko rates are denominated in BTC (btc value = 1)
    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate) {
      return NextResponse.json(
        { error: 'Unknown currency', message: `Currency '${from}' not found in exchange rates` },
        { status: 404 },
      );
    }

    if (!toRate) {
      return NextResponse.json(
        { error: 'Unknown currency', message: `Currency '${to}' not found in exchange rates` },
        { status: 404 },
      );
    }

    // Convert: amount in 'from' → BTC → 'to'
    // fromRate.value = how many units of 'from' per 1 BTC
    // toRate.value = how many units of 'to' per 1 BTC
    const rate = toRate.value / fromRate.value;
    const result = amount * rate;

    return NextResponse.json(
      {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount,
        result,
        rate,
        fromName: fromRate.name,
        toName: toRate.name,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to convert currency', message: String(error) },
      { status: 500 },
    );
  }
}
