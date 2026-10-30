/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

/** Payloads in the shapes the real routes return. */
const ROUTES: Record<string, unknown> = {
  '/api/sentiment': {
    market: { overall: 'bearish', score: -40, confidence: 70, summary: '', keyDrivers: [] },
  },
  '/api/fear-greed': { current: { value: 22, valueClassification: 'Extreme Fear' } },
  '/api/breaking': { articles: [{ title: 'a' }, { title: 'b' }], totalCount: 7 },
};

describe('GET /api/oracle/chainlink', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input instanceof Request ? input.url : input));
      const payload = ROUTES[url.pathname];
      return payload ? Response.json(payload) : Response.json({}, { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the live fear/greed value, breaking count and a 0-100 sentiment', async () => {
    const body = await (await GET(new NextRequest('http://localhost/api/oracle/chainlink'))).json();

    expect(body.data).toMatchObject({
      sentiment: 30,
      fearGreed: 22,
      breakingNewsCount: 7,
      topNarrative: 'NEUTRAL',
    });
  });

  it('packs a bearish market into an unsigned value', async () => {
    const body = await (
      await GET(new NextRequest('http://localhost/api/oracle/chainlink?format=packed'))
    ).json();

    const packed = BigInt(body.result ?? body.data?.packed ?? body.data?.result);
    expect(packed >= 0n).toBe(true);
    expect(Number(packed >> 56n)).toBe(30);
  });
});
