/**
 * Admin Licenses API
 * 
 * GET /api/admin/licenses - Get license and revenue statistics
 * GET /api/admin/licenses?keys=true - Get API key details
 * GET /api/admin/licenses?payments=true - Get recent payments
 */

import { type NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { requireAdminAuth } from '@/lib/admin-auth';

export const runtime = 'edge';

// =============================================================================
// Types
// =============================================================================

interface APIKeyStats {
  totalKeys: number;
  activeKeys: number;
  keysByTier: { tier: string; count: number }[];
  recentKeys: {
    id: string;
    name: string;
    tier: string;
    createdAt: string;
    lastUsed?: string;
    usageToday: number;
  }[];
}

interface RevenueStats {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueByType: { type: string; amount: number }[];
  x402Payments: number;
  subscriptions: { tier: string; count: number; revenue: number }[];
  recentPayments: {
    id: string;
    type: 'x402' | 'subscription';
    amount: number;
    endpoint?: string;
    tier?: string;
    timestamp: string;
  }[];
}

// =============================================================================
// Helper Functions
// =============================================================================

async function getAPIKeyStats(): Promise<APIKeyStats> {
  try {
    // Try to get real data from KV
    const [totalKeys, activeKeys, keysByTier, recentKeys] = await Promise.all([
      kv.get<number>('admin:keys:total') || 0,
      kv.get<number>('admin:keys:active') || 0,
      kv.get<{ tier: string; count: number }[]>('admin:keys:byTier') || [],
      kv.lrange<{
        id: string;
        name: string;
        tier: string;
        createdAt: string;
        lastUsed?: string;
        usageToday: number;
      }>('admin:keys:recent', 0, 9),
    ]);

    // If we have real data, return it
    if (totalKeys && totalKeys > 0) {
      return {
        totalKeys,
        activeKeys: activeKeys || 0,
        keysByTier: keysByTier || [],
        recentKeys: recentKeys || [],
      };
    }
  } catch (error) {
    console.warn('KV not available for admin stats:', error);
  }

  // Fallback to aggregating from individual API keys
  // This scans for keys with pattern 'apikey:*'
  try {
    const keysList = await kv.keys('apikey:*');
    const tierCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
    let activeCount = 0;
    const recentKeys: APIKeyStats['recentKeys'] = [];

    for (const key of keysList.slice(0, 100)) {
      const keyData = await kv.get<{
        id: string;
        name: string;
        tier: string;
        createdAt: string;
        lastUsed?: string;
        active: boolean;
        usageToday?: number;
      }>(key);

      if (keyData) {
        tierCounts[keyData.tier] = (tierCounts[keyData.tier] || 0) + 1;
        if (keyData.active) activeCount++;

        if (recentKeys.length < 10) {
          recentKeys.push({
            id: keyData.id,
            name: keyData.name || 'Unnamed Key',
            tier: keyData.tier,
            createdAt: keyData.createdAt,
            lastUsed: keyData.lastUsed,
            usageToday: keyData.usageToday || 0,
          });
        }
      }
    }

    return {
      totalKeys: keysList.length,
      activeKeys: activeCount,
      keysByTier: Object.entries(tierCounts).map(([tier, count]) => ({ tier, count })),
      recentKeys: recentKeys.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  } catch (error) {
    console.warn('Failed to aggregate key stats:', error);
  }

  // Return empty stats if all else fails
  return {
    totalKeys: 0,
    activeKeys: 0,
    keysByTier: [
      { tier: 'free', count: 0 },
      { tier: 'pro', count: 0 },
      { tier: 'enterprise', count: 0 },
    ],
    recentKeys: [],
  };
}

async function getRevenueStats(): Promise<RevenueStats> {
  try {
    // Try to get real data from KV
    const [
      totalRevenue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      x402Payments,
      recentPayments,
    ] = await Promise.all([
      kv.get<number>('admin:revenue:total'),
      kv.get<number>('admin:revenue:today'),
      kv.get<number>('admin:revenue:week'),
      kv.get<number>('admin:revenue:month'),
      kv.get<number>('admin:x402:count'),
      kv.lrange<{
        id: string;
        type: 'x402' | 'subscription';
        amount: number;
        endpoint?: string;
        tier?: string;
        timestamp: string;
      }>('admin:payments:recent', 0, 9),
    ]);

    // Get subscription counts
    const subscriptions = await kv.get<{ tier: string; count: number; revenue: number }[]>(
      'admin:subscriptions:summary'
    );

    // If we have real data, return it
    if (totalRevenue !== null && totalRevenue > 0) {
      const subRevenue = subscriptions?.reduce((sum, s) => sum + s.revenue, 0) || 0;
      const x402Revenue = (totalRevenue || 0) - subRevenue;

      return {
        totalRevenue: totalRevenue || 0,
        revenueToday: revenueToday || 0,
        revenueThisWeek: revenueThisWeek || 0,
        revenueThisMonth: revenueThisMonth || 0,
        revenueByType: [
          { type: 'Subscriptions', amount: subRevenue },
          { type: 'x402 Payments', amount: x402Revenue },
        ],
        x402Payments: x402Payments || 0,
        subscriptions: subscriptions || [],
        recentPayments: recentPayments || [],
      };
    }
  } catch (error) {
    console.warn('KV not available for revenue stats:', error);
  }

  // Try to aggregate from payment logs
  try {
    const paymentLogs = await kv.lrange<{
      id: string;
      type: 'x402' | 'subscription';
      amount: number;
      endpoint?: string;
      tier?: string;
      timestamp: string;
    }>('payments:log', 0, 999);

    if (paymentLogs && paymentLogs.length > 0) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let total = 0;
      let today = 0;
      let week = 0;
      let month = 0;
      let x402Count = 0;
      let subRevenue = 0;
      let x402Revenue = 0;
      const subCounts: Record<string, { count: number; revenue: number }> = {};

      for (const payment of paymentLogs) {
        const paymentDate = new Date(payment.timestamp);
        total += payment.amount;

        if (paymentDate >= todayStart) today += payment.amount;
        if (paymentDate >= weekStart) week += payment.amount;
        if (paymentDate >= monthStart) month += payment.amount;

        if (payment.type === 'x402') {
          x402Count++;
          x402Revenue += payment.amount;
        } else {
          subRevenue += payment.amount;
          if (payment.tier) {
            if (!subCounts[payment.tier]) {
              subCounts[payment.tier] = { count: 0, revenue: 0 };
            }
            subCounts[payment.tier].count++;
            subCounts[payment.tier].revenue += payment.amount;
          }
        }
      }

      return {
        totalRevenue: total,
        revenueToday: today,
        revenueThisWeek: week,
        revenueThisMonth: month,
        revenueByType: [
          { type: 'Subscriptions', amount: subRevenue },
          { type: 'x402 Payments', amount: x402Revenue },
        ],
        x402Payments: x402Count,
        subscriptions: Object.entries(subCounts).map(([tier, data]) => ({
          tier,
          count: data.count,
          revenue: data.revenue,
        })),
        recentPayments: paymentLogs.slice(0, 10),
      };
    }
  } catch (error) {
    console.warn('Failed to aggregate revenue stats:', error);
  }

  // Return empty stats
  return {
    totalRevenue: 0,
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    revenueByType: [
      { type: 'Subscriptions', amount: 0 },
      { type: 'x402 Payments', amount: 0 },
    ],
    x402Payments: 0,
    subscriptions: [],
    recentPayments: [],
  };
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest) {
  // Require admin auth (deny-by-default when token is not configured)
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Return only key stats
    if (searchParams.get('keys') === 'true') {
      const keys = await getAPIKeyStats();
      return NextResponse.json({
        success: true,
        keys,
      });
    }

    // Return only revenue/payment stats
    if (searchParams.get('payments') === 'true' || searchParams.get('revenue') === 'true') {
      const revenue = await getRevenueStats();
      return NextResponse.json({
        success: true,
        revenue,
      });
    }

    // Return full dashboard data
    const [keys, revenue] = await Promise.all([
      getAPIKeyStats(),
      getRevenueStats(),
    ]);

    return NextResponse.json({
      success: true,
      keys,
      revenue,
      dataSource: keys.totalKeys > 0 || revenue.totalRevenue > 0 ? 'live' : 'empty',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin licenses API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch license data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
