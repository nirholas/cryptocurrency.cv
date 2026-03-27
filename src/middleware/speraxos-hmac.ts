/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * SperaxOS HMAC-SHA256 Request Verification (v2)
 *
 * Verifies HMAC-signed requests from SperaxOS with defense-in-depth:
 *   - HMAC-only authentication (static token fallback removed)
 *   - Body hash coverage (prevents body tampering on signed requests)
 *   - Nonce-based replay protection (per-isolate; use shared store for distributed)
 *   - Multi-key support with per-key route scoping and rate limits
 *   - Batch sub-request internal auth (signed, non-replayable)
 *
 * Signing scheme:
 *   payload   = `${timestamp}\n${METHOD}\n${path}\n${nonce}\n${bodyHash}`
 *   signature = HMAC-SHA256(key_secret, payload).hexdigest()
 *
 * Required headers:
 *   x-speraxos-signature  — HMAC-SHA256 hex digest
 *   x-speraxos-timestamp  — Unix epoch milliseconds
 *   x-speraxos-nonce      — Unique per-request (UUID recommended)
 *   x-speraxos-key-id     — Key identifier (required when multiple keys configured)
 *   x-speraxos-body-hash  — SHA-256 hex digest of request body (required for POST/PUT/PATCH/DELETE)
 *
 * Configuration:
 *   SPERAXOS_KEYS (preferred) — JSON array:
 *     [{"id":"chatbot","secret":"…","routes":["/api/news*","/api/prices*"],"rateLimit":{"daily":50000,"perMinute":500}}]
 *   SPERAXOS_API_SECRET (legacy) — single shared secret, gets default route scope
 *
 * @module middleware/speraxos-hmac
 */

import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';
import { SPERAXOS_DEFAULT_ALLOWED_ROUTES, SPERAXOS_RATE_LIMIT } from './config';

const MAX_TIMESTAMP_DRIFT_MS = 300_000; // 5 minutes
const NONCE_MAX_AGE_MS = MAX_TIMESTAMP_DRIFT_MS;
const NONCE_PRUNE_INTERVAL_MS = 60_000;

// ── Multi-Key Configuration ──────────────────────────────────────────────────

export interface SperaxosKey {
  id: string;
  secret: string;
  routes: RegExp[];
  rateLimit?: { daily: number; perMinute: number };
}

let _keys: SperaxosKey[] | null = null;
let _batchSecret: string | null = null;

function parseRoutePatterns(routes?: string[]): RegExp[] {
  if (!routes || routes.length === 0) return SPERAXOS_DEFAULT_ALLOWED_ROUTES;
  return routes.map((r) => {
    if (r === '*') return /.*/;
    // Convert prefix patterns like "/api/news*" → /^\/api\/news/
    const cleaned = r.endsWith('*') ? r.slice(0, -1) : r;
    const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^' + escaped);
  });
}

function getKeys(): SperaxosKey[] {
  if (_keys) return _keys;

  const keysJson = process.env.SPERAXOS_KEYS;
  if (keysJson) {
    try {
      const parsed = JSON.parse(keysJson) as Array<{
        id: string;
        secret: string;
        routes?: string[];
        rateLimit?: { daily: number; perMinute: number };
      }>;
      _keys = parsed.map((k) => ({
        id: k.id,
        secret: k.secret,
        routes: parseRoutePatterns(k.routes),
        rateLimit: k.rateLimit,
      }));
      return _keys;
    } catch {
      console.error('[speraxos] Failed to parse SPERAXOS_KEYS JSON');
    }
  }

  const secret = process.env.SPERAXOS_API_SECRET;
  if (secret) {
    _keys = [{ id: 'default', secret, routes: SPERAXOS_DEFAULT_ALLOWED_ROUTES }];
    return _keys;
  }

  _keys = [];
  return _keys;
}

/**
 * Look up the rate limit for a given speraxos key ID.
 * Returns the per-key override if configured, otherwise the global default.
 */
export function getSperaxosKeyRateLimit(keyId: string): { daily: number; perMinute: number } {
  const keys = getKeys();
  const key = keys.find((k) => k.id === keyId);
  return key?.rateLimit ?? SPERAXOS_RATE_LIMIT;
}

// ── Nonce Replay Protection ──────────────────────────────────────────────────
// Per-isolate tracking. In distributed/serverless environments, supplement with
// a shared store (Redis, KV) for cross-instance replay detection.

const seenNonces = new Map<string, number>();
let lastNoncePrune = Date.now();

function pruneNonces() {
  const now = Date.now();
  if (now - lastNoncePrune < NONCE_PRUNE_INTERVAL_MS) return;
  lastNoncePrune = now;
  for (const [nonce, ts] of seenNonces) {
    if (now - ts > NONCE_MAX_AGE_MS) seenNonces.delete(nonce);
  }
}

function isNonceReplay(nonce: string): boolean {
  pruneNonces();
  if (seenNonces.has(nonce)) return true;
  seenNonces.set(nonce, Date.now());
  return false;
}

// ── Cryptographic Helpers ────────────────────────────────────────────────────

