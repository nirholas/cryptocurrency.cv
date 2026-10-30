/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

let ipCounter = 0;

function loginRequest(body: unknown): NextRequest {
  ipCounter++;
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('answers 503 instead of 500 when no database is configured', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('POSTGRES_URL', '');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(loginRequest({ email: 'reader@example.com' }));

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('3600');
    const body = await response.json();
    expect(body.error).toMatch(/not available/);
    expect(error).not.toHaveBeenCalled();
  });

  it('answers 503 in production when no email provider is configured', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost/db');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');

    const response = await POST(loginRequest({ email: 'reader@example.com' }));

    expect(response.status).toBe(503);
  });

  it('rejects a malformed JSON body with 400', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost/db');
    vi.stubEnv('NODE_ENV', 'test');
    ipCounter++;
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ipCounter}` },
      body: '{not json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
