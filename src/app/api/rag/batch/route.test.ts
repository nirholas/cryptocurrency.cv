import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const askFast = vi.hoisted(() => vi.fn());
vi.mock('@/lib/rag/ultimate-rag-service', () => ({ askFast }));

import { POST } from './route';

let client = 0;

function batch(body: string) {
  client += 1;
  return new NextRequest('http://localhost/api/rag/batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${client}` },
    body,
  });
}

describe('POST /api/rag/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await POST(batch('{"queries":'));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON');
    expect(askFast).not.toHaveBeenCalled();
  });

  it('does not echo the internal error message of a failed query', async () => {
    askFast.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.7:6333 (qdrant secret-key=abc)'));

    const res = await POST(batch(JSON.stringify({ queries: ['what moved bitcoin today?'] })));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).not.toContain('ECONNREFUSED');
    expect(text).not.toContain('secret-key');
    expect(JSON.parse(text).results[0]).toMatchObject({ status: 'error', error: 'Query failed' });
  });

  it('keeps input order and gives duplicate queries their own results', async () => {
    let call = 0;
    askFast.mockImplementation(async (query: string) => {
      const n = ++call;
      await new Promise((resolve) => setTimeout(resolve, n === 1 ? 20 : 0));
      if (n === 2) throw new Error('boom');
      return { answer: `${query}#${n}` };
    });

    const res = await POST(
      batch(JSON.stringify({ queries: ['eth price', 'eth price', 'btc price'], options: { parallelism: 3 } })),
    );
    const { results, summary } = await res.json();

    expect(results.map((r: { query: string; status: string }) => [r.query, r.status])).toEqual([
      ['eth price', 'success'],
      ['eth price', 'error'],
      ['btc price', 'success'],
    ]);
    expect(results[0].result.answer).toBe('eth price#1');
    expect(results[2].result.answer).toBe('btc price#3');
    expect(summary).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
  });

  it('never runs more queries at once than the requested parallelism', async () => {
    let active = 0;
    let peak = 0;
    askFast.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { answer: 'ok' };
    });

    const res = await POST(
      batch(JSON.stringify({ queries: ['a1', 'b2', 'c3', 'd4', 'e5'], options: { parallelism: 2 } })),
    );

    expect((await res.json()).summary.succeeded).toBe(5);
    expect(peak).toBe(2);
  });
});
