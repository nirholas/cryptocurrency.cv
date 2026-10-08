/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { aiAuthErrorResponse } from './_utils';

describe('aiAuthErrorResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers 503 with a Retry-After hint', async () => {
    const response = aiAuthErrorResponse();
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('120');
    const body = await response.json();
    expect(body.error).toBe('AI service temporarily unavailable');
  });

  it('logs the upstream provider error instead of returning it to the caller', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const upstream =
      'groq rate-limited / out of quota (429): Rate limit reached in organization `org_synthetic123` on tokens per day';

    const response = aiAuthErrorResponse(upstream);
    const text = await response.text();

    expect(text).not.toContain('org_synthetic123');
    expect(JSON.parse(text).details).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.any(String), upstream);
  });
});
