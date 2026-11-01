import { describe, expect, it } from 'vitest';

import { INVALID_JSON_BODY_MESSAGE, readJsonBody } from './json-body';

function post(body?: string) {
  return new Request('http://localhost/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('readJsonBody', () => {
  it('returns the parsed body', async () => {
    const result = await readJsonBody<{ a: number }>(post('{"a":1}'));

    expect(result).toEqual({ ok: true, body: { a: 1 } });
  });

  it.each([
    ['malformed JSON', '{"a":'],
    ['an empty body', undefined],
    ['plain text', 'hello'],
  ])('returns a 400 for %s', async (_label, body) => {
    const result = await readJsonBody(post(body));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    expect(await result.response.json()).toEqual({ error: 'Invalid JSON', message: INVALID_JSON_BODY_MESSAGE });
  });

  it('accepts JSON scalars, leaving shape checks to the caller', async () => {
    expect(await readJsonBody(post('null'))).toEqual({ ok: true, body: null });
    expect(await readJsonBody(post('[1,2]'))).toEqual({ ok: true, body: [1, 2] });
  });
});
