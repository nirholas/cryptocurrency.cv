import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as aiCounter from '@/lib/ai-counter';

import { POST } from './route';

function post(body: string) {
  return new NextRequest('http://localhost/api/ai/counter', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('POST /api/ai/counter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(aiCounter, 'isAIConfigured').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['{"claim":', '', 'not json'])('returns 400, not 500, for the body %j', async (body) => {
    const generate = vi.spyOn(aiCounter, 'generateCounterArguments');

    const res = await POST(post(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'Invalid JSON' });
    expect(generate).not.toHaveBeenCalled();
  });
});
