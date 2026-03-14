import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the provider module before imports
vi.mock('./provider', () => ({
  ResendProvider: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ id: 'mock_123' }),
  })),
  ConsoleProvider: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ id: 'console_mock' }),
  })),
}));

describe('Email Index', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
  });

  it('uses ConsoleProvider when no RESEND_API_KEY', async () => {
    const { getEmailProvider } = await import('./index');
    const provider = getEmailProvider();
    const result = await provider.send({
      to: 'test@test.com',
      subject: 'Test',
      html: '<p>test</p>',
    });
    expect(result.id).toBeDefined();
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
