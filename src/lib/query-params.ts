/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Parsing for numeric query parameters.
 *
 * `Math.min(parseInt(raw), max)` is NaN for `?limit=abc` and passes negative
 * values through, and NaN then flows into `slice`, `Date#setDate` or an
 * upstream URL. `intParam` returns the fallback for anything that is not an
 * integer and clamps the rest into range.
 *
 * @module lib/query-params
 */

export interface IntParamOptions {
  /** Value used when the parameter is absent or not an integer. */
  fallback: number;
  min: number;
  max: number;
}

/** Read `name` from `params` as an integer clamped to `[min, max]`. */
export function intParam(params: URLSearchParams, name: string, { fallback, min, max }: IntParamOptions): number {
  const parsed = Number.parseInt(params.get(name) ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
