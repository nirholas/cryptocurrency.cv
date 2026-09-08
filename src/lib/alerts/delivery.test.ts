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
 * Tests for lib/alerts/delivery.ts
 * Covers HMAC-SHA256 payload signing, signature verification, and the
 * per-channel transports for webhook / Discord / Telegram alerts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  signAlertPayload,
  verifyAlertSignature,
  generateWebhookSecret,
  isDeliverableChannel,
  deliverAlert,
  deliverAlertToChannels,
  deliverWebhook,
  deliverDiscord,
  deliverTelegram,
  DELIVERY_RETRIES,
  DELIVERY_TIMEOUT_MS,
  SIGNATURE_HEADER,
  SIGNATURE_PREFIX,
  type AlertDeliveryPayload,
} from './delivery';

const mockResilientFetchResponse = vi.hoisted(() => vi.fn());

vi.mock('@/lib/resilient-fetch', () => ({
  resilientFetchResponse: mockResilientFetchResponse,
}));

const PAYLOAD: AlertDeliveryPayload = {
  event: 'alert.triggered',
  alertId: 'pa_test123',
  type: 'price_above',
  title: 'Bitcoin (BTC)',
  message: 'Bitcoin is now $70,000 (above $65,000)',
  triggeredAt: '2026-08-28T00:00:00.000Z',
  url: 'https://cryptocurrency.cv/coin/bitcoin',
  coin: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  threshold: 65000,
  price: 70000,
};

function ok(status = 204) {
  return { ok: true, status, text: async () => '' } as unknown as Response;
}

function notOk(status: number, body = '') {
  return { ok: false, status, text: async () => body } as unknown as Response;
}

