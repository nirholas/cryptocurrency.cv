/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendProvider, ConsoleProvider } from './provider';

describe('ResendProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends email via Resend API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'resend_123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const provider = new ResendProvider('test_key', 'Test <test@test.com>');
    const result = await provider.send({
      to: 'user@test.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
      tags: [{ name: 'type', value: 'test' }],
    });

    expect(result.id).toBe('resend_123');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test_key');

    const body = JSON.parse(opts.body);
    expect(body.to).toBe('user@test.com');
    expect(body.subject).toBe('Test Subject');
    expect(body.from).toBe('Test <test@test.com>');
  });

  it('throws on API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Validation failed'),
      }),
    );

    const provider = new ResendProvider('test_key');
    await expect(
      provider.send({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      }),
    ).rejects.toThrow('Resend API error (422): Validation failed');
  });
});

describe('ConsoleProvider', () => {
  it('logs email and returns a console ID', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const provider = new ConsoleProvider();

    const result = await provider.send({
      to: 'user@test.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result.id).toMatch(/^console_/);
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
