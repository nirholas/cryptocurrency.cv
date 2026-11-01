/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Reading a JSON request body without turning a client mistake into a 500.
 *
 * `await request.json()` throws a SyntaxError on an empty or malformed body.
 * Inside a handler's catch-all that becomes "500 Internal server error" and an
 * error log entry, although the caller sent a bad request. `readJsonBody`
 * returns either the parsed body or a ready 400 response:
 *
 * ```ts
 * const parsed = await readJsonBody<CreateAlert>(request);
 * if (!parsed.ok) return parsed.response;
 * const body = parsed.body;
 * ```
 *
 * The body is typed like `Request#json()` (`any` unless a type is given), so
 * validation stays the caller's job.
 *
 * @module lib/json-body
 */

import { NextResponse } from 'next/server';

export const INVALID_JSON_BODY_MESSAGE = 'Request body must be valid JSON';

export interface InvalidJsonBody {
  error: 'Invalid JSON';
  message: string;
}

export type JsonBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse<InvalidJsonBody> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Request#json(), which returns any
export async function readJsonBody<T = any>(request: Request): Promise<JsonBodyResult<T>> {
  try {
    return { ok: true, body: (await request.json()) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json<InvalidJsonBody>(
        { error: 'Invalid JSON', message: INVALID_JSON_BODY_MESSAGE },
        { status: 400 },
      ),
    };
  }
}
