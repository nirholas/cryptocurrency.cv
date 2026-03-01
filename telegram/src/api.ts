/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { API_BASE, USER_AGENT } from './config.js';

// ---------------------------------------------------------------------------
// API Client — thin wrapper over the cryptocurrency.cv REST API
// ---------------------------------------------------------------------------

export async function apiFetch<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  timeoutMs = 15_000,
): Promise<T> {
  const url = new URL(path, API_BASE.replace(/\/api$/, ''));
  if (!url.pathname.startsWith('/api')) {
    url.pathname = '/api' + url.pathname;
  }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}
