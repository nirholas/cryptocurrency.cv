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
 * Alert Request Validation
 *
 * Zod schemas for the notification half of the alert create/update routes.
 * The delivery endpoints are user supplied, so validation here is a security
 * boundary as much as a usability one: it is what stops an alert from being
 * pointed at an internal address and turning our cron into an SSRF probe.
 *
 * @example
 *   const parsed = alertNotificationSchema.safeParse(body);
 *   if (!parsed.success) return NextResponse.json(
 *     { error: 'Invalid notification settings', issues: formatIssues(parsed.error) },
 *     { status: 400 },
 *   );
 */

import { z } from 'zod';
import { generateWebhookSecret } from './delivery';

// ─── Channels ───────────────────────────────────────────────────────────────

export const NOTIFICATION_CHANNELS = [
  'email',
  'push',
  'webhook',
  'telegram',
  'discord',
  'none',
] as const;

export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);

// ─── Endpoint validation ────────────────────────────────────────────────────

/**
 * Hosts an alert must never be pointed at. A user-supplied webhook URL is
 * fetched by our own scheduler, so a link-local or private address would let
 * anyone read our internal network through the delivery result.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

/** Loopback targets are allowed outside production so `pnpm dev` can test a local receiver. */
function allowsPrivateHosts(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isAllowedWebhookHost(hostname: string): boolean {
  if (allowsPrivateHosts()) return true;
  return !BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * A URL we are willing to POST to. Parsed once, because zod runs every check in
 * a chain even after an earlier one fails, and a second `new URL()` on a string
 * we already know is malformed throws out of the schema.
 */
const httpsUrl = z
  .string()
  .trim()
  .min(1, 'URL is required')
  .max(2048, 'URL is too long')
  .superRefine((value, ctx) => {
    const url = parseUrl(value);
    if (!url) {
      ctx.addIssue({ code: 'custom', message: 'must be a valid absolute URL' });
      return;
    }

    const httpAllowedHere = url.protocol === 'http:' && allowsPrivateHosts();
    if (url.protocol !== 'https:' && !httpAllowedHere) {
      ctx.addIssue({ code: 'custom', message: 'must use https://' });
    }

    if (!isAllowedWebhookHost(url.hostname)) {
      ctx.addIssue({
        code: 'custom',
        message: 'must point at a public host, not a loopback, link-local, or private address',
      });
    }
  });

const discordWebhookUrl = httpsUrl.refine(
  (value) => /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//.test(value),
  'must be a Discord webhook URL (https://discord.com/api/webhooks/...)',
);

/** BotFather tokens look like `123456789:AA...`, 35 or more characters after the colon. */
const telegramBotToken = z
  .string()
  .trim()
  .regex(/^\d{6,15}:[A-Za-z0-9_-]{30,}$/, 'must be a Telegram bot token from @BotFather');

/** Either a numeric chat id (negative for groups) or an `@channelname`. */
const telegramChatId = z
  .string()
  .trim()
  .regex(
    /^(?:-?\d{1,20}|@[A-Za-z][A-Za-z0-9_]{4,31})$/,
    'must be a numeric chat id or an @channelname',
  );

/** Short secrets make the HMAC guessable, so hold the floor at 16 characters. */
const webhookSecret = z
  .string()
  .min(16, 'webhookSecret must be at least 16 characters')
  .max(256, 'webhookSecret must be at most 256 characters');

export const alertDeliverySchema = z
  .object({
    webhookUrl: httpsUrl.optional(),
    webhookSecret: webhookSecret.optional(),
    discordWebhookUrl: discordWebhookUrl.optional(),
    telegramBotToken: telegramBotToken.optional(),
    telegramChatId: telegramChatId.optional(),
  })
  .strict();

export type AlertDeliveryInput = z.infer<typeof alertDeliverySchema>;

// ─── Channel / delivery agreement ───────────────────────────────────────────

interface NotificationShape {
  notificationChannel?: (typeof NOTIFICATION_CHANNELS)[number];
  notifyVia?: Array<(typeof NOTIFICATION_CHANNELS)[number]>;
  email?: string;
  delivery?: AlertDeliveryInput;
}

/** Each channel names the fields it cannot work without. */
const REQUIRED_FIELDS: Record<string, Array<keyof AlertDeliveryInput>> = {
  webhook: ['webhookUrl'],
  discord: ['discordWebhookUrl'],
  telegram: ['telegramBotToken', 'telegramChatId'],
};

function checkChannelRequirements(value: NotificationShape, ctx: z.RefinementCtx): void {
  const requested = new Set(
    [value.notificationChannel, ...(value.notifyVia ?? [])].filter(
      (channel): channel is (typeof NOTIFICATION_CHANNELS)[number] => Boolean(channel),
    ),
  );

  for (const channel of requested) {
    if (channel === 'email' && !value.email) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'email is required when the email channel is selected',
      });
      continue;
    }

    for (const field of REQUIRED_FIELDS[channel] ?? []) {
      if (!value.delivery?.[field]) {
        ctx.addIssue({
          code: 'custom',
          path: ['delivery', field],
          message: `delivery.${field} is required when the ${channel} channel is selected`,
        });
      }
    }
  }
}

