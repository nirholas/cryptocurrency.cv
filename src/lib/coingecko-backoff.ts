/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Process-wide CoinGecko 429 back-off.
 *
 * `lib/coingecko` and `lib/market-data` each call CoinGecko with their own
 * request budget, but a 429 applies to the key, not the module. Both read and
 * write this one deadline so a rate limit seen by either pauses both.
 */

const DEFAULT_RETRY_AFTER_SEC = 60;
const MAX_BACKOFF_MS = 120_000;

let backoffUntil = 0;

/** Remaining back-off in ms, 0 when requests may be sent */
export function coinGeckoBackoffRemaining(now = Date.now()): number {
  return Math.max(backoffUntil - now, 0);
}

/**
 * Record a 429. `retryAfter` is the raw Retry-After header: seconds or an
 * HTTP date. Missing or unparseable values back off for 60 s; the wait is
 * capped at 2 minutes. Returns the back-off in ms.
 */
export function backOffCoinGecko(retryAfter?: string | null, now = Date.now()): number {
  let ms = DEFAULT_RETRY_AFTER_SEC * 1000;
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) ms = seconds * 1000;
    else if (Number.isFinite(date)) ms = Math.max(date - now, 0);
  }
  ms = Math.min(ms, MAX_BACKOFF_MS);
  backoffUntil = Math.max(backoffUntil, now + ms);
  return ms;
}
