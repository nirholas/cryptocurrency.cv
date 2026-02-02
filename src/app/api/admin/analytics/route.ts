/**
 * @fileoverview API Key Analytics Endpoint
 * Provides insights on API usage patterns, top consumers, and trends
 * 
 * Uses Vercel KV for persistent storage across Edge instances.
 * Falls back to in-memory for development without KV configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

interface UsageRecord {
  apiKey: string;
  endpoint: string;
  timestamp: number;
  responseTime: number;
  statusCode: number;
}

// In-memory fallback for development
const memoryStore: UsageRecord[] = [];
let kvAvailable: boolean | null = null;

// Helper to check if KV is available
async function isKvAvailable(): Promise<boolean> {
  if (kvAvailable !== null) return kvAvailable;
  
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      kvAvailable = false;
      return false;
    }
    const { kv } = await import('@vercel/kv');
    await kv.ping();
    kvAvailable = true;
    return true;
  } catch {
    kvAvailable = false;
    return false;
  }
}

// Get usage records from KV or memory
async function getUsageRecords(startTime: number, apiKey?: string | null): Promise<UsageRecord[]> {
  if (await isKvAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      // Get all keys matching the pattern
      const keys = await kv.keys('analytics:usage:*');
      if (keys.length === 0) return [];
      
      const records: UsageRecord[] = [];
      // Batch fetch in groups of 100
      for (let i = 0; i < keys.length; i += 100) {
        const batch = keys.slice(i, i + 100);
        const values = await kv.mget<UsageRecord[]>(...batch);
        values.forEach((record) => {
          if (record && record.timestamp >= startTime) {
            if (!apiKey || record.apiKey === apiKey) {
              records.push(record);
            }
          }
        });
      }
      return records;
    } catch (error) {
      console.warn('[Analytics] KV fetch failed, using memory:', error);
    }
  }
  
  // Fallback to memory
  return memoryStore.filter(
    (r) => r.timestamp >= startTime && (!apiKey || r.apiKey === apiKey)
  );
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '24h';
  const apiKey = searchParams.get('apiKey');

  // Calculate time range
  const now = Date.now();
  const periodMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }[period] || 24 * 60 * 60 * 1000;

  const startTime = now - periodMs;

  // Get usage records from KV or memory
  const filteredRecords = await getUsageRecords(startTime, apiKey);

  // Aggregate analytics
  const analytics = aggregateAnalytics(filteredRecords, period);

  return NextResponse.json({
    period,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(now).toISOString(),
    ...analytics,
  });
}

function aggregateAnalytics(records: UsageRecord[], period: string) {
  if (records.length === 0) {
    return {
      summary: {
        totalRequests: 0,
        uniqueKeys: 0,
        avgResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      },
      topEndpoints: [],
      topConsumers: [],
      errorsByEndpoint: [],
      hourlyDistribution: [],
      trends: {
        requestsChange: 0,
        errorRateChange: 0,
        responseTimeChange: 0,
      },
    };
  }

  // Calculate summary stats
  const uniqueKeys = new Set(records.map((r) => r.apiKey)).size;
  const totalRequests = records.length;
  const avgResponseTime =
    records.reduce((sum, r) => sum + r.responseTime, 0) / records.length;
  const errors = records.filter((r) => r.statusCode >= 400).length;
  const errorRate = (errors / totalRequests) * 100;

  // Time range for requests per minute
  const timeRangeMs =
    records.length > 1
      ? Math.max(...records.map((r) => r.timestamp)) -
        Math.min(...records.map((r) => r.timestamp))
      : 60000;
  const requestsPerMinute = (totalRequests / timeRangeMs) * 60000;

  // Top endpoints
  const endpointCounts: Record<string, number> = {};
  records.forEach((r) => {
    endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] || 0) + 1;
  });
  const topEndpoints = Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top consumers
  const keyCounts: Record<string, number> = {};
  records.forEach((r) => {
    keyCounts[r.apiKey] = (keyCounts[r.apiKey] || 0) + 1;
  });
  const topConsumers = Object.entries(keyCounts)
    .map(([apiKey, count]) => ({
      apiKey: apiKey.slice(0, 8) + '...',
      count,
      percentage: ((count / totalRequests) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Errors by endpoint
  const errorsByEndpoint: Record<string, number> = {};
  records
    .filter((r) => r.statusCode >= 400)
    .forEach((r) => {
      errorsByEndpoint[r.endpoint] = (errorsByEndpoint[r.endpoint] || 0) + 1;
    });
  const errorsList = Object.entries(errorsByEndpoint)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Hourly distribution
  const hourlyBuckets: Record<number, number> = {};
  records.forEach((r) => {
    const hour = new Date(r.timestamp).getHours();
    hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
  });
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourlyBuckets[hour] || 0,
  }));

  return {
    summary: {
      totalRequests,
      uniqueKeys,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(errorRate.toFixed(2)),
      requestsPerMinute: parseFloat(requestsPerMinute.toFixed(2)),
    },
    topEndpoints,
    topConsumers,
    errorsByEndpoint: errorsList,
    hourlyDistribution,
    trends: {
      requestsChange: 0, // Would compare to previous period
      errorRateChange: 0,
      responseTimeChange: 0,
    },
  };
}

// Record usage - stores in KV for persistence across Edge instances
export async function recordUsage(record: UsageRecord): Promise<void> {
  const key = `analytics:usage:${record.timestamp}:${Math.random().toString(36).slice(2, 8)}`;
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  
  if (await isKvAvailable()) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(key, record, { ex: ttl });
      return;
    } catch (error) {
      console.warn('[Analytics] KV write failed, using memory:', error);
    }
  }
  
  // Fallback to memory
  memoryStore.push(record);
  // Keep only last 7 days of data
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  while (memoryStore.length > 0 && memoryStore[0].timestamp < cutoff) {
    memoryStore.shift();
  }
}
