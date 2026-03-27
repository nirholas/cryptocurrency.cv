/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for speraxos-hmac middleware handler (v2 signing scheme)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse, NextRequest } from 'next/server';
import { speraxosHmac, signBatchAuth, _resetForTesting } from '@/middleware/speraxos-hmac';
import type { MiddlewareContext } from '@/middleware/types';

const SECRET = 'test-speraxos-secret-key';
const SECRET_2 = 'another-speraxos-secret-key';

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
    speraxosKeyId: null,
    isTrustedOrigin: false,
    isApiClient: false,
    clientIp: '127.0.0.1',
    apiKeyTier: null,
    apiKeyId: null,
    headers: {},
    ...overrides,
  };
}

/**
 * Compute v2 HMAC-SHA256 hex digest: `timestamp\nMETHOD\npath\nnonce\nbodyHash`
 */
async function signPayload(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  nonce: string,
  bodyHash: string = '',
): Promise<string> {
  const payload = `${timestamp}\n${method}\n${path}\n${nonce}\n${bodyHash}`;
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

function makeNonce(): string {
  return crypto.randomUUID();
}

describe('speraxosHmac handler (v2)', () => {
  beforeEach(() => {
    _resetForTesting();
    vi.stubEnv('SPERAXOS_API_SECRET', SECRET);
    vi.stubEnv('SPERAXOS_KEYS', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Open mode (no secret) ──────────────────────────────────────────────

  it('should skip auth entirely when no keys are configured', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    _resetForTesting();
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

  // ── HMAC v2 verification ──────────────────────────────────────────────

  it('should accept a valid HMAC v2 signature', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
    expect((result as MiddlewareContext).speraxosKeyId).toBe('default');
  });

  it('should reject an invalid HMAC signature with 401', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': 'deadbeef'.repeat(8),
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
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
      'x-speraxos-nonce': makeNonce(),
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('MISSING_TIMESTAMP');
  });

  it('should reject when nonce is missing', async () => {
    const timestamp = String(Date.now());
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': 'deadbeef'.repeat(8),
      'x-speraxos-timestamp': timestamp,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('MISSING_NONCE');
  });

  it('should reject an expired timestamp (>5 minutes old)', async () => {
    const timestamp = String(Date.now() - 400_000);
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('should reject a future timestamp beyond 5 minutes', async () => {
    const timestamp = String(Date.now() + 400_000);
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('should reject a signature computed with the wrong secret', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload('wrong-secret', timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('INVALID_SIGNATURE');
  });

  it('should reject a signature with wrong method', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'POST', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    }); // request is GET, signed as POST
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('should reject a signature with wrong path', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/search', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    }); // request is /api/news, signed for /api/search
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  // ── x-speraxos-token authentication ─────────────────────────────────────

  it('should accept a valid x-speraxos-token and set isSperaxOS', async () => {
    const ctx = createContext('/api/news', {
      'x-speraxos-token': SECRET,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
    expect((result as MiddlewareContext).speraxosKeyId).toBe('token');
  });

  it('should fall through to anonymous when x-speraxos-token is invalid', async () => {
    const ctx = createContext('/api/news', {
      'x-speraxos-token': 'wrong-secret',
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
  });

  it('should ignore x-speraxos-token when SPERAXOS_API_SECRET is unset', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    _resetForTesting();
    const ctx = createContext('/api/news', {
      'x-speraxos-token': 'any-value',
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
  });

  // ── Nonce replay protection ────────────────────────────────────────────

  it('should reject a replayed nonce', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);

    // First request succeeds
    const ctx1 = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result1 = await speraxosHmac(ctx1);
    expect((result1 as MiddlewareContext).isSperaxOS).toBe(true);

    // Second request with same nonce is rejected
    const ctx2 = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
    });
    const result2 = await speraxosHmac(ctx2);
    expect(result2).toBeInstanceOf(NextResponse);
    const body = await (result2 as NextResponse).json();
    expect(body.code).toBe('NONCE_REUSED');
  });

  // ── Body hash ──────────────────────────────────────────────────────────

  it('should require body hash for POST requests', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'POST', '/api/news', nonce);

    const url = new URL('http://localhost:3000/api/news');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: new Headers({
        'x-speraxos-signature': signature,
        'x-speraxos-timestamp': timestamp,
        'x-speraxos-nonce': nonce,
      }),
    });
    const ctx: MiddlewareContext = {
      request,
      requestId: 'req_test_123',
      startTime: Date.now(),
      pathname: '/api/news',
      isApiRoute: true,
      isEmbedRoute: false,
      isSperaxOS: false,
      speraxosKeyId: null,
      isTrustedOrigin: false,
      isApiClient: false,
      clientIp: '127.0.0.1',
      apiKeyTier: null,
      apiKeyId: null,
      headers: {},
    };

    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('MISSING_BODY_HASH');
  });

  it('should accept POST with valid body hash in signature', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const bodyHash = 'abc123bodyhash';
    const signature = await signPayload(SECRET, timestamp, 'POST', '/api/news', nonce, bodyHash);

    const url = new URL('http://localhost:3000/api/news');
    const request = new NextRequest(url, {
      method: 'POST',
      headers: new Headers({
        'x-speraxos-signature': signature,
        'x-speraxos-timestamp': timestamp,
        'x-speraxos-nonce': nonce,
        'x-speraxos-body-hash': bodyHash,
      }),
    });
    const ctx: MiddlewareContext = {
      request,
      requestId: 'req_test_123',
      startTime: Date.now(),
      pathname: '/api/news',
      isApiRoute: true,
      isEmbedRoute: false,
      isSperaxOS: false,
      speraxosKeyId: null,
      isTrustedOrigin: false,
      isApiClient: false,
      clientIp: '127.0.0.1',
      apiKeyTier: null,
      apiKeyId: null,
      headers: {},
    };

    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });

  // ── Multi-key support ──────────────────────────────────────────────────

  it('should authenticate with the correct key when multiple keys are configured', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    vi.stubEnv(
      'SPERAXOS_KEYS',
      JSON.stringify([
        { id: 'chatbot', secret: SECRET, routes: ['/api/news*', '/api/prices*'] },
        { id: 'pipeline', secret: SECRET_2, routes: ['*'] },
      ]),
    );
    _resetForTesting();

    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
      'x-speraxos-key-id': 'chatbot',
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
    expect((result as MiddlewareContext).speraxosKeyId).toBe('chatbot');
  });

  it('should reject unknown key IDs', async () => {
    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
      'x-speraxos-key-id': 'nonexistent',
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('UNKNOWN_KEY_ID');
  });

  it('should require key-id when multiple keys are configured', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    vi.stubEnv(
      'SPERAXOS_KEYS',
      JSON.stringify([
        { id: 'key1', secret: SECRET },
        { id: 'key2', secret: SECRET_2 },
      ]),
    );
    _resetForTesting();

    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/news', nonce);
    const ctx = createContext('/api/news', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
      // no x-speraxos-key-id
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('MISSING_KEY_ID');
  });

  // ── Route scoping ─────────────────────────────────────────────────────

  it('should reject requests to routes not in the key scope', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    vi.stubEnv(
      'SPERAXOS_KEYS',
      JSON.stringify([
        { id: 'limited', secret: SECRET, routes: ['/api/news*'] },
      ]),
    );
    _resetForTesting();

    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/admin/stats', nonce);
    const ctx = createContext('/api/admin/stats', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
      'x-speraxos-key-id': 'limited',
    });
    const result = await speraxosHmac(ctx);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
    const body = await (result as NextResponse).json();
    expect(body.code).toBe('ROUTE_NOT_ALLOWED');
  });

  it('should allow wildcard route scope', async () => {
    vi.stubEnv('SPERAXOS_API_SECRET', '');
    vi.stubEnv(
      'SPERAXOS_KEYS',
      JSON.stringify([{ id: 'admin', secret: SECRET, routes: ['*'] }]),
    );
    _resetForTesting();

    const timestamp = String(Date.now());
    const nonce = makeNonce();
    const signature = await signPayload(SECRET, timestamp, 'GET', '/api/admin/stats', nonce);
    const ctx = createContext('/api/admin/stats', {
      'x-speraxos-signature': signature,
      'x-speraxos-timestamp': timestamp,
      'x-speraxos-nonce': nonce,
      'x-speraxos-key-id': 'admin',
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
  });

  // ── Batch internal auth ────────────────────────────────────────────────

  it('should authenticate valid batch sub-requests', async () => {
    const batchRequestId = 'batch-req-abc';
    const batchAuth = await signBatchAuth(batchRequestId);

    const ctx = createContext('/api/news', {
      'x-batch-request': '1',
      'x-batch-auth': batchAuth,
    });
    const result = await speraxosHmac(ctx);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(true);
    expect((result as MiddlewareContext).speraxosKeyId).toBe('batch-internal');
  });

  it('should reject invalid batch auth tokens', async () => {
    const ctx = createContext('/api/news', {
      'x-batch-request': '1',
      'x-batch-auth': 'fake-request-id:invalidsignature',
    });
    const result = await speraxosHmac(ctx);
    // Invalid batch auth doesn't short-circuit with 401 — just doesn't grant speraxos
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as MiddlewareContext).isSperaxOS).toBe(false);
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
});
