/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Server-side fetch of this site's own API.
 *
 * Server components and routes used to call `${SITE_URL}/api/...`, which
 * leaves the container, re-enters through the public load balancer and
 * arrives as an anonymous client from Google's egress IPs: a handful of page
 * renders spent the anonymous hourly allowance and the site's own pages
 * started failing with 429 and then 403. internalFetch calls the same
 * instance over loopback and signs the request, so the middleware treats it
 * as the site itself (see middleware/first-party).
 *
 * @module lib/internal-fetch
 */

import { INTERNAL_HEADER, internalRequestToken } from '@/middleware/first-party';

/** Loopback origin of this server; `next start` and `next dev` both honour PORT. */
export function internalOrigin(): string {
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

/**
 * Fetch `path` (e.g. `/api/whale-alerts?limit=20`) from this server. Accepts
 * the usual RequestInit, including Next's `next: { revalidate }`.
 */
export async function internalFetch(
  path: string,
  init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {},
): Promise<Response> {
  if (!path.startsWith('/')) throw new Error(`internalFetch expects a path, got ${path}`);
  const headers = new Headers(init.headers);
  headers.set(INTERNAL_HEADER, await internalRequestToken());
  return fetch(`${internalOrigin()}${path}`, { ...init, headers });
}
