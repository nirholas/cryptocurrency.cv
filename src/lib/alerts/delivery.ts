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
 * Alert Delivery
 *
 * Push-style transports for a triggered alert. Three shapes:
 *
 *  - `webhook`  — a generic JSON POST to any URL the user owns. When the alert
 *    carries a secret the raw request body is signed with HMAC-SHA256 and sent
 *    as `X-Signature-256: sha256=<hex>`, so the receiver can prove the request
 *    came from us and was not modified in flight.
 *  - `discord`  — the same event rendered into Discord's webhook embed payload.
 *  - `telegram` — the same event rendered as HTML and sent through the Bot API.
 *
 * Every transport goes through `resilientFetchResponse`, so each delivery gets
 * a 5 second timeout, three retries with exponential back-off on transient
 * failures, and a per-host circuit breaker (per host, not per channel, so one
 * dead endpoint cannot stall deliveries to everybody else's).
 *
 * @example
 *   const result = await deliverAlert('webhook', alert.delivery, payload);
 *   if (!result.delivered) console.warn(result.error);
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';
import type { AlertType, NotificationChannel } from './service';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Per-attempt timeout. A webhook receiver that cannot answer in 5s is down. */
export const DELIVERY_TIMEOUT_MS = 5_000;

/** Retries after the first attempt, so four attempts in the worst case. */
export const DELIVERY_RETRIES = 3;

/** Header carrying the HMAC-SHA256 of the raw request body. */
export const SIGNATURE_HEADER = 'X-Signature-256';

/** Algorithm prefix on the signature value, mirroring the GitHub webhook format. */
export const SIGNATURE_PREFIX = 'sha256=';

const USER_AGENT = 'cryptocurrency.cv-alerts/1.0 (+https://cryptocurrency.cv/alerts)';

/** Channels this module can actually deliver. */
export const DELIVERABLE_CHANNELS = ['webhook', 'telegram', 'discord'] as const;

export type DeliverableChannel = (typeof DELIVERABLE_CHANNELS)[number];

// ─── Types ──────────────────────────────────────────────────────────────────

/** Per-alert endpoint configuration. Only the fields for the chosen channel are read. */
export interface AlertDeliveryConfig {
  /** Any URL you control. Receives the JSON payload below. */
  webhookUrl?: string;
  /** Shared secret used to sign the raw body. Generated for you when omitted. */
  webhookSecret?: string;
  /** A Discord channel webhook URL. */
  discordWebhookUrl?: string;
  /** Bot token from @BotFather. */
  telegramBotToken?: string;
  /** Numeric chat id, or an `@channelname`. */
  telegramChatId?: string;
}

/**
 * The JSON body POSTed to a `webhook` endpoint. This is the signed payload, so
 * nothing may be added to it after `signAlertPayload` has run.
 */
export interface AlertDeliveryPayload {
  event: 'alert.triggered';
  alertId: string;
  /** `keyword` for news alerts, otherwise the price alert's trigger type. */
  type: AlertType | 'keyword';
  /** Headline for the event: the coin name, or the matching article's title. */
  title: string;
  /** One sentence describing what happened, ready to display as-is. */
  message: string;
  /** ISO-8601 timestamp of the trigger. */
  triggeredAt: string;
  /** Deep link to the coin page, or to the matching article. */
  url: string;
  /** Price alerts only: the coin the alert watches. */
  coin?: { id: string; symbol: string; name: string };
  /** Price alerts only: the configured threshold. */
  threshold?: number;
  /** Price alerts only: the price at trigger time. */
  price?: number;
  /** Keyword alerts only: the keywords that matched. */
  keywords?: string[];
}

export interface DeliveryResult {
  channel: NotificationChannel;
  delivered: boolean;
  /** HTTP status from the receiver. 0 when the request never completed. */
  status: number;
  /** True when the channel is not one this module delivers (email, push, none). */
  skipped?: boolean;
  error?: string;
}

// ─── Signing ────────────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * HMAC-SHA256 the raw request body with the alert's secret.
 * Web Crypto so the same code runs on Node and on the Edge runtime.
 *
 * @returns the header value, e.g. `sha256=9f86d0…`
 */
export async function signAlertPayload(secret: string, rawBody: string): Promise<string> {
  if (!secret) throw new Error('signAlertPayload requires a non-empty secret');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  return `${SIGNATURE_PREFIX}${toHex(signature)}`;
}

/** Length-independent comparison so a mismatch does not leak its position via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify a signature a receiver got from us. Exported so integrators can copy
 * the exact check, and so the test suite proves the two halves agree.
 */
export async function verifyAlertSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null | undefined,
): Promise<boolean> {
  if (!secret || !signatureHeader) return false;
  if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) return false;
  const expected = await signAlertPayload(secret, rawBody);
  return safeEqual(expected, signatureHeader);
}

/** A fresh 256-bit hex secret, for alerts created without one. */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Transport ──────────────────────────────────────────────────────────────

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid';
  }
}

function failure(channel: NotificationChannel, error: string): DeliveryResult {
  return { channel, delivered: false, status: 0, error };
}

