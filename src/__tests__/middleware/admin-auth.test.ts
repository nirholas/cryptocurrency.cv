/**
 * Tests for admin-auth middleware handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { adminAuth } from '@/middleware/admin-auth';
import type { MiddlewareContext } from '@/middleware/types';

function createContext(
  pathname: string,
  headers: Record<string, string> = {},
  overrides: Partial<MiddlewareContext> = {},
): MiddlewareContext {
  const url = new URL('http://localhost:3000' + pathname);
  const request = new NextRequest(url, {
    headers: new Headers(headers),
  });
  return {
    request,
    requestId: 'req_test_123',
    startTime: Date.now(),
    pathname,
    isApiRoute: pathname.startsWith('/api/'),
    isEmbedRoute: false,
    isSperaxOS: false,
    isTrustedOrigin: false,
    isAlibabaGateway: false,
    isApiClient: false,
    clientIp: '127.0.0.1',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
    ...overrides,
  };
}

describe('adminAuth handler', () => {
  const ADMIN_TOKEN = 'test-admin-token-secret';

  beforeEach(() => {
    vi.stubEnv('ADMIN_TOKEN', ADMIN_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should skip non-API routes', () => {
    const ctx = createContext('/about', {}, { isApiRoute: false });
    const result = adminAuth(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toBe(ctx);
  });

  it('should skip non-admin API routes', () => {
    const ctx = createContext('/api/news');
    const result = adminAuth(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('should reject admin routes without token', async () => {
    const ctx = createContext('/api/admin/stats');
    const result = adminAuth(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    const resp = result as NextResponse;
    expect(resp.status).toBe(401);
    const body = await resp.json();
    expect(body.code).toBe('ADMIN_AUTH_REQUIRED');
  });

  it('should reject admin routes with wrong token', async () => {
    const ctx = createContext('/api/admin/stats', {
      Authorization: 'Bearer wrong-token',
    });
    const result = adminAuth(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('should allow admin routes with correct token', () => {
    const ctx = createContext('/api/admin/stats', {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    });
    const result = adminAuth(ctx);

    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('should reject when ADMIN_TOKEN env is not set', async () => {
    vi.stubEnv('ADMIN_TOKEN', '');
    const ctx = createContext('/api/admin/stats', {
      Authorization: 'Bearer some-token',
    });
    const result = adminAuth(ctx);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('should restrict CORS on sensitive routes for untrusted origins', () => {
    const ctx = createContext('/api/keys/rotate', {
      origin: 'https://evil.com',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    });
    const result = adminAuth(ctx) as MiddlewareContext;

    expect(result.headers['Access-Control-Allow-Origin']).toBe('null');
  });

  it('should allow CORS on sensitive routes for trusted origins', () => {
    const ctx = createContext('/api/keys/rotate', {
      origin: 'https://chat.sperax.io',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    });
    const result = adminAuth(ctx) as MiddlewareContext;

    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://chat.sperax.io');
    expect(result.headers['Vary']).toBe('Origin');
  });

  it('should not set CORS headers on sensitive routes without origin', () => {
    const ctx = createContext('/api/internal/sync', {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    });
    // /api/internal doesn't need admin auth check (only adminAuth handles /api/admin)
    // but it IS a sensitive route for CORS
    const result = adminAuth(ctx) as MiddlewareContext;

    expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
