/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const quote = { usd: 1, usd_24h_change: 0, usd_market_cap: 1, usd_24h_vol: 1 };

describe('GET /api/prices', () => {
  let requestedUrls: string[];

  beforeEach(() => {
    requestedUrls = [];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input instanceof Request ? input.url : input);
      requestedUrls.push(url);
      const ids = new URL(url).searchParams.get('ids')?.split(',') ?? [];
      return new Response(JSON.stringify(Object.fromEntries(ids.map((id) => [id, quote]))), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the default large caps when coins is omitted instead of answering 400', async () => {
    const response = await GET(new NextRequest('http://localhost/api/prices'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bitcoin).toEqual(quote);
    expect(body.ethereum).toEqual(quote);
    expect(Object.keys(body)).toHaveLength(20);
  });

  it('returns only the requested coins', async () => {
    const response = await GET(new NextRequest('http://localhost/api/prices?coins=Solana, dogecoin'));

    expect(response.status).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual(['dogecoin', 'solana']);
  });
});
