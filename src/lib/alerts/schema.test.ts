/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Tests for lib/alerts/schema.ts
 * Covers notification-channel validation, the per-channel endpoint
 * requirements, SSRF host filtering, and the request-to-record mapping.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  NOTIFICATION_CHANNELS,
  notificationChannelSchema,
  alertDeliverySchema,
  alertNotificationSchema,
  alertNotificationUpdateSchema,
  alertRuleChannelsSchema,
  resolveNotificationSettings,
  isAllowedWebhookHost,
  formatIssues,
} from './schema';

const ORIGINAL_ENV = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

/** Run `fn` with NODE_ENV pinned to production, then restore it. */
function asProduction<T>(run: () => T): T {
  mutableEnv.NODE_ENV = 'production';
  try {
    return run();
  } finally {
    mutableEnv.NODE_ENV = ORIGINAL_ENV;
  }
}

afterEach(() => {
  mutableEnv.NODE_ENV = ORIGINAL_ENV;
});

// ─── Channels ───────────────────────────────────────────────────────────────

describe('notificationChannelSchema', () => {
  it('accepts every shipped channel', () => {
    for (const channel of NOTIFICATION_CHANNELS) {
      expect(notificationChannelSchema.safeParse(channel).success).toBe(true);
    }
  });

  it('includes the three push channels this release adds', () => {
    expect(NOTIFICATION_CHANNELS).toEqual(
      expect.arrayContaining(['webhook', 'telegram', 'discord']),
    );
  });

  it('rejects an unknown channel instead of silently dropping it', () => {
    expect(notificationChannelSchema.safeParse('carrier-pigeon').success).toBe(false);
    expect(notificationChannelSchema.safeParse('sms').success).toBe(false);
    expect(notificationChannelSchema.safeParse('').success).toBe(false);
  });
});

describe('alertRuleChannelsSchema', () => {
  it('accepts the one supported rule channel', () => {
    expect(alertRuleChannelsSchema.safeParse(['websocket']).success).toBe(true);
  });

  it('rejects a typo rather than filtering it away', () => {
    const parsed = alertRuleChannelsSchema.safeParse(['websockets']);
    expect(parsed.success).toBe(false);
  });

  it('rejects an empty array, which would notify nobody', () => {
    expect(alertRuleChannelsSchema.safeParse([]).success).toBe(false);
  });
});

// ─── Endpoint validation ────────────────────────────────────────────────────

describe('alertDeliverySchema', () => {
  it('accepts a public https webhook URL', () => {
    const parsed = alertDeliverySchema.safeParse({
      webhookUrl: 'https://hooks.example.com/alerts',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a non-URL', () => {
    expect(alertDeliverySchema.safeParse({ webhookUrl: 'not a url' }).success).toBe(false);
  });

  it('rejects unknown keys so a typo is not silently ignored', () => {
    const parsed = alertDeliverySchema.safeParse({
      webhookUrl: 'https://hooks.example.com/a',
      webhokSecret: 'typo',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires a webhook secret long enough for the HMAC to be worth signing', () => {
    expect(
      alertDeliverySchema.safeParse({
        webhookUrl: 'https://hooks.example.com/a',
        webhookSecret: 'short',
      }).success,
    ).toBe(false);

    expect(
      alertDeliverySchema.safeParse({
        webhookUrl: 'https://hooks.example.com/a',
        webhookSecret: 'sixteen-chars-ok',
      }).success,
    ).toBe(true);
  });

  it('only accepts Discord webhook URLs for the Discord field', () => {
    expect(
      alertDeliverySchema.safeParse({
        discordWebhookUrl: 'https://discord.com/api/webhooks/123/abc',
      }).success,
    ).toBe(true);

    expect(
      alertDeliverySchema.safeParse({
        discordWebhookUrl: 'https://evil.example.com/api/webhooks/123/abc',
      }).success,
    ).toBe(false);
  });

  it('validates the Telegram bot token and chat id formats', () => {
    expect(
      alertDeliverySchema.safeParse({
        telegramBotToken: '123456789:AAH1nOtaReAlToKeNbUtLoNgEnOuGh12345',
        telegramChatId: '-1001234567890',
      }).success,
    ).toBe(true);

    expect(alertDeliverySchema.safeParse({ telegramBotToken: 'nope' }).success).toBe(false);
    expect(alertDeliverySchema.safeParse({ telegramChatId: 'not a chat' }).success).toBe(false);
    expect(alertDeliverySchema.safeParse({ telegramChatId: '@newschannel' }).success).toBe(true);
  });
});

describe('isAllowedWebhookHost', () => {
  it('allows loopback outside production so a local receiver can be tested', () => {
    expect(isAllowedWebhookHost('localhost')).toBe(true);
  });

  it('blocks loopback, link-local, and private ranges in production', () => {
    asProduction(() => {
      expect(isAllowedWebhookHost('localhost')).toBe(false);
      expect(isAllowedWebhookHost('127.0.0.1')).toBe(false);
      expect(isAllowedWebhookHost('10.0.0.5')).toBe(false);
      expect(isAllowedWebhookHost('192.168.1.10')).toBe(false);
      expect(isAllowedWebhookHost('172.16.4.4')).toBe(false);
      expect(isAllowedWebhookHost('169.254.169.254')).toBe(false);
      expect(isAllowedWebhookHost('metadata.internal')).toBe(false);
    });
  });

  it('allows a public host in production', () => {
    asProduction(() => {
      expect(isAllowedWebhookHost('hooks.example.com')).toBe(true);
      expect(isAllowedWebhookHost('discord.com')).toBe(true);
    });
  });
});

// ─── Channel / delivery agreement ───────────────────────────────────────────

describe('alertNotificationSchema', () => {
  it('defaults to the none channel when nothing is sent', () => {
    const parsed = alertNotificationSchema.safeParse({});
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.notificationChannel).toBe('none');
  });

  it('requires a webhook URL when the webhook channel is selected', () => {
    const parsed = alertNotificationSchema.safeParse({ notificationChannel: 'webhook' });
    expect(parsed.success).toBe(false);
    expect(parsed.success === false && formatIssues(parsed.error)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'delivery.webhookUrl' }),
      ]),
    );
  });

  it('accepts the webhook channel once the URL is present', () => {
    const parsed = alertNotificationSchema.safeParse({
      notificationChannel: 'webhook',
      delivery: { webhookUrl: 'https://hooks.example.com/alerts' },
    });
    expect(parsed.success).toBe(true);
  });

  it('requires both Telegram fields', () => {
    const parsed = alertNotificationSchema.safeParse({
      notificationChannel: 'telegram',
      delivery: { telegramBotToken: '123456789:AAH1nOtaReAlToKeNbUtLoNgEnOuGh12345' },
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success === false && formatIssues(parsed.error)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'delivery.telegramChatId' }),
      ]),
    );
  });

  it('requires a Discord webhook URL for the discord channel', () => {
    expect(alertNotificationSchema.safeParse({ notificationChannel: 'discord' }).success).toBe(
      false,
    );
  });

  it('requires an email address for the email channel', () => {
    expect(alertNotificationSchema.safeParse({ notificationChannel: 'email' }).success).toBe(false);
    expect(
      alertNotificationSchema.safeParse({
        notificationChannel: 'email',
        email: 'reader@example.com',
      }).success,
    ).toBe(true);
  });

  it('checks every channel in a multi-channel notifyVia array', () => {
    const parsed = alertNotificationSchema.safeParse({
      notifyVia: ['push', 'webhook', 'discord'],
      delivery: { webhookUrl: 'https://hooks.example.com/a' },
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success === false && formatIssues(parsed.error)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'delivery.discordWebhookUrl' }),
      ]),
    );
  });

  it('accepts a fully configured multi-channel alert', () => {
    const parsed = alertNotificationSchema.safeParse({
      notifyVia: ['push', 'webhook', 'discord'],
      delivery: {
        webhookUrl: 'https://hooks.example.com/a',
        discordWebhookUrl: 'https://discord.com/api/webhooks/1/abc',
      },
    });
    expect(parsed.success).toBe(true);
  });
});

