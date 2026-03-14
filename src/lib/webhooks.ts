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
 * Webhooks System
 * Send notifications to external services when API events occur
 *
 * Supports KV-based persistent storage for production use
 * with fallback to in-memory storage for development
 */

import { kv } from '@vercel/kv';

// ============================================================================
// Types
// ============================================================================

/**
 * API key lifecycle events
 */
export type ApiKeyWebhookEvent =
  | 'key.created' // New API key created
  | 'key.usage.limit' // Rate limit threshold reached (90% or 100%)
  | 'key.upgraded' // API key tier upgraded
  | 'payment.received'; // x402 payment received

/**
 * Content/news events
 */
export type ContentWebhookEvent =
  | 'news.new' // New article published
  | 'news.breaking' // Breaking news alert
  | 'news.trending' // Article becomes trending
  | 'price.alert' // Price alert triggered
  | 'market.significant' // Significant market movement
  | 'source.new' // New source added
  | 'system.health'; // System health change

/**
 * All webhook event types
 */
export type WebhookEvent = ApiKeyWebhookEvent | ContentWebhookEvent;

/**
 * All valid webhook events for validation
 */
export const WEBHOOK_EVENTS: WebhookEvent[] = [
  // API key events
  'key.created',
  'key.usage.limit',
  'key.upgraded',
  'payment.received',
  // Content events
  'news.new',
  'news.breaking',
  'news.trending',
  'price.alert',
  'market.significant',
  'source.new',
  'system.health',
];

export interface WebhookSubscription {
  id: string;
  keyId: string; // Associated API key ID
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  // Delivery stats
  deliveryCount?: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: unknown;
  signature?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  url: string;
  payload: WebhookPayload;
  statusCode: number | null;
  response: string | null;
  success: boolean;
  deliveredAt: string;
  duration: number;
  error?: string;
}

// ============================================================================
// KV Storage Configuration
// ============================================================================

const KV_PREFIX = {
  webhook: 'webhook:', // webhook:{webhookId} -> WebhookSubscription
  keyWebhooks: 'key-webhooks:', // key-webhooks:{keyId} -> webhookId[]
  logs: 'webhook-logs:', // webhook-logs:{webhookId} -> WebhookDeliveryLog[]
  eventIndex: 'event-webhooks:', // event-webhooks:{event} -> webhookId[]
};

/**
 * Check if Vercel KV is configured
 */
function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Fallback in-memory stores for development
const webhookStore = new Map<string, WebhookSubscription>();
const keyWebhooksIndex = new Map<string, string[]>();
const webhookLogs = new Map<string, WebhookDeliveryLog[]>();
const eventIndex = new Map<WebhookEvent, string[]>();

// ============================================================================
// Signature Generation (HMAC-SHA256)
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify HMAC-SHA256 signature
 */
export async function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expectedSignature = await generateSignature(payload, secret);

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate unique ID using cryptographically secure random values
 */
function generateId(): string {
  return `wh_${crypto.randomUUID()}`;
}

/**
 * Generate webhook secret
 */
function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Webhook Registration (KV-backed)
// ============================================================================

