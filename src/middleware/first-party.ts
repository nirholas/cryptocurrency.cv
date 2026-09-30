/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * First-party trust: proves a request came from this site, not just that it
 * claims to.
 *
 * The site's own pages call the API from the browser and are exempt from the
 * anonymous limits and the payment gate. That used to be decided from
 * `Sec-Fetch-Site`, `Origin` and `Referer`, which browsers cannot forge but
 * every non-browser client can, so `curl -H 'Sec-Fetch-Site: same-origin'`
 * got the site's own allowance.
 *
 * Now every page response carries a short-lived HMAC-signed cookie
 * (HttpOnly, SameSite=Strict), and same-origin trust requires it. Server code
 * that calls the site's own API (server components, routes composing other
 * routes) proves itself with a signed header instead: see
 * `internalRequestHeaders` in lib/internal-fetch.
 *
 * The key is FIRST_PARTY_SECRET, else CRON_SECRET (both are set on every
 * production instance, so a cookie issued by one instance verifies on the
 * others). Local development without either gets a per-process random key.
 *
 * @module middleware/first-party
 */

import type { NextRequest, NextResponse } from 'next/server';

export const FIRST_PARTY_COOKIE = 'fcn_fp';
export const INTERNAL_HEADER = 'x-fcn-internal';

/** Cookie lifetime; reissued on page views once less than half remains. */
const TTL_SECONDS = 2 * 60 * 60;

type GlobalWithKey = typeof globalThis & { __fcnFirstPartyKey?: string };

function secret(): string {
  const configured = process.env.FIRST_PARTY_SECRET || process.env.CRON_SECRET;
  if (configured) return configured;
  // Shared through globalThis so the proxy bundle and route bundles running
  // in the same dev process agree on it.
  const g = globalThis as GlobalWithKey;
  g.__fcnFirstPartyKey ??= crypto.randomUUID() + crypto.randomUUID();
  return g.__fcnFirstPartyKey;
}

let cachedKey: { raw: string; key: Promise<CryptoKey> } | null = null;

function hmacKey(): Promise<CryptoKey> {
  const raw = secret();
  if (cachedKey?.raw !== raw) {
    cachedKey = {
      raw,
      key: crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(raw),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
    };
  }
  return cachedKey.key;
}

async function sign(message: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(message));
  let binary = '';
  for (const byte of new Uint8Array(mac)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Seconds of validity left on the request's cookie, or 0 when absent/invalid. */
export async function firstPartyCookieRemaining(request: NextRequest): Promise<number> {
  const value = request.cookies.get(FIRST_PARTY_COOKIE)?.value;
  if (!value) return 0;
  const [version, expiry, signature] = value.split('.');
  const exp = Number(expiry);
  if (version !== 'v1' || !Number.isInteger(exp) || !signature) return 0;
  const remaining = exp - nowSeconds();
  if (remaining <= 0 || remaining > TTL_SECONDS) return 0;
  return safeEqual(signature, await sign(`v1.${exp}`)) ? remaining : 0;
}

/** Set a fresh cookie on a page response unless the current one is still young. */
export async function issueFirstPartyCookie(request: NextRequest, response: NextResponse): Promise<void> {
  if ((await firstPartyCookieRemaining(request)) > TTL_SECONDS / 2) return;
  const exp = nowSeconds() + TTL_SECONDS;
  response.cookies.set(FIRST_PARTY_COOKIE, `v1.${exp}.${await sign(`v1.${exp}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TTL_SECONDS,
  });
}

/** The value server code sends in INTERNAL_HEADER. */
export function internalRequestToken(): Promise<string> {
  return sign('internal-v1');
}

/** True when the request carries a valid server-to-server token. */
export async function isInternalRequest(request: NextRequest): Promise<boolean> {
  const token = request.headers.get(INTERNAL_HEADER);
  return !!token && safeEqual(token, await internalRequestToken());
}
