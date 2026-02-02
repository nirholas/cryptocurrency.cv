/**
 * x402 Payment Metrics and Analytics
 * 
 * Tracks payment success/failure rates, revenue, and usage patterns.
 * Uses Vercel KV for persistent storage.
 */

import { kv } from '@vercel/kv';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentMetric {
  timestamp: number;
  endpoint: string;
  amount: string; // USD amount
  walletAddress: string;
  network: string;
  success: boolean;
  error?: string;
  settlementId?: string;
  responseTime: number; // ms
}

export interface EndpointMetrics {
  endpoint: string;
  totalRequests: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number; // USD
  avgResponseTime: number;
  lastPayment?: number; // timestamp
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  totalRequests: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number;
  uniqueWallets: Set<string>;
}

// =============================================================================
// METRIC COLLECTION
// =============================================================================

/**
 * Record a payment attempt (success or failure)
 */
export async function recordPayment(metric: PaymentMetric): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    // Store individual payment record (keep for 30 days)
    const paymentKey = `x402:payment:${metric.timestamp}:${metric.walletAddress}`;
    await kv.setex(paymentKey, 30 * 24 * 60 * 60, JSON.stringify(metric));
    
    // Update endpoint metrics
    const endpointKey = `x402:endpoint:${metric.endpoint}`;
    const endpoint = await kv.get<EndpointMetrics>(endpointKey) || {
      endpoint: metric.endpoint,
      totalRequests: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalRevenue: 0,
      avgResponseTime: 0,
    };
    
    endpoint.totalRequests++;
    if (metric.success) {
      endpoint.successfulPayments++;
      endpoint.totalRevenue += parseFloat(metric.amount);
    } else {
      endpoint.failedPayments++;
    }
    
    // Update rolling average response time
    endpoint.avgResponseTime = 
      (endpoint.avgResponseTime * (endpoint.totalRequests - 1) + metric.responseTime) / 
      endpoint.totalRequests;
    
    endpoint.lastPayment = metric.timestamp;
    
    await kv.set(endpointKey, endpoint);
    
    // Update daily metrics
    const dailyKey = `x402:daily:${today}`;
    const daily = await kv.get<Omit<DailyMetrics, 'uniqueWallets'>>(dailyKey) || {
      date: today,
      totalRequests: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalRevenue: 0,
    };
    
    daily.totalRequests++;
    if (metric.success) {
      daily.successfulPayments++;
      daily.totalRevenue += parseFloat(metric.amount);
    } else {
      daily.failedPayments++;
    }
    
    await kv.setex(dailyKey, 90 * 24 * 60 * 60, daily); // Keep for 90 days
    
    // Track unique wallets (add to set)
    const walletsKey = `x402:wallets:${today}`;
    await kv.sadd(walletsKey, metric.walletAddress);
    await kv.expire(walletsKey, 90 * 24 * 60 * 60);
    
    // Log for debugging
    console.log('[x402-metrics] Payment recorded:', {
      endpoint: metric.endpoint,
      success: metric.success,
      amount: metric.amount,
    });
  } catch (error) {
    console.error('[x402-metrics] Failed to record payment:', error);
    // Don't throw - metrics shouldn't break payment flow
  }
}

/**
 * Get metrics for a specific endpoint
 */
export async function getEndpointMetrics(endpoint: string): Promise<EndpointMetrics | null> {
  const key = `x402:endpoint:${endpoint}`;
  return await kv.get<EndpointMetrics>(key);
}

/**
 * Get metrics for all endpoints
 */
export async function getAllEndpointMetrics(): Promise<EndpointMetrics[]> {
  const pattern = 'x402:endpoint:*';
  const keys = await kv.keys(pattern);
  
  const metrics: EndpointMetrics[] = [];
  for (const key of keys) {
    const data = await kv.get<EndpointMetrics>(key);
    if (data) {
      metrics.push(data);
    }
  }
  
  return metrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get daily metrics for a specific date
 */
export async function getDailyMetrics(date: string): Promise<DailyMetrics | null> {
  const key = `x402:daily:${date}`;
  const data = await kv.get<Omit<DailyMetrics, 'uniqueWallets'>>(key);
  
  if (!data) return null;
  
  // Get unique wallets count
  const walletsKey = `x402:wallets:${date}`;
  const wallets = await kv.smembers(walletsKey);
  
  return {
    ...data,
    uniqueWallets: new Set(wallets),
  };
}

/**
 * Get metrics for date range
 */
export async function getMetricsRange(startDate: string, endDate: string): Promise<DailyMetrics[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const metrics: DailyMetrics[] = [];
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const daily = await getDailyMetrics(dateStr);
    if (daily) {
      metrics.push(daily);
    }
  }
  
  return metrics;
}

/**
 * Get aggregate metrics summary
 */
export async function getMetricsSummary(): Promise<{
  last24h: DailyMetrics;
  last7d: {
    totalRequests: number;
    successfulPayments: number;
    failedPayments: number;
    totalRevenue: number;
    uniqueWallets: number;
    successRate: number;
  };
  topEndpoints: EndpointMetrics[];
}> {
  const today = new Date().toISOString().split('T')[0];
  const last24h = await getDailyMetrics(today) || {
    date: today,
    totalRequests: 0,
    successfulPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    uniqueWallets: new Set(),
  };
  
  // Calculate last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7dMetrics = await getMetricsRange(
    sevenDaysAgo.toISOString().split('T')[0],
    today
  );
  
  const last7d = last7dMetrics.reduce(
    (acc, day) => ({
      totalRequests: acc.totalRequests + day.totalRequests,
      successfulPayments: acc.successfulPayments + day.successfulPayments,
      failedPayments: acc.failedPayments + day.failedPayments,
      totalRevenue: acc.totalRevenue + day.totalRevenue,
      uniqueWallets: acc.uniqueWallets + day.uniqueWallets.size,
      successRate: 0, // Calculate below
    }),
    {
      totalRequests: 0,
      successfulPayments: 0,
      failedPayments: 0,
      totalRevenue: 0,
      uniqueWallets: 0,
      successRate: 0,
    }
  );
  
  last7d.successRate = last7d.totalRequests > 0
    ? (last7d.successfulPayments / last7d.totalRequests) * 100
    : 0;
  
  // Get top endpoints
  const topEndpoints = (await getAllEndpointMetrics()).slice(0, 10);
  
  return {
    last24h,
    last7d,
    topEndpoints,
  };
}

/**
 * Get failed payment reasons (for debugging)
 */
export async function getFailedPayments(limit = 50): Promise<PaymentMetric[]> {
  const pattern = 'x402:payment:*';
  const keys = await kv.keys(pattern);
  
  const failed: PaymentMetric[] = [];
  
  for (const key of keys.slice(-limit * 2)) { // Get more to filter
    const data = await kv.get<PaymentMetric>(key);
    if (data && !data.success) {
      failed.push(data);
    }
    if (failed.length >= limit) break;
  }
  
  return failed.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Reset all metrics (admin only - use with caution!)
 */
export async function resetMetrics(): Promise<void> {
  const patterns = ['x402:payment:*', 'x402:endpoint:*', 'x402:daily:*', 'x402:wallets:*'];
  
  for (const pattern of patterns) {
    const keys = await kv.keys(pattern);
    for (const key of keys) {
      await kv.del(key);
    }
  }
  
  console.log('[x402-metrics] All metrics reset');
}
