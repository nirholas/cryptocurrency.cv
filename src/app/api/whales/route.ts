/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as getWhaleAlerts } from '@/app/api/whale-alerts/route';
import { cache, generateCacheKey, withCache } from '@/lib/cache';

export const revalidate = 60;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_MIN_USD = 1_000_000;
/** Matches the 60s data-cache lifetime the old HTTP self-fetch had. */
const ALERTS_TTL_SECONDS = 60;

interface WhaleAlert {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: { address: string; owner?: string };
  to: { address: string; owner?: string };
  hash: string;
  timestamp: number;
  transactionType: string;
  significance: string;
}

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function parseMinUsd(raw: string | null): number {
  const parsed = Number(raw);
  if (raw === null || raw.trim() === '' || !Number.isFinite(parsed) || parsed < 0) return DEFAULT_MIN_USD;
  return Math.floor(parsed);
}

interface WhaleAlertsPayload {
  alerts?: WhaleAlert[];
  summary?: unknown;
}

async function loadAlerts(requestUrl: string, limit: number, minUsd: number): Promise<WhaleAlertsPayload> {
  const alertsUrl = new URL('/api/whale-alerts', requestUrl);
  alertsUrl.searchParams.set('limit', String(limit));
  alertsUrl.searchParams.set('minValue', String(minUsd));

  const response = await getWhaleAlerts(new NextRequest(alertsUrl));
  if (!response.ok) throw new Error(`whale-alerts answered ${response.status}`);
  return response.json();
}

function describeParty(party: { address?: string; owner?: string } | undefined): string {
  if (party?.owner) return party.owner;
  if (party?.address) return `${party.address.slice(0, 10)}...`;
  return 'unknown';
}

/**
 * GET /api/whales
 *
 * MCP-friendly view of /api/whale-alerts. The alerts handler is called in
 * process: this route used to fetch it back through the public load balancer,
 * where the sub-request arrived as an anonymous client from the container's
 * egress IP, drew 429 and 403 from the rate limiter, and every one of those
 * surfaced to the caller as a 500.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get('limit'));
  const minUsd = parseMinUsd(searchParams.get('min_usd'));

  let data: WhaleAlertsPayload;
  try {
    data = await withCache(cache, generateCacheKey('whales', { limit, minUsd }), ALERTS_TTL_SECONDS, () =>
      loadAlerts(request.url, limit, minUsd),
    );
  } catch (error) {
    console.error('Whales API error:', error);
    return NextResponse.json(
      { error: 'Whale alert sources are temporarily unavailable. Please retry shortly.' },
      { status: 502, headers: { 'Retry-After': '60' } },
    );
  }

  return NextResponse.json(
    {
      alerts: (data.alerts || []).map((alert) => ({
        hash: alert.hash,
        blockchain: alert.blockchain,
        symbol: alert.symbol,
        amount: alert.amount,
        usd_value: alert.amountUsd,
        from: describeParty(alert.from),
        to: describeParty(alert.to),
        type: alert.transactionType,
        significance: alert.significance,
        timestamp: alert.timestamp,
      })),
      summary: data.summary,
      min_usd: minUsd,
      timestamp: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    },
  );
}
