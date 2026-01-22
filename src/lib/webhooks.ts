/**
 * Webhooks System
 * Send notifications to external services when events occur
 */

// Webhook subscription store (replace with database in production)
const webhookStore = new Map<string, WebhookSubscription[]>();
const webhookLogs = new Map<string, WebhookDeliveryLog[]>();

export type WebhookEvent = 
  | 'news.new'           // New article published
  | 'news.breaking'      // Breaking news alert
  | 'news.trending'      // Article becomes trending
  | 'price.alert'        // Price alert triggered
  | 'market.significant' // Significant market movement
  | 'source.new'         // New source added
  | 'system.health';     // System health change

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: unknown;
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

/**
 * Generate HMAC signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate webhook secret
 */
function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new webhook subscription
 */
export function createWebhook(
  userId: string,
  url: string,
  events: WebhookEvent[],
  metadata?: Record<string, unknown>
): WebhookSubscription {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  // Validate events
  const validEvents: WebhookEvent[] = [
    'news.new', 'news.breaking', 'news.trending',
    'price.alert', 'market.significant', 'source.new', 'system.health'
  ];
  
  for (const event of events) {
    if (!validEvents.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
  }

  const webhook: WebhookSubscription = {
    id: generateId(),
    userId,
    url,
    events,
    secret: generateSecret(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };

  const userWebhooks = webhookStore.get(userId) || [];
  userWebhooks.push(webhook);
  webhookStore.set(userId, userWebhooks);

  return webhook;
}

/**
 * Get webhooks for a user
 */
export function getWebhooks(userId: string): WebhookSubscription[] {
  return webhookStore.get(userId) || [];
}

/**
 * Get a specific webhook
 */
export function getWebhook(userId: string, webhookId: string): WebhookSubscription | null {
  const userWebhooks = webhookStore.get(userId) || [];
  return userWebhooks.find(w => w.id === webhookId) || null;
}

/**
 * Update a webhook
 */
export function updateWebhook(
  userId: string,
  webhookId: string,
  updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active' | 'metadata'>>
): WebhookSubscription | null {
  const userWebhooks = webhookStore.get(userId) || [];
  const index = userWebhooks.findIndex(w => w.id === webhookId);
  
  if (index === -1) return null;

  const webhook = userWebhooks[index];
  
  if (updates.url) {
    try {
      new URL(updates.url);
      webhook.url = updates.url;
    } catch {
      throw new Error('Invalid webhook URL');
    }
  }

  if (updates.events) webhook.events = updates.events;
  if (updates.active !== undefined) webhook.active = updates.active;
  if (updates.metadata) webhook.metadata = { ...webhook.metadata, ...updates.metadata };
  
  webhook.updatedAt = new Date().toISOString();
  
  return webhook;
}

/**
 * Delete a webhook
 */
export function deleteWebhook(userId: string, webhookId: string): boolean {
  const userWebhooks = webhookStore.get(userId) || [];
  const index = userWebhooks.findIndex(w => w.id === webhookId);
  
  if (index === -1) return false;

  userWebhooks.splice(index, 1);
  webhookStore.set(userId, userWebhooks);
  
  return true;
}

/**
 * Regenerate webhook secret
 */
export function regenerateSecret(userId: string, webhookId: string): string | null {
  const webhook = getWebhook(userId, webhookId);
  if (!webhook) return null;

  webhook.secret = generateSecret();
  webhook.updatedAt = new Date().toISOString();
  
  return webhook.secret;
}

/**
 * Deliver webhook to a single subscription
 */
async function deliverWebhook(
  webhook: WebhookSubscription,
  payload: WebhookPayload
): Promise<WebhookDeliveryLog> {
  const startTime = Date.now();
  const payloadStr = JSON.stringify(payload);
  const signature = await generateSignature(payloadStr, webhook.secret);

  const log: WebhookDeliveryLog = {
    id: generateId(),
    webhookId: webhook.id,
    event: payload.event,
    url: webhook.url,
    payload,
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
        'User-Agent': 'CryptoNews-Webhooks/1.0',
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    log.statusCode = response.status;
    log.response = await response.text().catch(() => null);
    log.success = response.ok;
  } catch (error) {
    log.error = error instanceof Error ? error.message : 'Unknown error';
  }

  log.duration = Date.now() - startTime;

  // Store log
  const logs = webhookLogs.get(webhook.id) || [];
  logs.unshift(log);
  if (logs.length > 100) logs.pop(); // Keep last 100 logs
  webhookLogs.set(webhook.id, logs);

  return log;
}

/**
 * Trigger webhook event to all subscribers
 */
export async function triggerWebhook(
  event: WebhookEvent,
  data: unknown
): Promise<WebhookDeliveryLog[]> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const deliveryPromises: Promise<WebhookDeliveryLog>[] = [];

  // Find all subscriptions for this event
  for (const [, webhooks] of webhookStore) {
    for (const webhook of webhooks) {
      if (webhook.active && webhook.events.includes(event)) {
        deliveryPromises.push(deliverWebhook(webhook, payload));
      }
    }
  }

  return Promise.all(deliveryPromises);
}

/**
 * Get delivery logs for a webhook
 */
export function getDeliveryLogs(webhookId: string): WebhookDeliveryLog[] {
  return webhookLogs.get(webhookId) || [];
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(
  userId: string,
  webhookId: string
): Promise<WebhookDeliveryLog | null> {
  const webhook = getWebhook(userId, webhookId);
  if (!webhook) return null;

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
 * Get webhook statistics
 */
export function getWebhookStats(userId: string): {
  total: number;
  active: number;
  totalDeliveries: number;
  successRate: number;
} {
  const userWebhooks = webhookStore.get(userId) || [];
  
  let totalDeliveries = 0;
  let successfulDeliveries = 0;

  for (const webhook of userWebhooks) {
    const logs = webhookLogs.get(webhook.id) || [];
    totalDeliveries += logs.length;
    successfulDeliveries += logs.filter(l => l.success).length;
  }

  return {
    total: userWebhooks.length,
    active: userWebhooks.filter(w => w.active).length,
    totalDeliveries,
    successRate: totalDeliveries > 0 
      ? Math.round((successfulDeliveries / totalDeliveries) * 100) 
      : 100,
  };
}

/**
 * Event payload builders
 */
export const webhookPayloads = {
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

  breakingNews: (article: {
    id: string;
    title: string;
    source: string;
    link: string;
  }) => ({
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

  systemHealth: (data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }) => ({
    health: data,
  }),
};