async function post(
  channel: NotificationChannel,
  url: string,
  rawBody: string,
  headers: Record<string, string>,
): Promise<DeliveryResult> {
  try {
    const response = await resilientFetchResponse(url, {
      method: 'POST',
      headers,
      body: rawBody,
      service: `alert-${channel}:${hostOf(url)}`,
      timeoutMs: DELIVERY_TIMEOUT_MS,
      retries: DELIVERY_RETRIES,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return {
        channel,
        delivered: false,
        status: response.status,
        error: `HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      };
    }

    return { channel, delivered: true, status: response.status };
  } catch (error) {
    return failure(channel, error instanceof Error ? error.message : String(error));
  }
}

// ─── Channels ───────────────────────────────────────────────────────────────

/**
 * Generic JSON webhook. The body is exactly `AlertDeliveryPayload`, and the
 * signature covers the raw body bytes, so verify before parsing.
 */
export async function deliverWebhook(
  config: AlertDeliveryConfig,
  payload: AlertDeliveryPayload,
): Promise<DeliveryResult> {
  if (!config.webhookUrl) return failure('webhook', 'webhookUrl is not configured for this alert');

  const rawBody = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
    'X-Alert-Id': payload.alertId,
    'X-Alert-Event': payload.event,
    'X-Alert-Timestamp': payload.triggeredAt,
  };

  if (config.webhookSecret) {
    headers[SIGNATURE_HEADER] = await signAlertPayload(config.webhookSecret, rawBody);
  }

  return post('webhook', config.webhookUrl, rawBody, headers);
}

const DISCORD_COLOR_UP = 0x22c55e;
const DISCORD_COLOR_DOWN = 0xef4444;

/** Discord channel webhook, rendered as a single embed. */
export async function deliverDiscord(
  config: AlertDeliveryConfig,
  payload: AlertDeliveryPayload,
): Promise<DeliveryResult> {
  if (!config.discordWebhookUrl) {
    return failure('discord', 'discordWebhookUrl is not configured for this alert');
  }

  const falling =
    payload.type === 'price_below' ||
    (payload.price !== undefined &&
      payload.threshold !== undefined &&
      payload.price < payload.threshold);

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: 'Trigger', value: payload.type, inline: true },
  ];
  if (payload.threshold !== undefined) {
    fields.push({ name: 'Threshold', value: String(payload.threshold), inline: true });
  }
  if (payload.price !== undefined) {
    fields.push({ name: 'Price', value: String(payload.price), inline: true });
  }
  if (payload.keywords?.length) {
    fields.push({ name: 'Keywords', value: payload.keywords.join(', '), inline: false });
  }

  const body = {
    username: 'Crypto Vision Alerts',
    embeds: [
      {
        title: payload.coin
          ? `${payload.coin.name} (${payload.coin.symbol.toUpperCase()})`
          : payload.title,
        description: payload.message,
        color: falling ? DISCORD_COLOR_DOWN : DISCORD_COLOR_UP,
        url: payload.url,
        timestamp: payload.triggeredAt,
        fields,
        footer: { text: 'cryptocurrency.cv' },
      },
    ],
  };

  return post('discord', config.discordWebhookUrl, JSON.stringify(body), {
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
  });
}

/** Escape the five characters Telegram's HTML parse mode treats as markup. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Telegram Bot API `sendMessage`. */
export async function deliverTelegram(
  config: AlertDeliveryConfig,
  payload: AlertDeliveryPayload,
): Promise<DeliveryResult> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    return failure('telegram', 'telegramBotToken and telegramChatId are both required');
  }

  const heading = payload.coin
    ? `${payload.coin.name} (${payload.coin.symbol.toUpperCase()})`
    : payload.title;
  const text = [
    `<b>${escapeHtml(heading)}</b>`,
    escapeHtml(payload.message),
    `<a href="${escapeHtml(payload.url)}">Open on cryptocurrency.cv</a>`,
  ].join('\n');

  const body = {
    chat_id: config.telegramChatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  return post(
    'telegram',
    `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
    JSON.stringify(body),
    { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

/** True when this module owns delivery for the channel. */
export function isDeliverableChannel(channel: NotificationChannel): channel is DeliverableChannel {
  return (DELIVERABLE_CHANNELS as readonly string[]).includes(channel);
}

/**
 * Deliver a triggered alert on one channel. Never throws: a transport failure
 * comes back as `{ delivered: false, error }` so the caller can record it
 * against the alert and keep processing the rest of the batch.
 */
export async function deliverAlert(
  channel: NotificationChannel,
  config: AlertDeliveryConfig | undefined,
  payload: AlertDeliveryPayload,
): Promise<DeliveryResult> {
  const cfg = config ?? {};

  switch (channel) {
    case 'webhook':
      return deliverWebhook(cfg, payload);
    case 'discord':
      return deliverDiscord(cfg, payload);
    case 'telegram':
      return deliverTelegram(cfg, payload);
    default:
      return {
        channel,
        delivered: false,
        status: 0,
        skipped: true,
        error: `${channel} is not a push channel handled by the delivery module`,
      };
  }
}

/**
 * Deliver on every configured push channel for an alert and return one result
 * per channel. Channels that are not push channels are reported as skipped.
 */
export async function deliverAlertToChannels(
  channels: readonly NotificationChannel[],
  config: AlertDeliveryConfig | undefined,
  payload: AlertDeliveryPayload,
): Promise<DeliveryResult[]> {
  const targets = channels.filter(isDeliverableChannel);
  if (targets.length === 0) return [];
  return Promise.all(targets.map((channel) => deliverAlert(channel, config, payload)));
}
