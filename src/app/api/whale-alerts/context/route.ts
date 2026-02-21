/**
 * GET /api/whale-alerts/context
 *
 * Returns an AI-generated plain-language interpretation for a whale transaction.
 *
 * Query params:
 *   coin      — ticker symbol, e.g. "BTC"
 *   amount    — token amount, e.g. "2400"
 *   amountUsd — USD value, e.g. "230000000"
 *   type      — one of: transfer | exchange_inflow | exchange_outflow | mint | burn
 *   from      — (optional) source label
 *   to        — (optional) destination label
 *
 * Response: { context: string, cached: boolean }
 * Rate limit: 30 requests / minute per IP (in-memory, no Redis)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhaleContext, WhaleTxType } from '@/lib/whaleContext';

// ---------------------------------------------------------------------------
// In-memory rate limiter (30 req / 60 s per IP)
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

const rateLimitMap = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  const hits = (rateLimitMap.get(ip) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  rateLimitMap.set(ip, hits);

  // Periodically prune stale IPs to prevent memory growth
  if (rateLimitMap.size > 10_000) {
    for (const [key, timestamps] of rateLimitMap) {
      if (timestamps[timestamps.length - 1] < windowStart) {
        rateLimitMap.delete(key);
      }
    }
  }

  return hits.length > RATE_MAX;
}

// ---------------------------------------------------------------------------
// Allowed transaction types
// ---------------------------------------------------------------------------

const VALID_TYPES = new Set<WhaleTxType>([
  'transfer',
  'exchange_inflow',
  'exchange_outflow',
  'mint',
  'burn',
]);

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limit check
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Limit: 30 per minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_MAX),
          'X-RateLimit-Window': '60s',
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);

  const coin = searchParams.get('coin')?.trim().toUpperCase();
  const amountRaw = searchParams.get('amount');
  const amountUsdRaw = searchParams.get('amountUsd');
  const type = searchParams.get('type') as WhaleTxType | null;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  // Validate required params
  if (!coin) {
    return NextResponse.json({ error: 'Missing required param: coin' }, { status: 400 });
  }
  if (!amountRaw || isNaN(Number(amountRaw))) {
    return NextResponse.json({ error: 'Missing or invalid param: amount' }, { status: 400 });
  }
  if (!amountUsdRaw || isNaN(Number(amountUsdRaw))) {
    return NextResponse.json({ error: 'Missing or invalid param: amountUsd' }, { status: 400 });
  }
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Missing or invalid param: type. Allowed: ${[...VALID_TYPES].join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await getWhaleContext({
      coin,
      amount: Number(amountRaw),
      amountUsd: Number(amountUsdRaw),
      type,
      from,
      to,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('[whale-alerts/context] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
