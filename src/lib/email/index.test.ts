/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Email Index', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it('returns a provider with send() when no RESEND_API_KEY', async () => {
    const { getEmailProvider } = await import('./index');
    const provider = getEmailProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.send).toBe('function');
  });

  it('sendEmail delegates to provider', async () => {
    // Spy on console.log to suppress ConsoleProvider output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { sendEmail } = await import('./index');
    const result = await sendEmail({
      to: 'test@test.com',
      subject: 'Test',
      html: '<p>test</p>',
    });
    expect(result.id).toMatch(/^console_/);
  });

  it('re-exports templates', async () => {
    const mod = await import('./index');
    expect(typeof mod.magicLinkEmail).toBe('function');
    expect(typeof mod.notificationDigestEmail).toBe('function');
    expect(typeof mod.alertTriggeredEmail).toBe('function');
    expect(typeof mod.welcomeEmail).toBe('function');
    expect(typeof mod.emailVerificationEmail).toBe('function');
  });
});