/**
 * Check if a URL points to a private/internal network (SSRF protection).
 */
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block non-HTTPS schemes (except for testing)
    if (!['https:'].includes(parsed.protocol)) {
      return true;
    }

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      return true;
    }

    // Block private IPv4 ranges
    const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 10 || // 10.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        a === 127 || // 127.0.0.0/8
        a === 0 || // 0.0.0.0/8
        (a === 169 && b === 254) || // 169.254.0.0/16 (link-local)
        (a === 100 && b >= 64 && b <= 127) // 100.64.0.0/10 (CGN)
      ) {
        return true;
      }
    }

    // Block AWS/cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return true;
    }

    // Block nip.io, sslip.io and similar DNS rebinding services
    if (
      hostname.endsWith('.nip.io') ||
      hostname.endsWith('.sslip.io') ||
      hostname.endsWith('.xip.io')
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Register a new webhook for an API key
 */
export async function registerWebhook(
  keyId: string,
  url: string,
  events: WebhookEvent[],
  metadata?: Record<string, unknown>,
): Promise<WebhookSubscription> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  // SSRF protection: block private/internal URLs
  if (isPrivateUrl(url)) {
    throw new Error('Webhook URL must be a public HTTPS endpoint');
  }

  // Validate events
  for (const event of events) {
    if (!WEBHOOK_EVENTS.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
  }

  const webhook: WebhookSubscription = {
    id: generateId(),
    keyId,
    url,
    events,
    secret: generateSecret(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
    deliveryCount: 0,
  };

  if (isKvConfigured()) {
    // Store in KV
    await kv.set(`${KV_PREFIX.webhook}${webhook.id}`, webhook);

    // Add to key's webhook list
    const keyWebhooks = (await kv.get<string[]>(`${KV_PREFIX.keyWebhooks}${keyId}`)) || [];
    keyWebhooks.push(webhook.id);
    await kv.set(`${KV_PREFIX.keyWebhooks}${keyId}`, keyWebhooks);

    // Add to event indices
    for (const event of events) {
      const eventWebhooks = (await kv.get<string[]>(`${KV_PREFIX.eventIndex}${event}`)) || [];
      eventWebhooks.push(webhook.id);
      await kv.set(`${KV_PREFIX.eventIndex}${event}`, eventWebhooks);
    }
  } else {
    // Fallback to in-memory
    webhookStore.set(webhook.id, webhook);

    const keyWebhooks = keyWebhooksIndex.get(keyId) || [];
    keyWebhooks.push(webhook.id);
    keyWebhooksIndex.set(keyId, keyWebhooks);

    for (const event of events) {
      const eventWebhooks = eventIndex.get(event) || [];
      eventWebhooks.push(webhook.id);
      eventIndex.set(event, eventWebhooks);
    }
  }

  return webhook;
}

/**
 * Get all webhooks for an API key
 */
export async function getWebhooksByKeyId(keyId: string): Promise<WebhookSubscription[]> {
  if (isKvConfigured()) {
    const webhookIds = (await kv.get<string[]>(`${KV_PREFIX.keyWebhooks}${keyId}`)) || [];
    const webhooks: WebhookSubscription[] = [];

    for (const id of webhookIds) {
      const webhook = await kv.get<WebhookSubscription>(`${KV_PREFIX.webhook}${id}`);
      if (webhook) webhooks.push(webhook);
    }

    return webhooks;
  } else {
    const webhookIds = keyWebhooksIndex.get(keyId) || [];
    return webhookIds
      .map((id) => webhookStore.get(id))
      .filter((w): w is WebhookSubscription => !!w);
  }
}

/**
 * Get a specific webhook by ID
 */
export async function getWebhookById(webhookId: string): Promise<WebhookSubscription | null> {
  if (isKvConfigured()) {
    return await kv.get<WebhookSubscription>(`${KV_PREFIX.webhook}${webhookId}`);
  } else {
    return webhookStore.get(webhookId) || null;
  }
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  webhookId: string,
  keyId: string,
  updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active' | 'metadata'>>,
): Promise<WebhookSubscription | null> {
  const webhook = await getWebhookById(webhookId);

  if (webhook?.keyId !== keyId) return null;

  // Validate URL if provided
  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
    // SSRF protection: block private/internal URLs
    if (isPrivateUrl(updates.url)) {
      throw new Error('Webhook URL must be a public HTTPS endpoint');
    }
  }

  // Validate events if provided
  if (updates.events) {
    for (const event of updates.events) {
      if (!WEBHOOK_EVENTS.includes(event)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }
  }

  const oldEvents = webhook.events;

  // Apply updates
  if (updates.url) webhook.url = updates.url;
  if (updates.events) webhook.events = updates.events;
  if (updates.active !== undefined) webhook.active = updates.active;
  if (updates.metadata) webhook.metadata = { ...webhook.metadata, ...updates.metadata };
  webhook.updatedAt = new Date().toISOString();

  if (isKvConfigured()) {
    await kv.set(`${KV_PREFIX.webhook}${webhookId}`, webhook);

    // Update event indices if events changed
    if (updates.events) {
      // Remove from old event indices
      for (const event of oldEvents) {
        const eventWebhooks = (await kv.get<string[]>(`${KV_PREFIX.eventIndex}${event}`)) || [];
        const idx = eventWebhooks.indexOf(webhookId);
        if (idx > -1) {
          eventWebhooks.splice(idx, 1);
          await kv.set(`${KV_PREFIX.eventIndex}${event}`, eventWebhooks);
        }
      }
      // Add to new event indices
      for (const event of updates.events) {
        const eventWebhooks = (await kv.get<string[]>(`${KV_PREFIX.eventIndex}${event}`)) || [];
        if (!eventWebhooks.includes(webhookId)) {
          eventWebhooks.push(webhookId);
          await kv.set(`${KV_PREFIX.eventIndex}${event}`, eventWebhooks);
        }
      }
    }
  } else {
    webhookStore.set(webhookId, webhook);

    if (updates.events) {
      for (const event of oldEvents) {
        const eventWebhooks = eventIndex.get(event) || [];
        const idx = eventWebhooks.indexOf(webhookId);
        if (idx > -1) eventWebhooks.splice(idx, 1);
      }
      for (const event of updates.events) {
        const eventWebhooks = eventIndex.get(event) || [];
        if (!eventWebhooks.includes(webhookId)) {
          eventWebhooks.push(webhookId);
          eventIndex.set(event, eventWebhooks);
        }
      }
    }
  }

  return webhook;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string, keyId: string): Promise<boolean> {
  const webhook = await getWebhookById(webhookId);

  if (webhook?.keyId !== keyId) return false;

  if (isKvConfigured()) {
    // Remove from webhook store
    await kv.del(`${KV_PREFIX.webhook}${webhookId}`);

    // Remove from key's webhook list
    const keyWebhooks = (await kv.get<string[]>(`${KV_PREFIX.keyWebhooks}${keyId}`)) || [];
    const idx = keyWebhooks.indexOf(webhookId);
    if (idx > -1) {
      keyWebhooks.splice(idx, 1);
      await kv.set(`${KV_PREFIX.keyWebhooks}${keyId}`, keyWebhooks);
    }

    // Remove from event indices
    for (const event of webhook.events) {
      const eventWebhooks = (await kv.get<string[]>(`${KV_PREFIX.eventIndex}${event}`)) || [];
      const eventIdx = eventWebhooks.indexOf(webhookId);
      if (eventIdx > -1) {
        eventWebhooks.splice(eventIdx, 1);
        await kv.set(`${KV_PREFIX.eventIndex}${event}`, eventWebhooks);
      }
    }

    // Remove logs
    await kv.del(`${KV_PREFIX.logs}${webhookId}`);
  } else {
    webhookStore.delete(webhookId);

    const keyWebhooks = keyWebhooksIndex.get(keyId) || [];
    const idx = keyWebhooks.indexOf(webhookId);
    if (idx > -1) keyWebhooks.splice(idx, 1);

    for (const event of webhook.events) {
      const eventWebhooks = eventIndex.get(event) || [];
      const eventIdx = eventWebhooks.indexOf(webhookId);
      if (eventIdx > -1) eventWebhooks.splice(eventIdx, 1);
    }

    webhookLogs.delete(webhookId);
  }

  return true;
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(
  webhookId: string,
  keyId: string,
): Promise<string | null> {
  const webhook = await getWebhookById(webhookId);
  if (webhook?.keyId !== keyId) return null;

  webhook.secret = generateSecret();
  webhook.updatedAt = new Date().toISOString();

  if (isKvConfigured()) {
    await kv.set(`${KV_PREFIX.webhook}${webhookId}`, webhook);
  } else {
    webhookStore.set(webhookId, webhook);
  }

  return webhook.secret;
}

// ============================================================================
// Webhook Delivery
// ============================================================================

/**
 * Deliver webhook to a single subscription
 */
async function deliverWebhook(
  webhook: WebhookSubscription,
  payload: WebhookPayload,
): Promise<WebhookDeliveryLog> {
  const startTime = Date.now();
  const payloadStr = JSON.stringify(payload);
  const signature = await generateSignature(payloadStr, webhook.secret);

  // Add signature to payload for reference
  const signedPayload = {
    ...payload,
    signature: `sha256=${signature}`,
  };
  const signedPayloadStr = JSON.stringify(signedPayload);

  const log: WebhookDeliveryLog = {
    id: generateId(),
    webhookId: webhook.id,
    event: payload.event,
    url: webhook.url,
    payload: signedPayload,
    statusCode: null,
    response: null,
    success: false,
    deliveredAt: new Date().toISOString(),
    duration: 0,
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'X-Webhook-Id': log.id,
        'User-Agent': 'CryptoDataAggregator-Webhooks/1.0',
      },
      body: signedPayloadStr,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    log.statusCode = response.status;
    log.response = await response.text().catch(() => null);
    log.success = response.ok;
  } catch (error) {
    log.error = error instanceof Error ? error.message : 'Unknown error';
  }

  log.duration = Date.now() - startTime;

  // Store log and update webhook stats
  if (isKvConfigured()) {
    const logs = (await kv.get<WebhookDeliveryLog[]>(`${KV_PREFIX.logs}${webhook.id}`)) || [];
    logs.unshift(log);
    if (logs.length > 100) logs.pop();
    await kv.set(`${KV_PREFIX.logs}${webhook.id}`, logs);

    // Update webhook stats
    webhook.deliveryCount = (webhook.deliveryCount || 0) + 1;
    webhook.lastDeliveryAt = log.deliveredAt;
    webhook.lastDeliveryStatus = log.statusCode || undefined;
    await kv.set(`${KV_PREFIX.webhook}${webhook.id}`, webhook);
  } else {
    const logs = webhookLogs.get(webhook.id) || [];
    logs.unshift(log);
    if (logs.length > 100) logs.pop();
    webhookLogs.set(webhook.id, logs);

    webhook.deliveryCount = (webhook.deliveryCount || 0) + 1;
    webhook.lastDeliveryAt = log.deliveredAt;
    webhook.lastDeliveryStatus = log.statusCode || undefined;
    webhookStore.set(webhook.id, webhook);
  }

  return log;
}

/**
 * Send a webhook event to all subscribers
 */
export async function sendWebhook(
  event: WebhookEvent,
  data: unknown,
): Promise<WebhookDeliveryLog[]> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const deliveryPromises: Promise<WebhookDeliveryLog>[] = [];
  const webhooks: WebhookSubscription[] = [];

  // Find all subscriptions for this event
  if (isKvConfigured()) {
    const webhookIds = (await kv.get<string[]>(`${KV_PREFIX.eventIndex}${event}`)) || [];
    for (const id of webhookIds) {
      const webhook = await kv.get<WebhookSubscription>(`${KV_PREFIX.webhook}${id}`);
      if (webhook && webhook.active) {
        webhooks.push(webhook);
      }
    }
  } else {
    const webhookIds = eventIndex.get(event) || [];
    for (const id of webhookIds) {
      const webhook = webhookStore.get(id);
      if (webhook?.active) {
        webhooks.push(webhook);
      }
    }
  }

  // Deliver to all matching webhooks
  for (const webhook of webhooks) {
    deliveryPromises.push(deliverWebhook(webhook, payload));
  }

  return Promise.all(deliveryPromises);
}

/**
 * @deprecated Use sendWebhook instead
 */
export const triggerWebhook = sendWebhook;

/**
 * Get delivery logs for a webhook
 */
export async function getDeliveryLogs(webhookId: string): Promise<WebhookDeliveryLog[]> {
  if (isKvConfigured()) {
    return (await kv.get<WebhookDeliveryLog[]>(`${KV_PREFIX.logs}${webhookId}`)) || [];
  } else {
    return webhookLogs.get(webhookId) || [];
  }
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(
  keyId: string,
  webhookId: string,
): Promise<WebhookDeliveryLog | null> {
  const webhook = await getWebhookById(webhookId);
  if (webhook?.keyId !== keyId) return null;

  const payload: WebhookPayload = {
    event: 'system.health',
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: 'This is a test webhook delivery',
      webhookId: webhook.id,
    },
  };

  return deliverWebhook(webhook, payload);
}

/**
 * Get webhook statistics for an API key
 */
export async function getWebhookStats(keyId: string): Promise<{
  total: number;
  active: number;
  totalDeliveries: number;
  successRate: number;
}> {
  const webhooks = await getWebhooksByKeyId(keyId);

  let totalDeliveries = 0;
  let successfulDeliveries = 0;

  for (const webhook of webhooks) {
    const logs = await getDeliveryLogs(webhook.id);
    totalDeliveries += logs.length;
    successfulDeliveries += logs.filter((l) => l.success).length;
  }

  return {
    total: webhooks.length,
    active: webhooks.filter((w) => w.active).length,
    totalDeliveries,
    successRate:
      totalDeliveries > 0 ? Math.round((successfulDeliveries / totalDeliveries) * 100) : 100,
  };
}

// ============================================================================
// Event Payload Builders
// ============================================================================

/**
 * Webhook payload builders for different event types
 */
export const webhookPayloads = {
  keyCreated: (data: { keyId: string; keyPrefix: string; tier: string; email: string }) => ({
    keyId: data.keyId,
    keyPrefix: data.keyPrefix,
    tier: data.tier,
    email: data.email,
  }),

  keyUsageLimit: (data: {
    keyId: string;
    keyPrefix: string;
    tier: string;
    usage: number;
    limit: number;
    percentage: number;
    limitType: '90%' | '100%';
  }) => ({
    keyId: data.keyId,
    keyPrefix: data.keyPrefix,
    tier: data.tier,
    usage: data.usage,
    limit: data.limit,
    percentage: data.percentage,
    limitType: data.limitType,
    message:
      data.limitType === '100%' ? 'Daily rate limit reached' : 'Approaching daily rate limit (90%)',
  }),

  keyUpgraded: (data: {
    keyId: string;
    keyPrefix: string;
    previousTier: string;
    newTier: string;
  }) => ({
    keyId: data.keyId,
    keyPrefix: data.keyPrefix,
    previousTier: data.previousTier,
    newTier: data.newTier,
  }),

  paymentReceived: (data: {
    keyId?: string;
    amount: string;
    currency: string;
    network: string;
    transactionId?: string;
    resource: string;
  }) => ({
    keyId: data.keyId,
    amount: data.amount,
    currency: data.currency,
    network: data.network,
    transactionId: data.transactionId,
    resource: data.resource,
  }),

  newArticle: (article: {
    id: string;
    title: string;
    source: string;
    category: string;
    link: string;
    pubDate: string;
  }) => ({
    article,
  }),

  breakingNews: (article: { id: string; title: string; source: string; link: string }) => ({
    article,
    severity: 'high',
  }),

  priceAlert: (alert: {
    coinId: string;
    symbol: string;
    condition: string;
    targetPrice: number;
    currentPrice: number;
  }) => ({
    alert,
  }),

  marketMovement: (data: {
    coinId: string;
    symbol: string;
    priceChange: number;
    priceChangePercent: number;
    volume24h: number;
  }) => ({
    movement: data,
  }),

  systemHealth: (data: { status: 'healthy' | 'degraded' | 'unhealthy'; message?: string }) => ({
    health: data,
  }),
};

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * @deprecated Use registerWebhook instead
 */
export function createWebhook(
  userId: string,
  url: string,
  events: WebhookEvent[],
  metadata?: Record<string, unknown>,
): WebhookSubscription {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  // Validate events
  for (const event of events) {
    if (!WEBHOOK_EVENTS.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
  }

  const webhook: WebhookSubscription = {
    id: generateId(),
    keyId: userId,
    url,
    events,
    secret: generateSecret(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };

  webhookStore.set(webhook.id, webhook);

  const keyWebhooks = keyWebhooksIndex.get(userId) || [];
  keyWebhooks.push(webhook.id);
  keyWebhooksIndex.set(userId, keyWebhooks);

  for (const event of events) {
    const eventWebhooks = eventIndex.get(event) || [];
    eventWebhooks.push(webhook.id);
    eventIndex.set(event, eventWebhooks);
  }

  return webhook;
}

/**
 * @deprecated Use getWebhooksByKeyId instead
 */
export function getWebhooks(userId: string): WebhookSubscription[] {
  const webhookIds = keyWebhooksIndex.get(userId) || [];
  return webhookIds.map((id) => webhookStore.get(id)).filter((w): w is WebhookSubscription => !!w);
}

/**
 * @deprecated Use getWebhookById instead
 */
export function getWebhook(userId: string, webhookId: string): WebhookSubscription | null {
  const webhook = webhookStore.get(webhookId);
  return webhook?.keyId === userId ? webhook : null;
}

/**
 * @deprecated Use regenerateWebhookSecret instead
 */
export function regenerateSecret(userId: string, webhookId: string): string | null {
  const webhook = webhookStore.get(webhookId);
  if (webhook?.keyId !== userId) return null;

  webhook.secret = generateSecret();
  webhook.updatedAt = new Date().toISOString();
  webhookStore.set(webhookId, webhook);

  return webhook.secret;
}
