import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as graph from '@/lib/ai-knowledge-graph';

import { POST } from './route';

function post(body: string) {
  return new NextRequest('http://localhost/api/knowledge-graph', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/knowledge-graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(graph, 'ingestLatestNews').mockResolvedValue({
      articlesProcessed: 0,
      entitiesFound: 0,
      relationshipsFound: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['null', 20],
    ['{"count":"lots"}', 20],
    ['{"count":0}', 1],
    ['{"count":1000000}', 50],
    ['{"count":12.7}', 12],
    ['{"a":', 20],
  ])('ingests with a bounded count for body %s', async (body, expected) => {
    const res = await POST(post(body));

    expect(res.status).toBe(200);
    expect(graph.ingestLatestNews).toHaveBeenCalledWith(expected);
  });

  it('rejects an unknown action', async () => {
    const res = await POST(post('{"action":"drop"}'));

    expect(res.status).toBe(400);
    expect(graph.ingestLatestNews).not.toHaveBeenCalled();
  });
});
