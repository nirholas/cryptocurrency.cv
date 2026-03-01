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
 * @fileoverview System Health (Node.js Runtime Only)
 *
 * Extracted from analytics.ts to avoid pulling Node.js-only APIs
 * (process.memoryUsage, process.cpuUsage, process.pid, etc.) into
 * Edge Runtime routes that import the analytics module.
 *
 * Only import this file from routes that use `runtime = 'nodejs'`.
 *
 * @module lib/system-health
 */

import { getDashboardStats } from './analytics';

/**
 * Get system health (server-side, Node.js only)
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

  // Get API metrics from analytics module
  const dashboardStats = getDashboardStats();

  // Determine API health from recent error rate
  const errorRate = typeof dashboardStats.errorRate === 'number' ? dashboardStats.errorRate / 100 : 0;
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
      totalRequests: dashboardStats.totalRequests,
      totalErrors: dashboardStats.totalErrors,
      errorRate: typeof dashboardStats.errorRate === 'number'
        ? dashboardStats.errorRate
        : 0,
      avgResponseTime: dashboardStats.avgResponseTime,
    },
    timestamp: new Date().toISOString(),
  };
}
