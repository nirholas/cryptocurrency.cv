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
