/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * SperaxOS HMAC-SHA256 Request Verification
 *
 * Verifies HMAC-signed requests from SperaxOS. Falls back to static token
 * authentication when no signature header is present (backward compatibility).
 *
 * Signing scheme:
 *   payload   = `${timestamp}\n${METHOD}\n${path}`
 *   signature = HMAC-SHA256(shared_secret, payload).hexdigest()
 *
 * @module middleware/speraxos-hmac
 */

import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';

const MAX_TIMESTAMP_DRIFT_MS = 300_000; // 5 minutes

/**
 * Verify HMAC-SHA256 signature using Web Crypto API (Edge-compatible).
 * Returns true if the signature is valid.
 */
async function verifyHmac(
  secret: string,
  signature: string,
  timestamp: string,
  method: string,
  path: string,
): Promise<boolean> {
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
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  const a = enc.encode(expected);
  const b = enc.encode(signature);
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Constant-time comparison of two strings (for static token fallback).
 */
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < bufA.byteLength; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export const speraxosHmac: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const secret = process.env.SPERAXOS_API_SECRET;

  // Open mode: if no secret is configured, skip auth entirely (local dev)
  if (!secret) return ctx;

  const { request, pathname, requestId } = ctx;
  const signature = request.headers.get('x-speraxos-signature');
  const timestamp = request.headers.get('x-speraxos-timestamp');
  const token = request.headers.get('x-speraxos-token');
  const incomingRequestId = request.headers.get('x-request-id');

  // Echo x-request-id for distributed tracing
  if (incomingRequestId) {
    ctx.headers['x-request-id'] = incomingRequestId;
  }

  // No SperaxOS headers at all — not a SperaxOS request, let pass
  if (!signature && !token) return ctx;

  // ── HMAC signature verification (preferred) ──────────────────────────────
  if (signature) {
    if (!timestamp) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'MISSING_TIMESTAMP', requestId },
        { status: 401, headers: ctx.headers },
      );
    }

    const ts = Number(timestamp);
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > MAX_TIMESTAMP_DRIFT_MS) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'TIMESTAMP_EXPIRED', requestId },
        { status: 401, headers: ctx.headers },
      );
    }

    const valid = await verifyHmac(secret, signature, timestamp, request.method, pathname);
    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_SIGNATURE', requestId },
        { status: 401, headers: ctx.headers },
      );
    }

    // Signature valid — mark as SperaxOS
    ctx.isSperaxOS = true;
    return ctx;
  }

  // ── Static token fallback (backward compat — remove in future) ───────────
  if (token) {
    if (!constantTimeEqual(token, secret)) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN', requestId },
        { status: 401, headers: ctx.headers },
      );
    }
    ctx.isSperaxOS = true;
    return ctx;
  }

  return ctx;
};
