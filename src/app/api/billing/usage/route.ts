/**
 * Usage Analytics API Route
 * 
 * Provides detailed API usage analytics, endpoint breakdowns,
 * and rate limit information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentUsage, 
  getUsageHistory, 
  getTopEndpoints,
  checkUsageLimit,
  checkRateLimit,
  BILLING_TIERS,
  type BillingTier,
} from '@/lib/billing';

interface UsageBreakdown {
  endpoint: string;
  method: string;
  count: number;
  percentage: number;
  avgResponseTime: number;
  errorRate: number;
}

interface HourlyUsage {
  hour: string;
  requests: number;
  errors: number;
  avgLatency: number;
}

// In-memory storage for analytics (use Redis in production)
const analyticsStore = new Map<string, {
  hourlyUsage: HourlyUsage[];
  endpointBreakdown: UsageBreakdown[];
  lastUpdated: Date;
}>();

/**
 * GET /api/billing/usage
 * Get detailed usage analytics
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeyId = request.headers.get('x-api-key-id');
    const tier = (request.headers.get('x-billing-tier') || 'free') as BillingTier;
    
    if (!apiKeyId) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'current';
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get current usage
    const currentUsage = getCurrentUsage(apiKeyId, tier);
    
    // Get usage history
    const history = getUsageHistory(apiKeyId, days);
    
    // Get top endpoints
    const topEndpoints = getTopEndpoints(apiKeyId, 10);
    
    // Get tier limits
    const tierInfo = BILLING_TIERS[tier];
    
    // Check current limits
    const { allowed: withinLimit, remaining: requestsRemaining } = 
      checkUsageLimit(apiKeyId, 'apiRequests', tier);
    const { allowed: withinRateLimit, remaining: rateLimitRemaining, resetAt } = 
      checkRateLimit(apiKeyId, tier);

    // Calculate analytics
    const totalRequests = currentUsage.usage.apiRequests;
    const avgDailyRequests = history.length > 0
      ? history.reduce((sum, h) => sum + h.usage.apiRequests, 0) / history.length
      : totalRequests;

    const monthlyLimit = tierInfo.features.requestsPerMonth;
    const projectedMonthlyUsage = Math.round(avgDailyRequests * 30);
    const usagePercentage = monthlyLimit > 0
      ? Math.round((totalRequests / monthlyLimit) * 100)
      : 0;

    // Calculate cost projection for overages
    const projectedOverage = Math.max(0, projectedMonthlyUsage - monthlyLimit);
    const OVERAGE_RATE = 0.0001; // $0.0001 per request
    const projectedOverageCost = projectedOverage * OVERAGE_RATE;

    // Generate hourly breakdown for today
    const hourlyBreakdown = generateHourlyBreakdown(apiKeyId);

    // Get endpoint breakdown
    const endpointBreakdown = generateEndpointBreakdown(topEndpoints, totalRequests);

    // Calculate summary statistics
    const summary = {
      totalRequests,
      avgDailyRequests: Math.round(avgDailyRequests),
      projectedMonthlyUsage,
      usagePercentage,
      limit: monthlyLimit,
      remaining: requestsRemaining,
      overageRequests: currentUsage.overages.apiRequests,
      overageCost: currentUsage.estimatedCost,
      projectedOverageCost,
    };

    // Rate limit info
    const rateLimit = {
      limit: tierInfo.features.requestsPerMinute,
      remaining: rateLimitRemaining,
      resetAt: resetAt.toISOString(),
      isLimited: !withinRateLimit,
    };

    // Real-time info
    const realtime = {
      websocketConnections: 0, // Not tracked in current implementation
      maxConnections: tier === 'enterprise' ? 100 : tier === 'pro' ? 10 : 1,
    };

    return NextResponse.json({
      summary,
      rateLimit,
      realtime,
      hourlyBreakdown,
      endpointBreakdown,
      history: history.map(h => ({
        date: h.date,
        requests: h.usage.apiRequests,
        trend: h.usage.apiRequests > avgDailyRequests ? 'up' : 'down',
      })),
      period: {
        start: currentUsage.period.start.toISOString(),
        end: currentUsage.period.end.toISOString(),
        daysRemaining: Math.ceil(
          (currentUsage.period.end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
      alerts: generateAlerts(summary, tier),
    });
  } catch (error) {
    console.error('Usage analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/usage
 * Record a usage event (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET;

    // Only allow internal services to record usage
    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      apiKeyId, 
      endpoint, 
      method, 
      responseTime, 
      statusCode, 
      bytes = 0,
    } = body;

    if (!apiKeyId || !endpoint) {
      return NextResponse.json(
        { error: 'apiKeyId and endpoint are required' },
        { status: 400 }
      );
    }

    // Record in analytics store
    recordAnalyticsEvent({
      apiKeyId,
      endpoint,
      method,
      responseTime,
      statusCode,
      bytes,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Usage recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateHourlyBreakdown(apiKeyId: string): HourlyUsage[] {
  // First check if we have real analytics data
  const storedAnalytics = analyticsStore.get(apiKeyId);
  
  if (storedAnalytics && storedAnalytics.hourlyUsage.length > 0) {
    // Return real collected data
    return storedAnalytics.hourlyUsage
      .slice(-24) // Last 24 hours
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime());
  }
  
  // Return empty hourly breakdown if no data collected yet
  const now = new Date();
  const hours: HourlyUsage[] = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(now.getHours() - i, 0, 0, 0);
    
    hours.push({
      hour: hour.toISOString(),
      requests: 0,
      errors: 0,
      avgLatency: 0,
    });
  }

  return hours;
}

function generateEndpointBreakdown(
  topEndpoints: Array<{ endpoint: string; count: number }>,
  totalRequests: number
): UsageBreakdown[] {
  if (topEndpoints.length === 0) {
    // Return empty breakdown when no data
    return [];
  }

  return topEndpoints.map(ep => ({
    endpoint: ep.endpoint,
    method: 'GET',
    count: ep.count,
    percentage: totalRequests > 0 ? Math.round((ep.count / totalRequests) * 100) : 0,
    avgResponseTime: 0, // Will be populated from real analytics when available
    errorRate: 0, // Will be populated from real analytics when available
  }));
}

interface AnalyticsEvent {
  apiKeyId: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  bytes: number;
  timestamp: Date;
}

function recordAnalyticsEvent(event: AnalyticsEvent): void {
  const key = event.apiKeyId;
  const existing = analyticsStore.get(key) || {
    hourlyUsage: [],
    endpointBreakdown: [],
    lastUpdated: new Date(),
  };

  // Update hourly usage
  const hourKey = new Date(event.timestamp).setMinutes(0, 0, 0).toString();
  const hourEntry = existing.hourlyUsage.find(h => 
    new Date(h.hour).getTime().toString() === hourKey
  );

  if (hourEntry) {
    hourEntry.requests++;
    if (event.statusCode >= 400) hourEntry.errors++;
    hourEntry.avgLatency = (hourEntry.avgLatency + event.responseTime) / 2;
  } else {
    existing.hourlyUsage.push({
      hour: new Date(parseInt(hourKey)).toISOString(),
      requests: 1,
      errors: event.statusCode >= 400 ? 1 : 0,
      avgLatency: event.responseTime,
    });
  }

  // Update endpoint breakdown
  const endpointEntry = existing.endpointBreakdown.find(e => 
    e.endpoint === event.endpoint && e.method === event.method
  );

  if (endpointEntry) {
    endpointEntry.count++;
    endpointEntry.avgResponseTime = (endpointEntry.avgResponseTime + event.responseTime) / 2;
    if (event.statusCode >= 400) {
      endpointEntry.errorRate = (endpointEntry.errorRate * (endpointEntry.count - 1) + 100) / endpointEntry.count;
    }
  } else {
    existing.endpointBreakdown.push({
      endpoint: event.endpoint,
      method: event.method,
      count: 1,
      percentage: 0, // Will be calculated on read
      avgResponseTime: event.responseTime,
      errorRate: event.statusCode >= 400 ? 100 : 0,
    });
  }

  existing.lastUpdated = new Date();
  analyticsStore.set(key, existing);
}

interface Alert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  action?: string;
}

function generateAlerts(
  summary: { usagePercentage: number; projectedOverageCost: number; remaining: number },
  tier: BillingTier
): Alert[] {
  const alerts: Alert[] = [];

  if (summary.usagePercentage >= 100) {
    alerts.push({
      type: 'critical',
      message: 'You have exceeded your monthly request limit',
      action: tier === 'free' ? 'Upgrade to Pro' : 'Consider upgrading to Enterprise',
    });
  } else if (summary.usagePercentage >= 90) {
    alerts.push({
      type: 'warning',
      message: `You've used ${summary.usagePercentage}% of your monthly limit`,
      action: 'Consider upgrading your plan',
    });
  } else if (summary.usagePercentage >= 75) {
    alerts.push({
      type: 'info',
      message: `You've used ${summary.usagePercentage}% of your monthly limit`,
    });
  }

  if (summary.projectedOverageCost > 10) {
    alerts.push({
      type: 'warning',
      message: `Projected overage cost: $${summary.projectedOverageCost.toFixed(2)}`,
      action: 'Review usage patterns or upgrade plan',
    });
  }

  return alerts;
}
