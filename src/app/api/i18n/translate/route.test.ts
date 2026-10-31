import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as ai from '@/lib/ai-provider';

import { GET, POST } from './route';

function post(body: unknown): NextRequest {
  return new NextRequest('https://example.test/api/i18n/translate', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/i18n/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ai, 'isAIConfigured').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('translates a single text into a site locale', async () => {
    const complete = vi.spyOn(ai, 'aiComplete').mockResolvedValue('  Hola mundo \n');
    const res = await POST(post({ text: 'Hello world', targetLocale: 'es' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, translation: 'Hola mundo', locale: 'es', model: 'auto' });
    expect(complete.mock.calls[0][0]).toContain('from English to Spanish');
  });

  it('serves GET through the same handler', async () => {
    vi.spyOn(ai, 'aiComplete').mockResolvedValue('Bonjour');
    const res = await GET(new NextRequest('https://example.test/api/i18n/translate?text=Hello&locale=fr'));
    expect(res.status).toBe(200);
    expect((await res.json()).translation).toBe('Bonjour');
  });

  it('rejects malformed and out-of-bounds input with 400 before calling a provider', async () => {
    const complete = vi.spyOn(ai, 'aiComplete');
    const cases: unknown[] = [
      '{not json',
      { text: 'Hi' },
      { text: 'Hi', targetLocale: 'xx-INJECT' },
      { text: 'Hi', targetLocale: 'es', sourceLocale: 'klingon' },
      { text: 'Hi', targetLocale: 'es', context: 'x'.repeat(101) },
      { text: 'x'.repeat(4001), targetLocale: 'es' },
      { texts: { a: 1 }, targetLocale: 'es' },
      { texts: {}, targetLocale: 'es' },
      { texts: { a: 'x'.repeat(8001) }, targetLocale: 'es' },
    ];
    for (const body of cases) {
      const res = await POST(post(body));
      expect(res.status, JSON.stringify(body).slice(0, 60)).toBe(400);
    }
    expect(complete).not.toHaveBeenCalled();
  });

  it('returns exactly the requested keys from a batch', async () => {
    vi.spyOn(ai, 'promptAIJson').mockResolvedValue({ a: 'Hola', b: 'Mundo', extra: 'ignored' });
    const res = await POST(post({ texts: { a: 'Hello', b: 'World' }, targetLocale: 'es' }));
    expect(res.status).toBe(200);
    expect((await res.json()).translations).toEqual({ a: 'Hola', b: 'Mundo' });
  });

  it('answers 502 when the batch output drops a key or is not JSON', async () => {
    vi.spyOn(ai, 'promptAIJson').mockResolvedValueOnce({ a: 'Hola' });
    expect((await POST(post({ texts: { a: 'Hello', b: 'World' }, targetLocale: 'es' }))).status).toBe(502);

    vi.spyOn(ai, 'promptAIJson').mockRejectedValueOnce(new SyntaxError('Unexpected token'));
    expect((await POST(post({ texts: { a: 'Hello' }, targetLocale: 'es' }))).status).toBe(502);
  });

  it('maps provider quota and rate-limit failures to 503 without leaking details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(ai, 'aiComplete').mockRejectedValue(new ai.AIRateLimitError('groq', 429, 'secret upstream detail'));
    const res = await POST(post({ text: 'Hello', targetLocale: 'es' }));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('secret upstream detail');
  });

  it('hides unexpected error messages behind a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(ai, 'aiComplete').mockRejectedValue(new Error('internal stack detail'));
    const res = await POST(post({ text: 'Hello', targetLocale: 'es' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Translation failed');
  });

  it('answers 503 when no provider is configured', async () => {
    vi.spyOn(ai, 'isAIConfigured').mockReturnValue(false);
    const res = await POST(post({ text: 'Hello', targetLocale: 'es' }));
    expect(res.status).toBe(503);
  });
});