async function hmacSign(secret: string, payload: string): Promise<string> {
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

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < bufA.byteLength; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

async function verifyHmac(secret: string, signature: string, payload: string): Promise<boolean> {
  const expected = await hmacSign(secret, payload);
  return constantTimeEqual(expected, signature);
}

// ── Batch Internal Auth ──────────────────────────────────────────────────────
// Allows the batch endpoint to authenticate sub-requests without exposing keys.
// The batch route calls signBatchAuth(); the middleware verifies via x-batch-auth.

const BATCH_AUTH_PREFIX = 'batch-internal-v1';

function getBatchSecret(): string | null {
  if (_batchSecret) return _batchSecret;
  const keys = getKeys();
  if (keys.length === 0) return null;
  _batchSecret = keys[0].secret;
  return _batchSecret;
}

/**
 * Sign a batch internal auth token for sub-request forwarding.
 * Called by the batch route handler to authenticate sub-requests.
 */
export async function signBatchAuth(requestId: string): Promise<string> {
  const secret = getBatchSecret();
  if (!secret) return '';
  const sig = await hmacSign(secret, `${BATCH_AUTH_PREFIX}:${requestId}`);
  return `${requestId}:${sig}`;
}

async function verifyBatchAuthToken(value: string): Promise<boolean> {
  const secret = getBatchSecret();
  if (!secret) return false;
  const colonIdx = value.indexOf(':');
  if (colonIdx < 1) return false;
  const requestId = value.slice(0, colonIdx);
  const sig = value.slice(colonIdx + 1);
  return verifyHmac(secret, sig, `${BATCH_AUTH_PREFIX}:${requestId}`);
}

// ── Route Scope Check ────────────────────────────────────────────────────────

function isRouteAllowed(pathname: string, allowedRoutes: RegExp[]): boolean {
  return allowedRoutes.some((r) => r.test(pathname));
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export const speraxosHmac: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const keys = getKeys();
  if (keys.length === 0) return ctx; // No keys configured — open mode

  const { request, pathname, requestId } = ctx;

  // Echo x-request-id for distributed tracing
  const incomingRequestId = request.headers.get('x-request-id');
  if (incomingRequestId) ctx.headers['x-request-id'] = incomingRequestId;

  // ── Batch sub-request internal auth ────────────────────────────────────
  const batchAuth = request.headers.get('x-batch-auth');
  if (batchAuth && request.headers.get('x-batch-request') === '1') {
    if (await verifyBatchAuthToken(batchAuth)) {
      ctx.isSperaxOS = true;
      ctx.speraxosKeyId = 'batch-internal';
      return ctx;
    }
    // Invalid batch auth — don't grant speraxos, continue as normal request
  }

  // ── Simple token authentication ──────────────────────────────────────
  // SperaxOS can send a shared secret via x-speraxos-token for lightweight
  // server-to-server auth (no HMAC ceremony). The token is compared using
  // constant-time equality to prevent timing attacks.
  const token = request.headers.get('x-speraxos-token');
  if (token) {
    const secret = process.env.SPERAXOS_API_SECRET;
    if (!secret) {
      // Feature disabled — SPERAXOS_API_SECRET not configured, ignore header
    } else if (constantTimeEqual(token, secret)) {
      ctx.isSperaxOS = true;
      ctx.speraxosKeyId = 'token';
      return ctx;
    } else {
      // Token present but wrong — reject to surface misconfiguration
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN', requestId },
        { status: 401, headers: ctx.headers },
      );
    }
  }

  // ── HMAC signature verification ────────────────────────────────────────
  const signature = request.headers.get('x-speraxos-signature');
  if (!signature) return ctx; // Not a speraxos request — let pass

  const timestamp = request.headers.get('x-speraxos-timestamp');
  if (!timestamp) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MISSING_TIMESTAMP', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  const nonce = request.headers.get('x-speraxos-nonce');
  if (!nonce) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MISSING_NONCE', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  // Timestamp validation
  const ts = Number(timestamp);
  if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > MAX_TIMESTAMP_DRIFT_MS) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'TIMESTAMP_EXPIRED', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  // Nonce replay check
  if (isNonceReplay(nonce)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'NONCE_REUSED', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  // Body hash — required for mutating methods to prevent body tampering
  const bodyHash = request.headers.get('x-speraxos-body-hash') ?? '';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !bodyHash) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MISSING_BODY_HASH', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  // Build HMAC payload (v2 scheme)
  const payload = `${timestamp}\n${request.method}\n${pathname}\n${nonce}\n${bodyHash}`;

  // Resolve key
  const keyIdHeader = request.headers.get('x-speraxos-key-id');
  let matchedKey: SperaxosKey | undefined;

  if (keyIdHeader) {
    matchedKey = keys.find((k) => k.id === keyIdHeader);
    if (!matchedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNKNOWN_KEY_ID', requestId },
        { status: 401, headers: ctx.headers },
      );
    }
  } else if (keys.length === 1) {
    // Single key mode — x-speraxos-key-id not required
    matchedKey = keys[0];
  } else {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        code: 'MISSING_KEY_ID',
        message: 'x-speraxos-key-id header is required when multiple keys are configured',
        requestId,
      },
      { status: 401, headers: ctx.headers },
    );
  }

  // Verify HMAC signature
  const valid = await verifyHmac(matchedKey.secret, signature, payload);
  if (!valid) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'INVALID_SIGNATURE', requestId },
      { status: 401, headers: ctx.headers },
    );
  }

  // Route scope check
  if (!isRouteAllowed(pathname, matchedKey.routes)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'ROUTE_NOT_ALLOWED',
        message: `Key "${matchedKey.id}" is not authorized for ${pathname}`,
        requestId,
      },
      { status: 403, headers: ctx.headers },
    );
  }

  // Signature valid — mark as SperaxOS
  ctx.isSperaxOS = true;
  ctx.speraxosKeyId = matchedKey.id;
  return ctx;
};

// ── Test Helpers ─────────────────────────────────────────────────────────────

/** Reset internal caches — only for use in tests. */
export function _resetForTesting() {
  _keys = null;
  _batchSecret = null;
  seenNonces.clear();
  lastNoncePrune = Date.now();
}
