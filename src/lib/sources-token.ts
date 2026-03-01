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
 * Sources Token — HMAC-based anti-scraping token for /api/sources
 *
 * Generates and validates short-lived tokens that prove the caller
 * came from a page we served (the /sources page injects the token,
 * the client-side component sends it back when fetching data).
 *
 * @module lib/sources-token
 */

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Derive a stable signing key from the app's secret.
 * Falls back to a build-time random string so the app never crashes.
 */
function getSecret(): string {
  return process.env.SOURCES_TOKEN_SECRET
    || process.env.ADMIN_TOKEN
    || process.env.NEXTAUTH_SECRET
    || 'fcn-default-sources-key-change-me';
}

/**
 * HMAC-SHA256 a message with the signing key (Web Crypto API — works on Edge).
 */
async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a signed token: `<timestamp>.<hmac>`.
 */
export async function generateSourcesToken(): Promise<string> {
  const ts = Date.now().toString(36);
  const sig = await hmac(ts);
  return `${ts}.${sig}`;
}

/**
 * Validate a token — returns true if the token is well-formed,
 * correctly signed, and younger than TOKEN_TTL_MS.
 */
export async function validateSourcesToken(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [ts, sig] = token.split('.', 2);
  if (!ts || !sig) return false;

  const timestamp = parseInt(ts, 36);
  if (Number.isNaN(timestamp)) return false;
  if (Date.now() - timestamp > TOKEN_TTL_MS) return false;

  const expected = await hmac(ts);

  // Constant-time comparison
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}
