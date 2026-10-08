/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockWhaleAlerts } = vi.hoisted(() => ({ mockWhaleAlerts: vi.fn() }));

vi.mock('@/app/api/whale-alerts/route', () => ({ GET: mockWhaleAlerts }));

import { GET } from './route';
import { cache, staleCache } from '@/lib/cache';

const syntheticAlert = {
  id: 'synthetic-1',
  blockchain: 'SyntheticChain',
  symbol: 'ZQX',
  amount: 10,
  amountUsd: 2_500_000,
  from: { address: '0xsyntheticfromaddress000000', owner: 'Synthetic Exchange' },
  to: { address: '0xsynthetictoaddress00000000' },
  hash: '0xsynthetichash',
  timestamp: 1_791_433_888_000,
  transactionType: 'exchange_withdrawal',
  significance: 'normal',
};

function alertsResponse() {
  return NextResponse.json({ alerts: [syntheticAlert], summary: { totalTransactions: 1 } });
}

function makeRequest(query = '?limit=10') {
  return new NextRequest(`http://localhost/api/whales${query}`);
}

describe('GET /api/whales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
    staleCache.clear();
  });

  it('calls whale-alerts in process and maps min_usd onto its minValue parameter', async () => {
    mockWhaleAlerts.mockResolvedValueOnce(alertsResponse());

    const response = await GET(makeRequest('?limit=10&min_usd=2000000'));

    expect(response.status).toBe(200);
    const forwarded = new URL((mockWhaleAlerts.mock.calls[0][0] as NextRequest).url);
    expect(forwarded.pathname).toBe('/api/whale-alerts');
    expect(forwarded.searchParams.get('minValue')).toBe('2000000');
    expect(forwarded.searchParams.get('limit')).toBe('10');

    const body = await response.json();
    expect(body.alerts[0]).toMatchObject({
      usd_value: 2_500_000,
      from: 'Synthetic Exchange',
      to: '0xsyntheti...',
    });
    expect(body.min_usd).toBe(2_000_000);
  });

  it('defaults a missing or malformed limit and min_usd instead of forwarding NaN', async () => {
    mockWhaleAlerts.mockResolvedValueOnce(alertsResponse());

    await GET(makeRequest('?limit=abc&min_usd=-5'));

    const forwarded = new URL((mockWhaleAlerts.mock.calls[0][0] as NextRequest).url);
    expect(forwarded.searchParams.get('limit')).toBe('10');
    expect(forwarded.searchParams.get('minValue')).toBe('1000000');
  });

  it('answers 502 with Retry-After, not 500, when the alert sources fail', async () => {
    mockWhaleAlerts.mockResolvedValueOnce(NextResponse.json({ error: 'upstream' }, { status: 500 }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(makeRequest());

    expect(response.status).toBe(502);
    expect(response.headers.get('Retry-After')).toBe('60');
    error.mockRestore();
  });

  it('serves the last good alerts when the sources fail after a success', async () => {
    mockWhaleAlerts.mockResolvedValueOnce(alertsResponse());
    await GET(makeRequest());

    cache.clear();
    mockWhaleAlerts.mockRejectedValueOnce(new Error('upstream down'));
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect((await response.json()).alerts).toHaveLength(1);
  });

  it('reuses alerts for repeat requests inside the cache window', async () => {
    mockWhaleAlerts.mockResolvedValue(alertsResponse());

    await GET(makeRequest());
    await GET(makeRequest());

    expect(mockWhaleAlerts).toHaveBeenCalledTimes(1);
  });
});