beforeEach(() => {
  mockResilientFetchResponse.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Signing ────────────────────────────────────────────────────────────────

describe('signAlertPayload', () => {
  it('matches an independent HMAC-SHA256 of the raw body', async () => {
    const secret = 'a-test-secret-at-least-16-chars';
    const rawBody = JSON.stringify(PAYLOAD);

    const signature = await signAlertPayload(secret, rawBody);
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    expect(signature).toBe(`${SIGNATURE_PREFIX}${expected}`);
  });

  it('produces a sha256= prefix and 64 hex characters', async () => {
    const signature = await signAlertPayload('secret-secret-secret', 'body');
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('is deterministic for the same secret and body', async () => {
    const a = await signAlertPayload('secret-secret-secret', '{"a":1}');
    const b = await signAlertPayload('secret-secret-secret', '{"a":1}');
    expect(a).toBe(b);
  });

  it('changes when a single byte of the body changes', async () => {
    const a = await signAlertPayload('secret-secret-secret', '{"price":70000}');
    const b = await signAlertPayload('secret-secret-secret', '{"price":70001}');
    expect(a).not.toBe(b);
  });

  it('changes when the secret changes', async () => {
    const a = await signAlertPayload('secret-secret-secret-a', '{"a":1}');
    const b = await signAlertPayload('secret-secret-secret-b', '{"a":1}');
    expect(a).not.toBe(b);
  });

  it('rejects an empty secret rather than signing with one', async () => {
    await expect(signAlertPayload('', 'body')).rejects.toThrow(/non-empty secret/);
  });
});

describe('verifyAlertSignature', () => {
  const secret = 'verification-secret-key';
  const rawBody = JSON.stringify(PAYLOAD);

  it('accepts a signature this module produced', async () => {
    const signature = await signAlertPayload(secret, rawBody);
    await expect(verifyAlertSignature(secret, rawBody, signature)).resolves.toBe(true);
  });

  it('rejects a signature made with a different secret', async () => {
    const signature = await signAlertPayload('another-secret-entirely', rawBody);
    await expect(verifyAlertSignature(secret, rawBody, signature)).resolves.toBe(false);
  });

  it('rejects when the body was modified in flight', async () => {
    const signature = await signAlertPayload(secret, rawBody);
    const tampered = rawBody.replace('70000', '1');
    await expect(verifyAlertSignature(secret, tampered, signature)).resolves.toBe(false);
  });

  it('rejects a missing or unprefixed header', async () => {
    const signature = await signAlertPayload(secret, rawBody);
    await expect(verifyAlertSignature(secret, rawBody, null)).resolves.toBe(false);
    await expect(verifyAlertSignature(secret, rawBody, '')).resolves.toBe(false);
    await expect(
      verifyAlertSignature(secret, rawBody, signature.replace(SIGNATURE_PREFIX, '')),
    ).resolves.toBe(false);
  });

  it('rejects when no secret is configured', async () => {
    const signature = await signAlertPayload(secret, rawBody);
    await expect(verifyAlertSignature('', rawBody, signature)).resolves.toBe(false);
  });
});

describe('generateWebhookSecret', () => {
  it('returns 64 hex characters (256 bits)', () => {
    expect(generateWebhookSecret()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not repeat', () => {
    const secrets = new Set(Array.from({ length: 20 }, () => generateWebhookSecret()));
    expect(secrets.size).toBe(20);
  });
});

// ─── Channel routing ────────────────────────────────────────────────────────

describe('isDeliverableChannel', () => {
  it('claims the three push channels', () => {
    expect(isDeliverableChannel('webhook')).toBe(true);
    expect(isDeliverableChannel('telegram')).toBe(true);
    expect(isDeliverableChannel('discord')).toBe(true);
  });

  it('leaves email, push, and none to their own pipelines', () => {
    expect(isDeliverableChannel('email')).toBe(false);
    expect(isDeliverableChannel('push')).toBe(false);
    expect(isDeliverableChannel('none')).toBe(false);
  });
});

// ─── Webhook ────────────────────────────────────────────────────────────────

describe('deliverWebhook', () => {
  it('POSTs the payload and signs the exact bytes it sends', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok(200));
    const secret = 'webhook-signing-secret';

    const result = await deliverWebhook(
      { webhookUrl: 'https://hooks.example.com/alerts', webhookSecret: secret },
      PAYLOAD,
    );

    expect(result).toMatchObject({ channel: 'webhook', delivered: true, status: 200 });

    const [url, options] = mockResilientFetchResponse.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/alerts');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Alert-Id']).toBe('pa_test123');

    const sentSignature = options.headers[SIGNATURE_HEADER];
    await expect(verifyAlertSignature(secret, options.body as string, sentSignature)).resolves.toBe(
      true,
    );
    expect(JSON.parse(options.body as string)).toEqual(PAYLOAD);
  });

  it('applies the 5s timeout and 3 retries', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());
    await deliverWebhook({ webhookUrl: 'https://hooks.example.com/alerts' }, PAYLOAD);

    const [, options] = mockResilientFetchResponse.mock.calls[0];
    expect(options.timeoutMs).toBe(DELIVERY_TIMEOUT_MS);
    expect(options.timeoutMs).toBe(5000);
    expect(options.retries).toBe(DELIVERY_RETRIES);
    expect(options.retries).toBe(3);
  });

  it('breaks the circuit per host so one dead endpoint cannot stall the rest', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());
    await deliverWebhook({ webhookUrl: 'https://a.example.com/hook' }, PAYLOAD);
    await deliverWebhook({ webhookUrl: 'https://b.example.com/hook' }, PAYLOAD);

    expect(mockResilientFetchResponse.mock.calls[0][1].service).toBe('alert-webhook:a.example.com');
    expect(mockResilientFetchResponse.mock.calls[1][1].service).toBe('alert-webhook:b.example.com');
  });

  it('omits the signature header when the alert has no secret', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());
    await deliverWebhook({ webhookUrl: 'https://hooks.example.com/alerts' }, PAYLOAD);

    const [, options] = mockResilientFetchResponse.mock.calls[0];
    expect(options.headers[SIGNATURE_HEADER]).toBeUndefined();
  });

  it('reports a non-2xx response instead of throwing', async () => {
    mockResilientFetchResponse.mockResolvedValue(notOk(410, 'gone'));

    const result = await deliverWebhook({ webhookUrl: 'https://hooks.example.com/x' }, PAYLOAD);

    expect(result.delivered).toBe(false);
    expect(result.status).toBe(410);
    expect(result.error).toContain('410');
  });

  it('reports a transport failure instead of throwing', async () => {
    mockResilientFetchResponse.mockRejectedValue(new Error('ETIMEDOUT'));

    const result = await deliverWebhook({ webhookUrl: 'https://hooks.example.com/x' }, PAYLOAD);

    expect(result).toMatchObject({ delivered: false, status: 0 });
    expect(result.error).toContain('ETIMEDOUT');
  });

  it('fails cleanly when no webhookUrl is configured', async () => {
    const result = await deliverWebhook({}, PAYLOAD);
    expect(result.delivered).toBe(false);
    expect(result.error).toContain('webhookUrl');
    expect(mockResilientFetchResponse).not.toHaveBeenCalled();
  });
});

// ─── Discord ────────────────────────────────────────────────────────────────

describe('deliverDiscord', () => {
  it('sends Discord embed shape', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());

    const result = await deliverDiscord(
      { discordWebhookUrl: 'https://discord.com/api/webhooks/1/abc' },
      PAYLOAD,
    );

    expect(result.delivered).toBe(true);
    const body = JSON.parse(mockResilientFetchResponse.mock.calls[0][1].body as string);
    expect(body.embeds).toHaveLength(1);
    expect(body.embeds[0].title).toBe('Bitcoin (BTC)');
    expect(body.embeds[0].description).toBe(PAYLOAD.message);
    expect(body.embeds[0].url).toBe(PAYLOAD.url);
    expect(body.embeds[0].fields).toEqual(
      expect.arrayContaining([{ name: 'Threshold', value: '65000', inline: true }]),
    );
  });

  it('lists matched keywords for a keyword alert', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());

    await deliverDiscord(
      { discordWebhookUrl: 'https://discord.com/api/webhooks/1/abc' },
      {
        event: 'alert.triggered',
        alertId: 'ka_1',
        type: 'keyword',
        title: 'SEC approves spot ETF',
        message: 'Matched etf in "SEC approves spot ETF"',
        triggeredAt: '2026-08-28T00:00:00.000Z',
        url: 'https://example.com/article',
        keywords: ['etf', 'sec'],
      },
    );

    const body = JSON.parse(mockResilientFetchResponse.mock.calls[0][1].body as string);
    expect(body.embeds[0].title).toBe('SEC approves spot ETF');
    expect(body.embeds[0].fields).toEqual(
      expect.arrayContaining([{ name: 'Keywords', value: 'etf, sec', inline: false }]),
    );
  });

  it('fails cleanly with no URL configured', async () => {
    const result = await deliverDiscord({}, PAYLOAD);
    expect(result.delivered).toBe(false);
    expect(result.error).toContain('discordWebhookUrl');
  });
});

