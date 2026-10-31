/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Classifies RSS fetch failures so the server log only carries the ones a
 * person can act on.
 *
 * With hundreds of feeds refreshed every few minutes, sockets that a publisher
 * closes mid-body (undici's `TypeError: terminated`), connection resets and
 * DNS blips happen on every cycle. Each one used to print a full stack trace.
 * They are still recorded per feed in feed health, which is where a feed that
 * stays down shows up; the log keeps only unexpected errors.
 *
 * @module lib/feed-fetch-error
 */

/** Socket and DNS error codes Node's fetch reports on `error.cause.code`. */
const NETWORK_ERROR_CODES: ReadonlySet<string> = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

/** Messages undici gives a `TypeError` when the network, not the code, failed. */
const NETWORK_ERROR_MESSAGES: ReadonlySet<string> = new Set(['terminated', 'fetch failed']);

export interface FeedFetchFailure {
  /** True for timeouts and network failures; false for anything unexpected. */
  network: boolean;
  /** One-line description for feed health and logs. */
  message: string;
}

interface ErrorLike {
  name: string;
  message: string;
  cause?: unknown;
}

/**
 * `instanceof Error` is not enough: an abort arrives as a `DOMException`,
 * which is not an `Error` in every realm.
 */
function asErrorLike(error: unknown): ErrorLike | null {
  if (typeof error !== 'object' || error === null) return null;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return typeof name === 'string' && typeof message === 'string' ? (error as ErrorLike) : null;
}

function causeCode(error: ErrorLike): string | undefined {
  const { cause } = error;
  if (typeof cause !== 'object' || cause === null) return undefined;
  const code = (cause as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Describe a failed feed fetch. `timeoutMs` is the abort deadline the caller
 * set, used to word the timeout message.
 */
export function describeFeedFetchError(error: unknown, timeoutMs: number): FeedFetchFailure {
  const err = asErrorLike(error);
  if (!err) return { network: false, message: String(error) };

  if (err.name === 'AbortError' || err.name === 'TimeoutError') {
    return { network: true, message: `timeout after ${timeoutMs}ms` };
  }

  const code = causeCode(err);
  const network =
    (code !== undefined && NETWORK_ERROR_CODES.has(code)) ||
    (err.name === 'TypeError' && NETWORK_ERROR_MESSAGES.has(err.message));

  return { network, message: code ? `${err.message} (${code})` : err.message };
}
