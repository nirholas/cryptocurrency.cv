/**
 * Health Check Endpoint
 * 
 * Provides system health status including:
 * - API availability
 * - Cache connectivity (Redis or Vercel KV)
 * - External service status
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isRedisAvailable, redisGet, redisSet } from '@/lib/redis';
import { COINGECKO_BASE } from '@/lib/constants';

export const runtime = 'nodejs';
export const revalidate = 0; // Always fresh

// Read version from package.json at module load time
let APP_VERSION = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
  APP_VERSION = pkg.version || APP_VERSION;
} catch {
  // fallback to default
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
}

/**
 * Check cache connectivity — uses Redis (self-hosted) or Vercel KV
 */
async function checkCache(): Promise<HealthCheck> {
  const start = Date.now();

  // Try Redis first (self-hosted / Docker)
  if (isRedisAvailable()) {
    try {
      await redisSet('health:check', Date.now(), 10);
      const result = await redisGet('health:check');
      return {
        status: result ? 'healthy' : 'degraded',
        message: result ? 'Redis connected' : 'Redis accessible but returned unexpected result',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis unavailable',
        responseTime: Date.now() - start,
      };
    }
  }

  // Try Vercel KV (only if env vars suggest it's configured)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set('health:check', Date.now(), { ex: 10 });
      const result = await kv.get('health:check');
      return {
        status: result ? 'healthy' : 'degraded',
        message: result ? 'Vercel KV connected' : 'KV accessible but returned unexpected result',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Vercel KV unavailable',
        responseTime: Date.now() - start,
      };
    }
  }

  // No cache configured — use in-memory (degraded but functional)
  return {
    status: 'degraded',
    message: 'No Redis or Vercel KV configured, using in-memory cache',
    responseTime: Date.now() - start,
  };
}

/**
 * Check external APIs (CoinGecko, etc.)
 */
async function checkExternalAPIs(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${COINGECKO_BASE}/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: 'External API responding slowly or with errors',
      responseTime: Date.now() - start,
    };
  } catch {
    return {
      status: 'degraded',
      message: 'External APIs may be slow or unavailable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  
  const [cache, external] = await Promise.all([
    checkCache(),
    checkExternalAPIs(),
  ]);

  const checks: Record<string, HealthCheck> = {
    api: {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    },
    cache,
    externalAPIs: external,
  };

  // Check x402 only if configured
  if (process.env.X402_FACILITATOR_URL || process.env.X402_PAYMENT_ADDRESS) {
    const url = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
    const start = Date.now();
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      checks.x402Facilitator = {
        status: response.ok ? 'healthy' : 'degraded',
        message: response.ok ? undefined : `Facilitator returned ${response.status}`,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      checks.x402Facilitator = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Facilitator unreachable',
        responseTime: Date.now() - start,
      };
    }
  }

  // Determine overall status
  const coreChecks = [checks.api, checks.cache, checks.externalAPIs];
  const unhealthyCount = coreChecks.filter(c => c.status === 'unhealthy').length;
  const degradedCount = coreChecks.filter(c => c.status === 'degraded').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: Math.floor(process.uptime()),
    checks,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
