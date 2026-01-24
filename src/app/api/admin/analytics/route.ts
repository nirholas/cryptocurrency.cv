/**
 * @fileoverview API Key Analytics Endpoint
 * Provides insights on API usage patterns, top consumers, and trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { headers } from 'next/headers';

interface UsageRecord {
  apiKey: string;
  endpoint: string;
  timestamp: number;
  responseTime: number;
  statusCode: number;
}

interface KeyAnalytics {
  apiKey: string;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  topEndpoints: { endpoint: string; count: number }[];
  requestsByHour: { hour: number; count: number }[];
  lastSeen: string;
}

// Mock usage data store (in production, use Redis or database)
const usageStore: UsageRecord[] = [];

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const headersList = await headers();
  const authResult = verifyAdminAuth(headersList);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
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

  // Filter usage records
  const filteredRecords = usageStore.filter(
    (r) => r.timestamp >= startTime && (!apiKey || r.apiKey === apiKey)
  );

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

// Record usage (called from middleware)
export function recordUsage(record: UsageRecord) {
  usageStore.push(record);
  // Keep only last 7 days of data
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  while (usageStore.length > 0 && usageStore[0].timestamp < cutoff) {
    usageStore.shift();
  }
}
