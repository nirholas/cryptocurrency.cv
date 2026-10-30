/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

/** Payloads in the shapes the real routes return. */
const ROUTES: Record<string, unknown> = {
  '/api/prices': {
    ripple: { usd: 2.5, usd_24h_change: -1.234, usd_market_cap: 1, usd_24h_vol: 1 },
  },
  '/api/fear-greed': {
    current: { value: 22, valueClassification: 'Extreme Fear', timestamp: 0 },
  },
  '/api/sentiment': {
    articles: [],
    market: { overall: 'bearish', score: -40, confidence: 70, summary: '', keyDrivers: [] },
    distribution: { very_bullish: 1, bullish: 1, neutral: 2, bearish: 4, very_bearish: 2 },
  },
};

function intent(name: string, slots: Record<string, { value: string }> = {}): NextRequest {
  return new NextRequest('http://localhost/api/alexa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version: '1.0', request: { type: 'IntentRequest', intent: { name, slots } } }),
  });
}

async function speech(name: string, slots?: Record<string, { value: string }>): Promise<string> {
  const body = await (await POST(intent(name, slots))).json();
  return body.response.outputSpeech.text;
}

describe('POST /api/alexa', () => {
  let requested: URL[];

  beforeEach(() => {
    requested = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input instanceof Request ? input.url : input));
      requested.push(url);
      const payload = ROUTES[url.pathname];
      return payload
        ? Response.json(payload)
        : Response.json({ error: 'not found' }, { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prices a spoken ticker through its CoinGecko id', async () => {
    const text = await speech('PriceIntent', { coin: { value: 'XRP' } });

    expect(requested[0].searchParams.get('coins')).toBe('ripple');
    expect(text).toBe('XRP is currently at 2.5 dollars, down 1.23 percent in the last 24 hours.');
  });

  it('reads the current Fear and Greed value instead of defaulting to 50', async () => {
    const text = await speech('FearGreedIntent');

    expect(text).toMatch(/^The Fear and Greed Index is at 22, indicating Extreme Fear\./);
  });

  it('describes market sentiment from the score and article distribution', async () => {
    const text = await speech('MarketSentimentIntent');

    expect(text).toBe(
      'The current market sentiment is bearish with a score of -40 on a scale from -100 to 100. 20% of articles are bullish, and 60% are bearish.',
    );
  });
});