/** Create: the channel defaults to `none` so an alert with no delivery block stays valid. */
export const alertNotificationSchema = z
  .object({
    notificationChannel: notificationChannelSchema.default('none'),
    /** Explicit multi-channel form. Overrides `notificationChannel` when present. */
    notifyVia: z
      .array(notificationChannelSchema)
      .min(1)
      .max(NOTIFICATION_CHANNELS.length)
      .optional(),
    email: z.string().email().max(320).optional(),
    delivery: alertDeliverySchema.optional(),
  })
  .superRefine(checkChannelRequirements);

export type AlertNotificationInput = z.infer<typeof alertNotificationSchema>;

/** Update: every field is optional, but a channel that IS sent must still be complete. */
export const alertNotificationUpdateSchema = z
  .object({
    notificationChannel: notificationChannelSchema.optional(),
    notifyVia: z
      .array(notificationChannelSchema)
      .min(1)
      .max(NOTIFICATION_CHANNELS.length)
      .optional(),
    email: z.string().email().max(320).optional(),
    delivery: alertDeliverySchema.optional(),
  })
  .superRefine(checkChannelRequirements);

export type AlertNotificationUpdateInput = z.infer<typeof alertNotificationUpdateSchema>;

/** Alert-rule channels, validated instead of silently filtered. */
export const alertRuleChannelSchema = z.enum(['websocket']);
export const alertRuleChannelsSchema = z.array(alertRuleChannelSchema).min(1).max(4);

// ─── Request mapping ────────────────────────────────────────────────────────

export interface ResolvedNotification {
  /** Channels the alert fires on, always at least one. */
  notifyVia: (typeof NOTIFICATION_CHANNELS)[number][];
  delivery?: AlertDeliveryInput;
  /**
   * Set when we minted the webhook secret because the caller did not supply
   * one. Return it to the caller exactly once: it is never readable again.
   */
  generatedWebhookSecret?: string;
}

/**
 * Turn a validated notification block into the fields an alert record stores.
 * A webhook alert with no secret gets a fresh one, so every webhook we send is
 * signed whether or not the integrator thought to ask for it.
 */
export function resolveNotificationSettings(
  input: AlertNotificationInput | AlertNotificationUpdateInput,
): ResolvedNotification {
  const channel = input.notificationChannel;
  const notifyVia =
    input.notifyVia ?? (channel && channel !== 'none' ? [channel] : (['push'] as const).slice());

  const delivery: AlertDeliveryInput | undefined = input.delivery
    ? { ...input.delivery }
    : undefined;

  let generatedWebhookSecret: string | undefined;
  if (notifyVia.includes('webhook') && delivery?.webhookUrl && !delivery.webhookSecret) {
    generatedWebhookSecret = generateWebhookSecret();
    delivery.webhookSecret = generatedWebhookSecret;
  }

  return { notifyVia: [...notifyVia], delivery, generatedWebhookSecret };
}

// ─── Route helper ───────────────────────────────────────────────────────────

export interface FieldIssue {
  field: string;
  message: string;
}

/** Flatten a ZodError into the `{ field, message }` list our API errors use. */
export function formatIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
