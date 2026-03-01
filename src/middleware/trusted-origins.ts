/**
 * Trusted Origin Detection
 *
 * Determines whether a request is from a trusted SperaxOS source.
 * Only the `x-speraxos-token` secret header is used for authorization;
 * the Origin header is NOT trusted (trivially spoofable by non-browser clients).
 * `isTrustedOrigin()` is retained for safe CORS `Access-Control-Allow-Origin` use.
 *
 * @module middleware/trusted-origins
 */

import type { NextRequest } from 'next/server';

// Exact-match origins that bypass x402 and rate limiting entirely
const TRUSTED_EXACT_ORIGINS = new Set([
  'https://sperax.live',
  'https://www.sperax.live',
  'https://speraxos.vercel.app',
  ...(process.env.X402_BYPASS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
]);

// Apex domains whose subdomains are ALSO trusted
const TRUSTED_WILDCARD_DOMAINS = ['sperax.chat', 'sperax.io'];

function isTrustedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (TRUSTED_EXACT_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return TRUSTED_WILDCARD_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

/**
 * Determines whether a request is from a trusted SperaxOS origin.
 *
 * Only trusts the `x-speraxos-token` secret header (constant-time comparison).
 * The `Origin` header is NOT used for authorization — it's trivially spoofable
 * by any programmatic HTTP client. `isTrustedOrigin()` is retained for CORS
 * `Access-Control-Allow-Origin` responses, which is a separate (safe) use.
 */
export async function isSperaxOSRequest(request: NextRequest): Promise<boolean> {
  // Only trust the secret token header — Origin/Referer are spoofable
  const token = request.headers.get('x-speraxos-token') ?? '';
  if (token && process.env.SPERAXOS_API_SECRET) {
    try {
      const enc = new TextEncoder();
      const a = enc.encode(token);
      const b = enc.encode(process.env.SPERAXOS_API_SECRET);
      if (a.byteLength === b.byteLength && crypto.subtle) {
        const result = await (crypto.subtle as any).timingSafeEqual?.(a, b);
        if (result) return true;
      }
      // Fallback: XOR-based constant-time compare
      if (a.byteLength === b.byteLength) {
        let diff = 0;
        for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
        if (diff === 0) return true;
      }
    } catch {
      // Comparison failed, deny
    }
  }

  return false;
}
