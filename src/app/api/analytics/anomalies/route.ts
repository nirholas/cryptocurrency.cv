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
 * Anomaly Detection API
 * 
 * Detect unusual patterns in news flow.
 * 
 * GET /api/analytics/anomalies
 * Query params:
 *   - hours: Time window (default: 24, max: 168)
 *   - severity: high | medium | low (optional, filter by severity)
 */

import { type NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { 
  getAnomalyReport, 
  getAnomalyStats,
  type AnomalySeverity 
} from '@/lib/anomaly-detector';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Parse query parameters
  const hours = Math.min(Math.max(parseInt(searchParams.get('hours') || '24'), 1), 168);
  const severityParam = searchParams.get('severity');
  
  // Validate severity
  let severity: AnomalySeverity | undefined;
  if (severityParam) {
    if (!['high', 'medium', 'low'].includes(severityParam)) {
      return errorResponse(
        'Invalid severity parameter',
        'severity must be one of: high, medium, low',
        400
      );
    }
    severity = severityParam as AnomalySeverity;
  }
  
  try {
    // Get anomaly report
    const report = await getAnomalyReport({ hours, severity });
    
    // Add detection stats
    const stats = getAnomalyStats();
    
    // Add summary
    const summary = {
      totalAnomalies: report.anomalies.length,
      bySeverity: {
        high: report.anomalies.filter(a => a.severity === 'high').length,
        medium: report.anomalies.filter(a => a.severity === 'medium').length,
        low: report.anomalies.filter(a => a.severity === 'low').length,
      },
      byType: report.anomalies.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    const responseData = withTiming({
      ...report,
      summary,
      params: { hours, severity },
      stats,
    }, startTime);
    
    return jsonResponse(responseData, {
      cacheControl: 'realtime',
      etag: true,
      request,
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return errorResponse('Failed to get anomaly report');
  }
}
