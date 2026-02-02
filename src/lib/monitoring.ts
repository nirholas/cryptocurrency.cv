/**
 * Monitoring & Observability Utilities
 * 
 * Provides:
 * - Metrics collection
 * - Performance tracking
 * - Error tracking
 * - Usage analytics
 */

import { kv } from '@vercel/kv';

/**
 * Track API request
 */
export async function trackRequest(
  endpoint: string,
  method: string,
  status: number,
  duration: number
): Promise<void> {
  try {
    const timestamp = Date.now();
    const hour = new Date(timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    // Increment request counter
    await kv.hincrby(`metrics:requests:${hour}`, `${status}`, 1);
    
    // Track endpoint usage
    await kv.hincrby(`metrics:endpoints:${hour}`, endpoint, 1);
    
    // Track response times (store for percentile calculation)
    await kv.zadd(`metrics:response_times:${hour}`, {
      score: duration,
      member: `${timestamp}:${Math.random()}`,
    });
    
    // Set expiry (7 days)
    await kv.expire(`metrics:requests:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:endpoints:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:response_times:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    // Don't let metrics tracking break the app
    console.error('Failed to track request:', error);
  }
}

/**
 * Track error occurrence
 */
export async function trackError(
  code: string,
  endpoint: string,
  severity: string
): Promise<void> {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    
    await kv.hincrby(`metrics:errors:${hour}`, code, 1);
    await kv.hincrby(`metrics:errors_by_endpoint:${hour}`, endpoint, 1);
    await kv.hincrby(`metrics:errors_by_severity:${hour}`, severity, 1);
    
    await kv.expire(`metrics:errors:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:errors_by_endpoint:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:errors_by_severity:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    console.error('Failed to track error:', error);
  }
}

/**
 * Track rate limit block
 */
export async function trackRateLimitBlock(
  ip: string,
  endpoint: string
): Promise<void> {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    
    await kv.incr(`metrics:rate_limit_blocks:${hour}`);
    await kv.hincrby(`metrics:rate_limit_ips:${hour}`, ip, 1);
    await kv.hincrby(`metrics:rate_limit_endpoints:${hour}`, endpoint, 1);
    
    await kv.expire(`metrics:rate_limit_blocks:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:rate_limit_ips:${hour}`, 7 * 24 * 3600);
    await kv.expire(`metrics:rate_limit_endpoints:${hour}`, 7 * 24 * 3600);
  } catch (error) {
    console.error('Failed to track rate limit:', error);
  }
}

/**
 * Get metrics for time period
 */
export async function getMetrics(hours = 1): Promise<{
  requests: number;
  errors: number;
  rateLimitBlocks: number;
}> {
  try {
    const now = new Date();
    let totalRequests = 0;
    let totalErrors = 0;
    let totalBlocks = 0;
    
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - i * 3600 * 1000);
      const hour = time.toISOString().slice(0, 13);
      
      const requests = await kv.hgetall(`metrics:requests:${hour}`) || {};
      const errors = await kv.hgetall(`metrics:errors:${hour}`) || {};
      const blocks = await kv.get<number>(`metrics:rate_limit_blocks:${hour}`) || 0;
      
      totalRequests += Object.values(requests).reduce((a: number, b) => a + (b as number), 0);
      totalErrors += Object.values(errors).reduce((a: number, b) => a + (b as number), 0);
      totalBlocks += blocks;
    }
    
    return {
      requests: totalRequests,
      errors: totalErrors,
      rateLimitBlocks: totalBlocks,
    };
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return { requests: 0, errors: 0, rateLimitBlocks: 0 };
  }
}