// ─── Telegram ───────────────────────────────────────────────────────────────

describe('deliverTelegram', () => {
  const config = { telegramBotToken: '123456789:AA-token', telegramChatId: '-1001234567890' };

  it('calls sendMessage on the bot token and passes the chat id', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok(200));

    const result = await deliverTelegram(config, PAYLOAD);

    expect(result.delivered).toBe(true);
    const [url, options] = mockResilientFetchResponse.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bot123456789:AA-token/sendMessage');

    const body = JSON.parse(options.body as string);
    expect(body.chat_id).toBe('-1001234567890');
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('<b>Bitcoin (BTC)</b>');
    expect(body.text).toContain(PAYLOAD.url);
  });

  it('escapes HTML so a crafted coin name cannot inject markup', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());

    await deliverTelegram(config, {
      ...PAYLOAD,
      coin: { id: 'x', symbol: 'x', name: '<script>alert(1)</script>' },
    });

    const body = JSON.parse(mockResilientFetchResponse.mock.calls[0][1].body as string);
    expect(body.text).not.toContain('<script>');
    expect(body.text).toContain('&lt;script&gt;');
  });

  it('requires both the token and the chat id', async () => {
    const missingChat = await deliverTelegram({ telegramBotToken: '1:aa' }, PAYLOAD);
    expect(missingChat.delivered).toBe(false);
    expect(missingChat.error).toContain('telegramChatId');
    expect(mockResilientFetchResponse).not.toHaveBeenCalled();
  });
});

// ─── Dispatcher ─────────────────────────────────────────────────────────────

describe('deliverAlert', () => {
  it('routes each push channel to its transport', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());

    await deliverAlert('webhook', { webhookUrl: 'https://hooks.example.com/a' }, PAYLOAD);
    expect(mockResilientFetchResponse.mock.calls[0][0]).toBe('https://hooks.example.com/a');

    await deliverAlert(
      'discord',
      { discordWebhookUrl: 'https://discord.com/api/webhooks/1/a' },
      PAYLOAD,
    );
    expect(mockResilientFetchResponse.mock.calls[1][0]).toContain('discord.com');

    await deliverAlert('telegram', { telegramBotToken: '1:aa', telegramChatId: '5' }, PAYLOAD);
    expect(mockResilientFetchResponse.mock.calls[2][0]).toContain('api.telegram.org');
  });

  it('skips channels it does not own without calling the network', async () => {
    for (const channel of ['email', 'push', 'none'] as const) {
      const result = await deliverAlert(channel, {}, PAYLOAD);
      expect(result.skipped).toBe(true);
      expect(result.delivered).toBe(false);
    }
    expect(mockResilientFetchResponse).not.toHaveBeenCalled();
  });
});

describe('deliverAlertToChannels', () => {
  it('delivers on every push channel and ignores the rest', async () => {
    mockResilientFetchResponse.mockResolvedValue(ok());

    const results = await deliverAlertToChannels(
      ['push', 'webhook', 'email', 'telegram'],
      {
        webhookUrl: 'https://hooks.example.com/a',
        telegramBotToken: '1:aa',
        telegramChatId: '5',
      },
      PAYLOAD,
    );

    expect(results.map((r) => r.channel)).toEqual(['webhook', 'telegram']);
    expect(results.every((r) => r.delivered)).toBe(true);
    expect(mockResilientFetchResponse).toHaveBeenCalledTimes(2);
  });

  it('returns nothing and makes no request when only non-push channels are set', async () => {
    const results = await deliverAlertToChannels(['push', 'email'], {}, PAYLOAD);
    expect(results).toEqual([]);
    expect(mockResilientFetchResponse).not.toHaveBeenCalled();
  });

  it('reports one failure without losing the other channel', async () => {
    mockResilientFetchResponse
      .mockResolvedValueOnce(notOk(500, 'boom'))
      .mockResolvedValueOnce(ok());

    const results = await deliverAlertToChannels(
      ['webhook', 'telegram'],
      {
        webhookUrl: 'https://hooks.example.com/a',
        telegramBotToken: '1:aa',
        telegramChatId: '5',
      },
      PAYLOAD,
    );

    expect(results).toHaveLength(2);
    expect(results[0].delivered).toBe(false);
    expect(results[1].delivered).toBe(true);
  });
});