describe('alertNotificationUpdateSchema', () => {
  it('accepts an empty update', () => {
    expect(alertNotificationUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('still enforces the endpoint requirement on the channel being set', () => {
    expect(
      alertNotificationUpdateSchema.safeParse({ notificationChannel: 'telegram' }).success,
    ).toBe(false);
  });
});

// ─── Request mapping ────────────────────────────────────────────────────────

describe('resolveNotificationSettings', () => {
  it('falls back to push when the channel is none', () => {
    const resolved = resolveNotificationSettings({ notificationChannel: 'none' });
    expect(resolved.notifyVia).toEqual(['push']);
    expect(resolved.generatedWebhookSecret).toBeUndefined();
  });

  it('turns a single channel into the notifyVia list', () => {
    const resolved = resolveNotificationSettings({
      notificationChannel: 'discord',
      delivery: { discordWebhookUrl: 'https://discord.com/api/webhooks/1/a' },
    });
    expect(resolved.notifyVia).toEqual(['discord']);
  });

  it('prefers an explicit notifyVia array', () => {
    const resolved = resolveNotificationSettings({
      notificationChannel: 'discord',
      notifyVia: ['push', 'email'],
    });
    expect(resolved.notifyVia).toEqual(['push', 'email']);
  });

  it('mints a signing secret when a webhook alert did not supply one', () => {
    const resolved = resolveNotificationSettings({
      notificationChannel: 'webhook',
      delivery: { webhookUrl: 'https://hooks.example.com/a' },
    });
    expect(resolved.generatedWebhookSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(resolved.delivery?.webhookSecret).toBe(resolved.generatedWebhookSecret);
  });

  it('keeps a secret the caller supplied', () => {
    const resolved = resolveNotificationSettings({
      notificationChannel: 'webhook',
      delivery: {
        webhookUrl: 'https://hooks.example.com/a',
        webhookSecret: 'caller-supplied-secret',
      },
    });
    expect(resolved.generatedWebhookSecret).toBeUndefined();
    expect(resolved.delivery?.webhookSecret).toBe('caller-supplied-secret');
  });

  it('does not mutate the input delivery block', () => {
    const delivery = { webhookUrl: 'https://hooks.example.com/a' };
    resolveNotificationSettings({ notificationChannel: 'webhook', delivery });
    expect(delivery).toEqual({ webhookUrl: 'https://hooks.example.com/a' });
  });
});

describe('formatIssues', () => {
  it('flattens a ZodError into field / message pairs', () => {
    const parsed = alertNotificationSchema.safeParse({ notificationChannel: 'webhook' });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const issues = formatIssues(parsed.error);
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(typeof issue.field).toBe('string');
      expect(typeof issue.message).toBe('string');
    }
  });
});
