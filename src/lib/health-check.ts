/**
 * Comprehensive Health Check System
 * 
 * Monitors all critical dependencies and provides detailed health status.
 * Used for uptime monitoring, load balancer health checks, and debugging.
 */

import { kv } from '@vercel/kv';
import { getX402Server, validateConfig as validateX402Config } from '@/lib/x402/server';

// =============================================================================
// TYPES
// =============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  responseTime: number; // milliseconds
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number; // seconds
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  version: string;
}

// =============================================================================
// INDIVIDUAL HEALTH CHECKS
// =============================================================================

/**
 * Check Vercel KV / Upstash Redis health
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Try to set and get a test key
    const testKey = 'health:check:redis';
    const testValue = Date.now().toString();
    
    await kv.set(testKey, testValue, { ex: 10 }); // Expire in 10 seconds
    const retrieved = await kv.get(testKey);
    
    if (retrieved !== testValue) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: 'Value mismatch in Redis read/write test',
      };
    }
    
    // Clean up
    await kv.del(testKey);
    
    return {
      name: 'redis',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check x402 server configuration
 */
async function checkX402(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const config = validateX402Config();
    
    if (!config.valid) {
      return {
        name: 'x402',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: config.errors.join(', '),
      };
    }
    
    // Try to get server instance
    const server = getX402Server();
    
    return {
      name: 'x402',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        configured: true,
        server: !!server,
      },
    };
  } catch (error) {
    return {
      name: 'x402',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check CoinGecko API availability
 */
async function checkCoinGecko(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      return {
        name: 'coingecko',
        status: 'degraded',
        responseTime: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    }
    
    return {
      name: 'coingecko',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'coingecko',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check news RSS feed availability (sample source)
 */
async function checkNewsSources(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Try to fetch from a reliable source (CoinDesk)
    const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/', {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return {
        name: 'news_sources',
        status: 'degraded',
        responseTime: Date.now() - start,
        error: `Sample source returned HTTP ${response.status}`,
      };
    }
    
    return {
      name: 'news_sources',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'news_sources',
      status: 'degraded',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check database/storage health (Vercel Postgres if configured)
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  // If no database is configured, skip this check
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        configured: false,
        message: 'No database configured (optional)',
      },
    };
  }
  
  try {
    // Basic database connectivity check would go here
    // For now, just mark as healthy if env var is set
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        configured: true,
      },
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// MAIN HEALTH CHECK FUNCTION
// =============================================================================

/**
 * Perform comprehensive system health check
 * 
 * @param includeExternal - Whether to include external service checks (CoinGecko, news sources)
 */
export async function performHealthCheck(includeExternal = true): Promise<SystemHealth> {
  const startTime = Date.now();
  
  // Run all checks in parallel for speed
  const checks = await Promise.all([
    checkRedis(),
    checkX402(),
    checkDatabase(),
    ...(includeExternal ? [checkCoinGecko(), checkNewsSources()] : []),
  ]);
  
  // Calculate summary
  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'healthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
  };
  
  // Determine overall status
  let overallStatus: HealthStatus;
  if (summary.unhealthy > 0) {
    // Any critical service down = unhealthy
    overallStatus = 'unhealthy';
  } else if (summary.degraded > 0) {
    // Some services degraded = degraded
    overallStatus = 'degraded';
  } else {
    // All healthy = healthy
    overallStatus = 'healthy';
  }
  
  // Calculate uptime (process uptime)
  const uptime = process.uptime();
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime,
    checks,
    summary,
    version: process.env.npm_package_version || '1.0.0',
  };
}

/**
 * Quick health check (only critical services)
 * Useful for load balancer health checks that need fast responses
 */
export async function quickHealthCheck(): Promise<{
  status: HealthStatus;
  responseTime: number;
}> {
  const start = Date.now();
  
  try {
    // Just check Redis (critical for rate limiting)
    const redisCheck = await checkRedis();
    
    return {
      status: redisCheck.status,
      responseTime: Date.now() - start,
    };
  } catch {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check if system is ready to handle requests
 * Returns true only if all critical services are healthy
 */
export async function isSystemReady(): Promise<boolean> {
  const health = await performHealthCheck(false); // Don't check external services
  return health.status === 'healthy';
}
