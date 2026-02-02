/**
 * Admin Metrics Dashboard API
 * 
 * Provides comprehensive metrics and analytics for system administrators.
 * Requires authentication via API key with admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsSummary, getAllEndpointMetrics, getFailedPayments } from '@/lib/x402-metrics';
import { performHealthCheck } from '@/lib/health-check';
import { validateApiKey } from '@/lib/api-keys';
import { ApiError } from '@/lib/api-error';

export const runtime = 'edge';
export const revalidate = 0; // Always fresh for admin dashboard

/**
 * GET /api/admin/metrics
 * 
 * Returns comprehensive system metrics including:
 * - x402 payment statistics
 * - Rate limit analytics
 * - System health
 * - Top endpoints by usage/revenue
 * - Failed payments for debugging
 * 
 * Requires: Admin API key
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return ApiError.unauthorized('Admin API key required');
  }
  
  const keyData = await validateApiKey(apiKey);
  
  if (!keyData || keyData.tier !== 'enterprise') {
    return ApiError.forbidden('Admin access required (enterprise tier)');
  }
  
  try {
    // Gather all metrics in parallel
    const [
      x402Metrics,
      endpointMetrics,
      failedPayments,
      systemHealth,
    ] = await Promise.all([
      getMetricsSummary(),
      getAllEndpointMetrics(),
      getFailedPayments(20),
      performHealthCheck(true),
    ]);
    
    // Calculate additional insights
    const insights = {
      totalRevenue: x402Metrics.last7d.totalRevenue,
      avgRevenuePerDay: x402Metrics.last7d.totalRevenue / 7,
      successRate: x402Metrics.last7d.successRate,
      topPerformingEndpoint: endpointMetrics[0] || null,
      recentFailureRate: failedPayments.length > 0 ? (failedPayments.length / 20) * 100 : 0,
      systemHealth: {
        status: systemHealth.status,
        healthyChecks: systemHealth.summary.healthy,
        totalChecks: systemHealth.summary.total,
        uptime: systemHealth.uptime,
      },
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        x402: x402Metrics,
        endpoints: endpointMetrics.slice(0, 10), // Top 10
        failedPayments: failedPayments.slice(0, 10), // Recent 10
        health: systemHealth,
      },
      insights,
    });
  } catch (error) {
    console.error('[admin-metrics] Error fetching metrics:', error);
    return ApiError.internal('Failed to fetch metrics', error);
  }
}
