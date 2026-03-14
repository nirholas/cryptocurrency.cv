/**
 * Tests for speraxos-hmac middleware handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { speraxosHmac } from '@/middleware/speraxos-hmac';
import type { MiddlewareContext } from '@/middleware/types';

const SECRET = 'test-speraxos-secret-key';

function createContext(
  pathname: string,
  headers: Record<string, string> = {},
  overrides: Partial<MiddlewareContext> = {},
): MiddlewareContext {
  const url = new URL('http://localhost:3000' + pathname);
  const request = new NextRequest(url, {
    method: overrides.request?.method ?? 'GET',
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

/**
 * Compute HMAC-SHA256 hex digest using Web Crypto API (same as the middleware).
 */
async function signPayload(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
): Promise<string> {
  const payload = `${timestamp}\n${method}\n${path}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('speraxosHmac handler', () => {
  beforeEach(() => {
    vi.stubEnv('SPERAXOS_API_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Open mode (no secret) ──────────────────────────────────────────────

  it('should skip auth entirely when SPERAXOS_API_SECRET is not set', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    const ctx = createContext('/api/news');
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
  });

  // ── Non-API routes ────────────────────────────────────────────────────

  it('should skip non-API routes', async () => {
    const ctx = createContext('/about', {}, { isApiRoute: false });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  // ── No SperaxOS headers ───────────────────────────────────────────────

  it('should pass through when no SperaxOS headers are present', async () => {
    const ctx = createContext('/api/news');
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
  });

  // ── HMAC verification ─────────────────────────────────────────────────

  it('should accept a valid HMAC signature', async () => {
    const timestamp = String(Date.now());
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news');
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });

  it('should reject an invalid HMAC signature with 401', async () => {
    const timestamp = String(Date.now());
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': 'deadbeef'.repeat(8), // 64 hex chars, wrong signature
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('INVALID_SIGNATURE');
  });

  it('should reject when signature is present but timestamp is missing', async () => {
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': 'deadbeef'.repeat(8),
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('MISSING_TIMESTAMP');
  });

  it('should reject an expired timestamp (>5 minutes old)', async () => {
    const timestamp = String(Date.now() - 400_000); // ~6.6 minutes ago
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news');
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('should reject a future timestamp beyond 5 minutes', async () => {
    const timestamp = String(Date.now() + 400_000); // ~6.6 minutes in the future
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news');
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('should reject a signature computed with the wrong secret', async () => {
    const timestamp = String(Date.now());
    const signature = await signPayload('wrong-secret', timestamp, 'GET', '/api/news');
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('INVALID_SIGNATURE');
  });

  it('should reject a signature with wrong method', async () => {
    const timestamp = String(Date.now());
    const signature = await signPayload(SECRET, timestamp, 'POST', '/api/news'); // signed as POST
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    }); // but request is GET
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('should reject a signature with wrong path', async () => {
    const timestamp = String(Date.now());
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/search'); // signed for /api/search
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
    }); // but request is /api/news
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  // ── Static token fallback ─────────────────────────────────────────────

  it('should accept a valid static token (backward compat)', async () => {
    const ctx = createContext('/api/news', {
      'x-speraxos-token': SECRET,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });

  it('should reject an invalid static token with 401', async () => {
    const ctx = createContext('/api/news', {
      'x-speraxos-token': 'wrong-token',
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('INVALID_TOKEN');
  });

  // ── x-request-id echo ────────────────────────────────────────────────

  it('should echo x-request-id header when present', async () => {
    const ctx = createContext('/api/news', {
      'x-request-id': 'trace-abc-123',
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).headers['x-request-id']).toBe('trace-abc-123');
  });

  it('should not set x-request-id when not provided', async () => {
    const ctx = createContext('/api/news');
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).headers['x-request-id']).toBeUndefined();
  });

  // ── HMAC prefers over token when both present ─────────────────────────

  it('should use HMAC verification when both signature and token are present', async () => {
    const timestamp = String(Date.now());
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news');
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-token': SECRET,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });
});
