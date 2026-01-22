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
  
  // Track page view
  trackPageView();
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
  
  // Send to analytics endpoint (would need backend implementation)
  // For now, just log to console in development
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
  // Server-side tracking - would typically send to monitoring service
  if (process.env.NODE_ENV === 'development') {
    console.log('[API]', data.method, data.endpoint, `${data.responseTime}ms`, data.statusCode);
  }
}

/**
 * Get dashboard stats (server-side)
 */
export function getDashboardStats(): Record<string, number | string> {
  // In production, this would query actual metrics
  return {
    totalRequests: 0,
    uniqueUsers: 0,
    avgResponseTime: 0,
    errorRate: 0,
    uptime: '100%',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get system health (server-side)
 */
export async function getSystemHealth(): Promise<Record<string, unknown>> {
  // In production, this would check actual system health
  return {
    status: 'healthy',
    services: {
      api: 'up',
      database: 'up',
      cache: 'up',
    },
    memory: {
      used: process.memoryUsage?.().heapUsed || 0,
      total: process.memoryUsage?.().heapTotal || 0,
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
