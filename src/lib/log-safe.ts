/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Neutralise a value before it goes into a log line.
 *
 * Request-derived strings (query params, headers, upstream error messages)
 * can carry CR/LF and other line terminators, which let a caller forge extra
 * log entries. `logSafe` stringifies the value, replaces every line
 * terminator and control character with a space, and caps the length so one
 * field cannot flood the log.
 *
 * @module lib/log-safe
 */

const MAX_LOG_FIELD = 1000;

export function logSafe(value: unknown, maxLength = MAX_LOG_FIELD): string {
  let text: string;
  if (value instanceof Error) {
    text = value.message;
  } else if (typeof value === 'string') {
    text = value;
  } else {
    try {
      text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
    } catch {
      text = String(value);
    }
  }
  // Control characters (CR and LF included) become spaces. The trailing
  // \n|\r strip is then a no-op at runtime, but it is the form CodeQL's
  // log-injection query recognises as a sanitiser.
  const clean = text
    .replace(/[\u2028\u2029\u0000-\u001f\u007f]/g, ' ')
    .replace(/\n|\r/g, '');
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}…` : clean;
}
