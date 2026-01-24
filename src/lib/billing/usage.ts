/**
 * Usage Tracking Service
 * 
 * Tracks API usage for billing purposes.
 * Supports real-time usage limits and overage tracking.
 */

import { BILLING_TIERS, USAGE_PRICING, BillingTier, UsageType } from './config';

interface UsageEntry {
  type: UsageType;
  quantity: number;
  timestamp: number;
  apiKeyId: string;
  endpoint?: string;
  metadata?: Record<string, string>;
}

interface UsageSummary {
  period: {
    start: Date;
    end: Date;
  };
  usage: Record<UsageType, number>;
  limits: Record<UsageType, number>;
  overages: Record<UsageType, number>;
  estimatedCost: number;
}

// In-memory usage store (use Redis in production)
const usageStore = new Map<string, UsageEntry[]>();

/**
 * Record a usage event
 */
export function recordUsage(params: {
  apiKeyId: string;
  type: UsageType;
  quantity?: number;
  endpoint?: string;
  metadata?: Record<string, string>;
}): void {
  const entry: UsageEntry = {
    type: params.type,
    quantity: params.quantity || 1,
    timestamp: Date.now(),
    apiKeyId: params.apiKeyId,
    endpoint: params.endpoint,
    metadata: params.metadata,
  };

  const key = getUsageKey(params.apiKeyId);
  const entries = usageStore.get(key) || [];
  entries.push(entry);
  usageStore.set(key, entries);

  // Cleanup old entries (keep last 31 days)
  cleanupOldEntries(key);
}

/**
 * Get usage key for storage
 */
function getUsageKey(apiKeyId: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `usage:${apiKeyId}:${yearMonth}`;
}

/**
 * Cleanup entries older than 31 days
 */
function cleanupOldEntries(key: string): void {
  const entries = usageStore.get(key);
  if (!entries) return;

  const cutoff = Date.now() - 31 * 24 * 60 * 60 * 1000;
  const filtered = entries.filter(e => e.timestamp >= cutoff);
  usageStore.set(key, filtered);
}

/**
 * Get current usage for an API key
 */
export function getCurrentUsage(
  apiKeyId: string,
  tier: BillingTier = 'free'
): UsageSummary {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const key = getUsageKey(apiKeyId);
  const entries = usageStore.get(key) || [];

  // Calculate usage by type
  const usage: Record<UsageType, number> = {
    apiRequests: 0,
    aiTokens: 0,
    webhookDeliveries: 0,
    dataExports: 0,
  };

  entries.forEach(entry => {
    if (entry.timestamp >= periodStart.getTime() && entry.timestamp <= periodEnd.getTime()) {
      usage[entry.type] += entry.quantity;
    }
  });

  // Get tier limits
  const tierConfig = BILLING_TIERS[tier];
  const limits: Record<UsageType, number> = {
    apiRequests: tierConfig.features.requestsPerMonth,
    aiTokens: tier === 'enterprise' ? -1 : tier === 'pro' ? 100000 : 1000,
    webhookDeliveries: tierConfig.features.webhooks ? (tier === 'enterprise' ? -1 : 10000) : 0,
    dataExports: tier === 'free' ? 10 : tier === 'pro' ? 100 : -1,
  };

  // Calculate overages
  const overages: Record<UsageType, number> = {
    apiRequests: limits.apiRequests === -1 ? 0 : Math.max(0, usage.apiRequests - limits.apiRequests),
    aiTokens: limits.aiTokens === -1 ? 0 : Math.max(0, usage.aiTokens - limits.aiTokens),
    webhookDeliveries: limits.webhookDeliveries === -1 ? 0 : Math.max(0, usage.webhookDeliveries - limits.webhookDeliveries),
    dataExports: limits.dataExports === -1 ? 0 : Math.max(0, usage.dataExports - limits.dataExports),
  };

  // Calculate estimated overage cost
  let estimatedCost = 0;
  (Object.keys(overages) as UsageType[]).forEach(type => {
    estimatedCost += overages[type] * USAGE_PRICING[type].pricePerUnit;
  });

  return {
    period: {
      start: periodStart,
      end: periodEnd,
    },
    usage,
    limits,
    overages,
    estimatedCost,
  };
}

/**
 * Check if usage is within limits
 */
