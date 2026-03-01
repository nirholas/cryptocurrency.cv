/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * @fileoverview Analytics Tracking (Privacy-Focused)
 * 
 * Anonymous analytics for understanding usage patterns.
 * No personal data is collected. No cookies used.
 * 
 * @module lib/analytics
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
}

// Queue for events when offline
const eventQueue: AnalyticsEvent[] = [];

// Whether to send analytics (respects Do Not Track)
let analyticsEnabled = true;

// ---- Server-side metrics accumulator ----
interface APIMetrics {
  totalRequests: number;
  totalErrors: number;       // statusCode >= 400
  totalResponseTime: number; // cumulative ms
  uniqueUserAgents: Set<string>;
  startTime: number;         // epoch ms when first request was tracked
  endpointCounts: Map<string, number>;
  statusCounts: Map<number, number>;
}

const apiMetrics: APIMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalResponseTime: 0,
  uniqueUserAgents: new Set(),
  startTime: Date.now(),
  endpointCounts: new Map(),
  statusCounts: new Map(),
};

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || (navigator as unknown as { globalPrivacyControl: boolean }).globalPrivacyControl) {
    analyticsEnabled = false;
    return;
  }
  
  // Check user preference
  try {
    const pref = localStorage.getItem('analytics-enabled');
    if (pref === 'false') {
      analyticsEnabled = false;
    }
  } catch {
    // Ignore
  }

  // Flush queued events when the browser comes back online
  window.addEventListener('online', flushEventQueue);
  // Also flush on visibilitychange (user switches back to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      flushEventQueue();
    }
  });
  
  // Track page view
  trackPageView();
}

/**
 * Flush queued analytics events that were captured while offline.
 */
function flushEventQueue(): void {
  if (eventQueue.length === 0 || !navigator.onLine) return;
  const events = eventQueue.splice(0, eventQueue.length);
  for (const payload of events) {
    try {
      const sent = navigator.sendBeacon?.(
        '/api/analytics/events',
        JSON.stringify(payload),
      );
      if (!sent) {
        fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
          // Re-queue failed events
          eventQueue.push(payload);
        });
      }
    } catch {
      eventQueue.push(payload);
    }
  }
}

/**
 * Track a page view
 */
export function trackPageView(): void {
  if (!analyticsEnabled) return;
  
  track('page_view', {
    path: window.location.pathname,
    referrer: document.referrer || 'direct',
  });
}

/**
 * Track an event
 */
export function track(event: string, properties?: Record<string, string | number | boolean>): void {
  if (!analyticsEnabled) return;
  
  const payload: AnalyticsEvent = {
    event,
    properties: {
      ...properties,
      timestamp: Date.now(),
      // Anonymous session ID (changes on each visit)
      session: getSessionId(),
    },
  };
  
  // If offline, queue the event
  if (!navigator.onLine) {
    eventQueue.push(payload);
    return;
  }

  // Send to analytics endpoint
  try {
    // Use navigator.sendBeacon for reliability (survives page unload)
    const sent = navigator.sendBeacon?.(
      '/api/analytics/events',
      JSON.stringify(payload),
    );
    // Fallback to fetch if sendBeacon fails or is unavailable
    if (!sent) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Queue on failure for later retry
        eventQueue.push(payload);
      });
    }
  } catch {
    // Queue on error for later retry
    eventQueue.push(payload);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }
}

/**
 * Get or create a session ID (anonymous, changes each visit)
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics-session');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('analytics-session', sessionId);
  }
  return sessionId;
}

/**
 * Track article view
 */
export function trackArticleView(articleId: string, source: string): void {
  track('article_view', { articleId, source });
}

/**
 * Track search
 */
export function trackSearch(query: string, resultCount: number): void {
  track('search', { query: query.substring(0, 50), resultCount });
}

/**
 * Track category view
 */
export function trackCategoryView(category: string): void {
  track('category_view', { category });
}

/**
 * Track bookmark action
 */
export function trackBookmark(articleId: string, action: 'add' | 'remove'): void {
  track('bookmark', { articleId, action });
}

/**
 * Track share action
 */
export function trackShare(articleId: string, method: string): void {
  track('share', { articleId, method });
}

/**
 * Track theme change
 */
export function trackThemeChange(theme: string): void {
  track('theme_change', { theme });
}

/**
 * Track feature usage
 */
export function trackFeature(feature: string): void {
  track('feature_use', { feature });
}

/**
 * Opt out of analytics
 */
export function optOutAnalytics(): void {
  analyticsEnabled = false;
  try {
    localStorage.setItem('analytics-enabled', 'false');
  } catch {
    // Ignore
  }
}

/**
 * Opt in to analytics
 */
