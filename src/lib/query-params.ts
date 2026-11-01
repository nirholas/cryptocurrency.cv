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

/** Read `name` from `params` as a finite number clamped to `[min, max]`. */
export function numParam(params: URLSearchParams, name: string, { fallback, min, max }: IntParamOptions): number {
  return optionalNumParam(params, name, { min, max }) ?? fallback;
}

export type OptionalParamOptions = Omit<IntParamOptions, 'fallback'>;

/**
 * Read `name` from `params` as a finite number clamped to `[min, max]`, or
 * `undefined` when the parameter is absent, empty or not a number.
 */
export function optionalNumParam(
  params: URLSearchParams,
  name: string,
  { min, max }: OptionalParamOptions,
): number | undefined {
  const parsed = Number.parseFloat(params.get(name) ?? '');
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(Math.max(parsed, min), max);
}

/** {@link optionalNumParam} for integers. */
export function optionalIntParam(
  params: URLSearchParams,
  name: string,
  { min, max }: OptionalParamOptions,
): number | undefined {
  const parsed = Number.parseInt(params.get(name) ?? '', 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Parse a client-supplied date (ISO string or epoch milliseconds). Returns
 * `undefined` for anything that does not yield a real date, so callers can
 * reject it instead of passing an Invalid Date (NaN) into filters or
 * `toISOString()`, which throws.
 */
export function parseDate(raw: unknown): Date | undefined {
  if (typeof raw === 'number') {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
