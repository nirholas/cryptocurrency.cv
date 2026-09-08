/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * The only network access in the package: one timed, non-throwing fetch.
 *
 * @module http
 */

export interface FetchResult {
  status: number;
  headers?: Headers;
  json?: unknown;
  text?: string;
  error?: string;
}

export interface FetchOptions {
  method?: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
  userAgent: string;
  body?: string;
  accept?: string;
}

/**
 * Fetch a URL and always resolve. A probe that throws is a finding, not an
 * exception: the audit has to keep going and report what it saw.
 */
export async function safeFetch(url: string, options: FetchOptions): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const headers: Record<string, string> = {
      accept: options.accept ?? 'application/json',
      'user-agent': options.userAgent,
    };
    if (options.body !== undefined) headers['content-type'] = 'application/json';

    const response = await options.fetchImpl(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body,
      signal: controller.signal,
      redirect: 'follow',
    });

    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: response.status, headers: response.headers, json, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 0,
      error: message.includes('abort') ? `timed out after ${options.timeoutMs}ms` : message,
    };
  } finally {
    clearTimeout(timer);
  }
}
