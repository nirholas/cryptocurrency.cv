/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Security Headers & Suspicious Payload Detection
 *
 * Provides security response headers and lightweight injection detection.
 *
 * @module middleware/security
 */

import type { NextRequest } from 'next/server';

// =============================================================================
// SECURITY HEADERS
// =============================================================================

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0', // Disabled in favour of CSP; avoids legacy XSS-auditor quirks
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Pragma': 'no-cache',
  // ── Anti-poaching / origin fingerprinting ──────────────────────────────
  'X-Source': 'cryptocurrency.cv',
  'X-Source-Repo': 'https://github.com/nirholas/free-crypto-news',
  'X-License': 'SEE LICENSE IN LICENSE',
  'X-Copyright': '2024-2026 nirholas',
};

// =============================================================================
// NONCE-BASED CSP
// =============================================================================

/**
 * Build a Content-Security-Policy header value with a per-request nonce.
 *
 * Uses nonce-based inline script control combined with explicit domain
 * allowlists for third-party scripts.  `'unsafe-inline'` is kept as a
 * backward-compatible fallback for older browsers that do not support
 * nonces — modern browsers automatically ignore it when a nonce is present.
 *
 * NOTE: We intentionally do NOT use `'strict-dynamic'` because it disables
 * `'self'` and host-based allowlisting.  Next.js does not reliably inject
 * nonces into every framework `<script>` tag (especially with Turbopack),
 * so we rely on `'self'` to allow same-origin scripts and explicit domains
 * for known third-party sources.
 */
export function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    [
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
      // Google Analytics / Tag Manager
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      // TradingView widgets
      'https://s3.tradingview.com',
      'https://www.tradingview.com',
      // Vercel Analytics & Speed Insights (served same-origin via /_vercel,
      // but the beacon endpoints are cross-origin)
      'https://*.vercel-scripts.com',
    ].join(' '),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "media-src 'self' https:",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://s.tradingview.com https://www.tradingview.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

// =============================================================================
// SUSPICIOUS PAYLOAD DETECTION
// =============================================================================

/**
 * Lightweight check for common injection payloads in query strings and
 * path segments.  This does NOT replace server-side input validation but
 * provides an early-reject at the edge to cut down on noise.
 */
const SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,                         // XSS probes
  /javascript:/i,                          // javascript: protocol
  /\bon\w+\s*=/i,                          // inline event handlers
  /union\s+select/i,                       // SQL injection
  /;\s*(drop|alter|delete|insert|update)\s/i, // SQL injection
  /\.\.\//,                                // Path traversal
  /%2e%2e%2f/i,                           // URL-encoded path traversal
  /%00/,                                   // Null byte injection
  /\0/,                                    // Literal null byte
];

/**
 * Returns the location of the suspicious content ('query', 'path', 'query-length')
 * or null if the request looks clean.
 */
export function isSuspiciousRequest(request: NextRequest): string | null {
  const url = request.nextUrl;
  const searchString = url.search;
  const pathString = url.pathname;

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(searchString)) return 'query';
    if (pattern.test(pathString)) return 'path';
  }

  if (searchString.length > 2048) return 'query-length';

  return null;
}