export function optInAnalytics(): void {
  analyticsEnabled = true;
  try {
    localStorage.setItem('analytics-enabled', 'true');
  } catch {
    // Ignore
  }
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

/**
 * Track API call (server-side)
 */
export function trackAPICall(data: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
}): void {
  // Accumulate metrics
  apiMetrics.totalRequests++;
  apiMetrics.totalResponseTime += data.responseTime;
  if (data.statusCode >= 400) {
    apiMetrics.totalErrors++;
  }
  if (data.userAgent) {
    apiMetrics.uniqueUserAgents.add(data.userAgent);
  }

  const epKey = `${data.method} ${data.endpoint}`;
  apiMetrics.endpointCounts.set(epKey, (apiMetrics.endpointCounts.get(epKey) || 0) + 1);
  apiMetrics.statusCounts.set(data.statusCode, (apiMetrics.statusCounts.get(data.statusCode) || 0) + 1);

  if (process.env.NODE_ENV === 'development') {
    console.log('[API]', data.method, data.endpoint, `${data.responseTime}ms`, data.statusCode);
  }
}

/**
 * Track an API request (convenience wrapper around trackAPICall)
 */
export function trackAPIRequest(
  endpoint: string,
  statusCode: number,
  responseTime: number,
  userAgent: string,
): void {
  trackAPICall({
    endpoint,
    method: 'POST',
    statusCode,
    responseTime,
    userAgent,
  });
}

/**
 * Get dashboard stats (server-side)
 */
export function getDashboardStats(): Record<string, number | string> {
  const uptimeMs = Date.now() - apiMetrics.startTime;
  const uptimeHours = uptimeMs / (1000 * 60 * 60);
  const avgResponseTime = apiMetrics.totalRequests > 0
    ? Math.round(apiMetrics.totalResponseTime / apiMetrics.totalRequests)
    : 0;
  const errorRate = apiMetrics.totalRequests > 0
    ? parseFloat(((apiMetrics.totalErrors / apiMetrics.totalRequests) * 100).toFixed(2))
    : 0;

  // Format uptime
  let uptime: string;
  if (uptimeHours < 1) {
    uptime = `${Math.round(uptimeMs / 60000)}m`;
  } else if (uptimeHours < 24) {
    uptime = `${uptimeHours.toFixed(1)}h`;
  } else {
    uptime = `${(uptimeHours / 24).toFixed(1)}d`;
  }

  // Top endpoint
  let topEndpoint = 'none';
  let topCount = 0;
  for (const [ep, count] of apiMetrics.endpointCounts) {
    if (count > topCount) {
      topEndpoint = ep;
      topCount = count;
    }
  }

  return {
    totalRequests: apiMetrics.totalRequests,
    uniqueUsers: apiMetrics.uniqueUserAgents.size,
    avgResponseTime,
    errorRate,
    totalErrors: apiMetrics.totalErrors,
    uptime,
    requestsPerHour: uptimeHours > 0 ? Math.round(apiMetrics.totalRequests / uptimeHours) : 0,
    topEndpoint,
    topEndpointHits: topCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get system health (server-side)
 */
export async function getSystemHealth(): Promise<Record<string, unknown>> {
  const memUsage = process.memoryUsage?.();
  const heapUsed = memUsage?.heapUsed || 0;
  const heapTotal = memUsage?.heapTotal || 0;
  const rss = memUsage?.rss || 0;
  const heapUsedPct = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0;

  // Calculate process uptime and CPU
  const processUptimeSecs = process.uptime?.() || 0;
  const cpuUsage = process.cpuUsage?.();

  // Determine API health from recent error rate
  const errorRate = apiMetrics.totalRequests > 0
    ? apiMetrics.totalErrors / apiMetrics.totalRequests
    : 0;
  const apiStatus = errorRate > 0.3 ? 'degraded'
    : errorRate > 0.05 ? 'warning'
    : 'up';

  // Memory health
  const memoryStatus = heapUsedPct > 90 ? 'critical'
    : heapUsedPct > 70 ? 'warning'
    : 'up';

  // Overall status
  const overallStatus = apiStatus === 'degraded' || memoryStatus === 'critical'
    ? 'unhealthy'
    : apiStatus === 'warning' || memoryStatus === 'warning'
    ? 'degraded'
    : 'healthy';

  return {
    status: overallStatus,
    memory: {
      heapUsed,
      heapTotal,
      rss,
      heapUsedPercent: parseFloat(heapUsedPct.toFixed(1)),
      external: memUsage?.external || 0,
    },
    process: {
      uptimeSeconds: Math.round(processUptimeSecs),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      ...(cpuUsage ? { cpuUser: cpuUsage.user, cpuSystem: cpuUsage.system } : {}),
    },
    api: {
      totalRequests: apiMetrics.totalRequests,
      totalErrors: apiMetrics.totalErrors,
      errorRate: parseFloat((errorRate * 100).toFixed(2)),
      avgResponseTime: apiMetrics.totalRequests > 0
        ? Math.round(apiMetrics.totalResponseTime / apiMetrics.totalRequests)
        : 0,
      statusCodes: Object.fromEntries(apiMetrics.statusCounts),
    },
    timestamp: new Date().toISOString(),
  };
}

// Flush queue when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    while (eventQueue.length > 0) {
      const event = eventQueue.shift();
      if (event) {
        track(event.event, event.properties);
      }
    }
  });
}