export function checkUsageLimit(
  apiKeyId: string,
  type: UsageType,
  tier: BillingTier = 'free'
): { allowed: boolean; remaining: number; limit: number; used: number } {
  const summary = getCurrentUsage(apiKeyId, tier);
  const limit = summary.limits[type];
  const used = summary.usage[type];

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      used,
    };
  }

  const remaining = Math.max(0, limit - used);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    used,
  };
}

/**
 * Check rate limit (requests per minute)
 */
export function checkRateLimit(
  apiKeyId: string,
  tier: BillingTier = 'free'
): { allowed: boolean; remaining: number; resetAt: Date } {
  const tierConfig = BILLING_TIERS[tier];
  const rateLimit = tierConfig.features.requestsPerMinute;

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  const key = getUsageKey(apiKeyId);
  const entries = usageStore.get(key) || [];

  // Count requests in the last minute
  const recentRequests = entries.filter(
    e => e.type === 'apiRequests' && e.timestamp >= oneMinuteAgo
  ).length;

  const remaining = Math.max(0, rateLimit - recentRequests);
  const resetAt = new Date(now + 60 * 1000);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  };
}

/**
 * Get usage history for reporting
 */
export function getUsageHistory(
  apiKeyId: string,
  days: number = 30
): { date: string; usage: Record<UsageType, number> }[] {
  const result: { date: string; usage: Record<UsageType, number> }[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayStart = new Date(dateStr).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    // Get entries for this day (checking multiple months if needed)
    const usage: Record<UsageType, number> = {
      apiRequests: 0,
      aiTokens: 0,
      webhookDeliveries: 0,
      dataExports: 0,
    };

    // Check current month and previous month
    [0, -1].forEach(monthOffset => {
      const checkDate = new Date(date);
      checkDate.setMonth(checkDate.getMonth() + monthOffset);
      const yearMonth = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
      const key = `usage:${apiKeyId}:${yearMonth}`;
      const entries = usageStore.get(key) || [];

      entries.forEach(entry => {
        if (entry.timestamp >= dayStart && entry.timestamp <= dayEnd) {
          usage[entry.type] += entry.quantity;
        }
      });
    });

    result.push({ date: dateStr, usage });
  }

  return result.reverse();
}

/**
 * Get top endpoints by usage
 */
export function getTopEndpoints(
  apiKeyId: string,
  limit: number = 10
): { endpoint: string; count: number }[] {
  const key = getUsageKey(apiKeyId);
  const entries = usageStore.get(key) || [];

  const endpointCounts = new Map<string, number>();

  entries.forEach(entry => {
    if (entry.endpoint) {
      endpointCounts.set(
        entry.endpoint,
        (endpointCounts.get(entry.endpoint) || 0) + entry.quantity
      );
    }
  });

  return Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Flush usage to Stripe for metered billing
 * Called periodically by a cron job
 */
export async function flushUsageToStripe(
  apiKeyId: string,
  subscriptionItemId: string
): Promise<void> {
  const summary = getCurrentUsage(apiKeyId);
  
  // Only report overages for metered billing
  const totalOverageRequests = summary.overages.apiRequests;
  
  if (totalOverageRequests > 0) {
    // Import stripe client dynamically to avoid circular deps
    const { reportUsage } = await import('./stripe');
    
    await reportUsage({
      subscriptionItemId,
      quantity: totalOverageRequests,
      action: 'set',
    });
  }
}

/**
 * Reset usage counters (for testing)
 */
export function resetUsage(apiKeyId: string): void {
  const key = getUsageKey(apiKeyId);
  usageStore.delete(key);
}

/**
 * Export usage data for a period
 */
export function exportUsageData(
  apiKeyId: string,
  startDate: Date,
  endDate: Date
): UsageEntry[] {
  const result: UsageEntry[] = [];

  // Check all relevant months
  const current = new Date(startDate);
  while (current <= endDate) {
    const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const key = `usage:${apiKeyId}:${yearMonth}`;
    const entries = usageStore.get(key) || [];

    entries.forEach(entry => {
      if (entry.timestamp >= startDate.getTime() && entry.timestamp <= endDate.getTime()) {
        result.push(entry);
      }
    });

    current.setMonth(current.getMonth() + 1);
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}
