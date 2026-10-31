/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import * as dune from '@/lib/apis/dune';
import { GET } from './route';

function get(query: string, headers?: Record<string, string>): Promise<Response> {
  return GET(new NextRequest(`http://localhost/api/dune?${query}`, { headers }));
}

describe('GET /api/dune', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dune, 'isDuneConfigured').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('refuses anonymous fresh executions without calling Dune', async () => {
    const execute = vi.spyOn(dune, 'executeQuery');
    const res = await get('execute=12345');
    expect(res.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it('runs a fresh execution for an admin and reports upstream failure as 502', async () => {
    vi.stubEnv('ADMIN_API_KEY', 'test-admin-key');
    const execute = vi.spyOn(dune, 'executeQuery').mockResolvedValue(null);
    const res = await get('execute=12345', { Authorization: 'Bearer test-admin-key' });
    expect(execute).toHaveBeenCalledWith(12345);
    expect(res.status).toBe(502);
  });

  it('rejects non-numeric query ids instead of sending NaN upstream', async () => {
    const latest = vi.spyOn(dune, 'getLatestResults');
    expect((await get('queryId=abc')).status).toBe(400);
    expect((await get('queryId=0')).status).toBe(400);
    expect(latest).not.toHaveBeenCalled();
  });

  it('rejects execution ids that would alter the upstream path', async () => {
    const results = vi.spyOn(dune, 'getQueryResults');
    expect((await get(`executionId=${encodeURIComponent('../query/1/execute')}`)).status).toBe(400);
    expect(results).not.toHaveBeenCalled();
  });

  it('says Dune is not configured before trying a query', async () => {
    vi.spyOn(dune, 'isDuneConfigured').mockReturnValue(false);
    const dex = vi.spyOn(dune, 'getDexVolumeByProtocol');
    const res = await get('query=dexVolume');
    expect(res.status).toBe(503);
    expect(dex).not.toHaveBeenCalled();
  });

  it('lists the available queries with no parameters', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { availableQueries: unknown[] };
    expect(body.availableQueries.length).toBeGreaterThan(0);
  });
});
