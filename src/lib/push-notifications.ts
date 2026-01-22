/**
 * Web Push Notifications Service
 * 
 * Implements the Web Push API for browser notifications.
 * Requires VAPID keys for authentication.
 */

// Types
export interface PushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  categories: string[];
  sources: string[];
  createdAt: string;
  lastPushAt?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// In-memory store (replace with DB in production)
const subscriptions = new Map<string, PushSubscription>();

// Generate ID
function generateId(): string {
  return `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate VAPID keys (run once, then store in env)
 * 
 * To generate: 
 *   npx web-push generate-vapid-keys
 */
export function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey };
}

/**
 * Get VAPID public key for client
 */
export function getPublicVapidKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Save push subscription
 */
export async function saveSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  options: {
    userId?: string;
    categories?: string[];
    sources?: string[];
  } = {}
): Promise<{ success: boolean; id: string }> {
  // Check if subscription already exists
  const existing = Array.from(subscriptions.values()).find(
    s => s.endpoint === subscription.endpoint
  );

  if (existing) {
    // Update existing
    existing.categories = options.categories || existing.categories;
    existing.sources = options.sources || existing.sources;
    subscriptions.set(existing.id, existing);
    return { success: true, id: existing.id };
  }

  const newSub: PushSubscription = {
    id: generateId(),
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userId: options.userId,
    categories: options.categories || [],
    sources: options.sources || [],
    createdAt: new Date().toISOString(),
  };

  subscriptions.set(newSub.id, newSub);
  return { success: true, id: newSub.id };
}

/**
 * Remove push subscription
 */
export async function removeSubscription(endpoint: string): Promise<boolean> {
  const sub = Array.from(subscriptions.values()).find(s => s.endpoint === endpoint);
  if (sub) {
    subscriptions.delete(sub.id);
    return true;
  }
  return false;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  const vapid = getVapidKeys();
  if (!vapid) {
    console.error('VAPID keys not configured');
    return false;
  }

  try {
    // Note: In production, use the 'web-push' npm package
    // This is a simplified implementation
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        // Add proper VAPID headers in production
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, remove it
      subscriptions.delete(subscription.id);
      return false;
    }

    // Update last push time
    subscription.lastPushAt = new Date().toISOString();
    subscriptions.set(subscription.id, subscription);

    return response.ok;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

/**
 * Broadcast notification to all subscriptions
 */
export async function broadcastNotification(
  payload: PushPayload,
  filter?: {
    categories?: string[];
    sources?: string[];
  }
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const [, subscription] of subscriptions) {
    // Apply filters
    if (filter) {
      const matchesCategory = !filter.categories || 
        filter.categories.length === 0 ||
        subscription.categories.length === 0 ||
        subscription.categories.some(c => filter.categories!.includes(c));

      const matchesSource = !filter.sources ||
        filter.sources.length === 0 ||
        subscription.sources.length === 0 ||
        subscription.sources.some(s => filter.sources!.includes(s));

      if (!matchesCategory || !matchesSource) {
        continue;
      }
    }

    const success = await sendPushNotification(subscription, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send breaking news notification
 */
export async function sendBreakingNewsNotification(article: {
  title: string;
  link: string;
  source: string;
  category: string;
}): Promise<{ sent: number; failed: number }> {
  const payload: PushPayload = {
    title: '🚨 Breaking News',
    body: article.title,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'breaking-news',
    url: article.link,
    data: {
      source: article.source,
      category: article.category,
    },
  };

  return broadcastNotification(payload, {
    categories: [article.category],
    sources: [article.source.toLowerCase()],
  });
}

/**
 * Get subscription stats
 */
export function getSubscriptionStats(): {
  total: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
} {
  const all = Array.from(subscriptions.values());
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  all.forEach(sub => {
    sub.categories.forEach(cat => {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    sub.sources.forEach(src => {
      bySource[src] = (bySource[src] || 0) + 1;
    });
  });

  return {
    total: all.length,
    byCategory,
    bySource,
  };
}

/**
 * Cleanup expired subscriptions
 */
export async function cleanupExpiredSubscriptions(): Promise<number> {
  let cleaned = 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const [id, sub] of subscriptions) {
    const createdAt = new Date(sub.createdAt).getTime();
    const lastPushAt = sub.lastPushAt ? new Date(sub.lastPushAt).getTime() : createdAt;

    // Remove if no activity in 30 days
    if (lastPushAt < thirtyDaysAgo) {
      subscriptions.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
