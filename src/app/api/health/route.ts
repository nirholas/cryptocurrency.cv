/**
 * Health Check Endpoint
 * 
 * Provides system health status including:
 * - API availability
 * - Database connectivity
 * - External service status
 * - Cache status
 * - x402 facilitator status
 */

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge';
export const revalidate = 0; // Always fresh

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
  checks: {
    api: HealthCheck;
    cache: HealthCheck;
    x402Facilitator: HealthCheck;
    externalAPIs: HealthCheck;
  };
}

/**
 * Check cache (Vercel KV) connectivity
 */
async function checkCache(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Try to set and get a test key
    await kv.set('health:check', Date.now(), { ex: 10 });
    const result = await kv.get('health:check');
    
    if (result) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: 'Cache accessible but returned unexpected result',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Cache unavailable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check x402 facilitator status
 */
async function checkX402Facilitator(): Promise<HealthCheck> {
  const start = Date.now();
  const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
  
  try {
    const response = await fetch(`${facilitatorUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    }
    
    return {
      status: 'degraded',
      message: `Facilitator returned ${response.status}`,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Facilitator unreachable',
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check external APIs (CoinGecko, etc.)
 */
async function checkExternalAPIs(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Quick check to CoinGecko ping endpoint
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
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
  } catch (error) {
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
  
  // Run all health checks in parallel
  const [cache, x402, external] = await Promise.all([
    checkCache(),
    checkX402Facilitator(),
    checkExternalAPIs(),
  ]);

  const checks = {
    api: {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    },
    cache,
    x402Facilitator: x402,
    externalAPIs: external,
  };

  // Determine overall status
  const unhealthyCount = Object.values(checks).filter(c => c.status === 'unhealthy').length;
  const degradedCount = Object.values(checks).filter(c => c.status === 'degraded').length;
  
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
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    checks,
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
