/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Lifetime rules for the site's Server-Sent Events streams.
 *
 * Cloud Run ends every request at the service's request timeout (300s, set by
 * `--timeout` in cloudbuild.yaml). A stream left open that long is cut by the
 * platform mid-response, which logs "Truncated response body" and hands the
 * client a broken connection instead of a clean end. Streams therefore close
 * themselves a margin before that, after telling the client how soon to
 * reconnect; EventSource reconnects on its own and sends the last event id
 * back so the stream can resume without repeating itself.
 *
 * @module lib/sse-lifetime
 */

/** The service's Cloud Run request timeout. Keep in step with cloudbuild.yaml `--timeout`. */
export const CLOUD_RUN_REQUEST_TIMEOUT_MS = 300_000;

/** Head start a stream takes on the platform timeout so its close frame is delivered. */
const CLOSE_MARGIN_MS = 30_000;

/** How long a stream stays open before closing itself cleanly. */
export const SSE_MAX_DURATION_MS = CLOUD_RUN_REQUEST_TIMEOUT_MS - CLOSE_MARGIN_MS;

/** Reconnect delay advertised to EventSource with the `retry:` field. */
export const SSE_RETRY_MS = 3_000;

/** The `retry:` frame to send first, so a client reconnects promptly after a close. */
export function sseRetryFrame(): string {
  return `retry: ${SSE_RETRY_MS}\n\n`;
}

/** The frame a stream sends just before it closes itself at SSE_MAX_DURATION_MS. */
export function sseCloseFrame(): string {
  return `event: close\ndata: ${JSON.stringify({
    reason: 'max_duration_reached',
    message: `Stream closed after ${Math.round(SSE_MAX_DURATION_MS / 1000)}s. Reconnect to keep receiving updates.`,
    retryMs: SSE_RETRY_MS,
  })}\n\n`;
}

/**
 * Strip characters that would end an SSE field early. An `id:` value must stay
 * on one line or the client parses the remainder as a new field.
 */
export function sseEventId(value: string): string {
  return value.replace(/[\r\n]/g, '');
}
