'use client';

/**
 * Billing Dashboard
 * 
 * Complete billing management interface including:
 * - Current plan overview
 * - Usage analytics with charts
 * - Invoice history
 * - Plan upgrade/downgrade
 * - Payment method management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CpuChipIcon,
  GlobeAltIcon,
  SparklesIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useApiKeyStandalone } from '@/hooks/useApiKey';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface BillingData {
  subscription: {
    tier: string;
    tierName: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriod: {
      start: string;
      end: string;
    };
  };
  usage: {
    current: {
      apiCalls: number;
      aiTokens: number;
      webhookDeliveries: number;
      dataExports: number;
      websocketMinutes: number;
    };
    limits: {
      apiCalls: number;
      aiTokens: number;
      webhookDeliveries: number;
      dataExports: number;
      websocketMinutes: number;
    };
    overages: {
      apiCalls: number;
      aiTokens: number;
      webhookDeliveries: number;
      dataExports: number;
    };
    estimatedOverageCost: number;
    period: {
      start: string;
      end: string;
    };
  };
  usageHistory: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    created: string;
    invoicePdf: string | null;
    hostedInvoiceUrl: string | null;
  }>;
  upcomingInvoice: {
    amountDue: number;
    dueDate: string | null;
    lineItems: Array<{
      description: string;
      amount: number;
    }>;
  } | null;
}

interface UsageAnalytics {
  summary: {
    totalRequests: number;
    avgDailyRequests: number;
    projectedMonthlyUsage: number;
    usagePercentage: number;
    limit: number;
    remaining: number;
    overageRequests: number;
    overageCost: number;
    projectedOverageCost: number;
  };
  rateLimit: {
    limit: number;
    remaining: number;
    resetIn: number;
    isLimited: boolean;
  };
  hourlyBreakdown: Array<{
    hour: string;
    requests: number;
    errors: number;
    avgLatency: number;
  }>;
  endpointBreakdown: Array<{
    endpoint: string;
    count: number;
    percentage: number;
    avgResponseTime: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    action?: string;
  }>;
}

const TIER_COLORS = {
  free: 'gray',
  pro: 'blue',
  enterprise: 'purple',
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function BillingDashboard() {
  const { apiKey, setApiKey: saveApiKey, clearApiKey } = useApiKeyStandalone();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'invoices'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const fetchBillingData = useCallback(async () => {
    // If no API key, show input form instead of using demo data
    if (!apiKey) {
      setIsLoading(false);
      setShowApiKeyInput(true);
      return;
    }

    try {
      // Use the stored API key for authenticated requests
      const headers: Record<string, string> = {
        'X-API-Key': apiKey,
      };

      const [billingRes, usageRes] = await Promise.all([
        fetch('/api/billing', { headers }),
        fetch('/api/billing/usage', { headers }),
      ]);

      if (!billingRes.ok || !usageRes.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const [billing, usage] = await Promise.all([
        billingRes.json(),
        usageRes.json(),
      ]);

      setBillingData(billing);
      setAnalytics(usage);
      setShowApiKeyInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBillingData();
    setIsRefreshing(false);
  };

  const handleManageSubscription = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ action: 'portal' }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputApiKey && inputApiKey.startsWith('cda_')) {
      saveApiKey(inputApiKey);
      setInputApiKey('');
      setIsLoading(true);
    }
  };

  const handleLogout = () => {
    clearApiKey();
    setBillingData(null);
    setAnalytics(null);
    setShowApiKeyInput(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Show API key input when not authenticated
  if (showApiKeyInput || !apiKey) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Billing Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your API key to access billing and usage information
            </p>
          </div>

          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                id="apiKey"
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                placeholder="cda_..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your API key starts with &quot;cda_&quot;
              </p>
            </div>

            <button
              type="submit"
              disabled={!inputApiKey || !inputApiKey.startsWith('cda_')}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Access Dashboard
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an API key?{' '}
              <a href="/developers" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Get started free
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Failed to Load Billing Data
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Require billing data - don't use fallback demo data
  if (!billingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
            No Billing Data Available
          </h2>
          <p className="text-yellow-600 dark:text-yellow-300 mb-4">
            Unable to load billing information. Please check your API key and try again.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const subscription = billingData.subscription;

  const usage = billingData.usage || {
    current: { apiCalls: 0, aiTokens: 0, webhookDeliveries: 0, dataExports: 0, websocketMinutes: 0 },
    limits: { apiCalls: 1000, aiTokens: 0, webhookDeliveries: 0, dataExports: 0, websocketMinutes: 0 },
    overages: { apiCalls: 0, aiTokens: 0, webhookDeliveries: 0, dataExports: 0 },
    estimatedOverageCost: 0,
    period: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };

  const usageHistory = billingData.usageHistory || [];

  const invoices = billingData.invoices || [];

  const summaryStats = analytics?.summary || {
    totalRequests: usage.current.apiCalls,
    avgDailyRequests: 0,
    projectedMonthlyUsage: 0,
    usagePercentage: usage.limits.apiCalls > 0 ? Math.round((usage.current.apiCalls / usage.limits.apiCalls) * 100) : 0,
    limit: usage.limits.apiCalls,
    remaining: usage.limits.apiCalls - usage.current.apiCalls,
    overageRequests: 0,
    overageCost: 0,
    projectedOverageCost: 0,
  };

  const alerts = analytics?.alerts || [];

  const endpointBreakdown = analytics?.endpointBreakdown || [];

  const tierColor = TIER_COLORS[subscription.tier as keyof typeof TIER_COLORS] || 'gray';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Usage
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription and monitor API usage
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleManageSubscription}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" />
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3 mb-8">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                alert.type === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <ExclamationTriangleIcon
                className={`w-5 h-5 flex-shrink-0 ${
                  alert.type === 'critical'
                    ? 'text-red-500'
                    : alert.type === 'warning'
                    ? 'text-amber-500'
                    : 'text-blue-500'
                }`}
              />
              <div className="flex-1">
                <p className={`font-medium ${
                  alert.type === 'critical'
                    ? 'text-red-700 dark:text-red-400'
                    : alert.type === 'warning'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {alert.message}
                </p>
                {alert.action && (
                  <button className="text-sm underline mt-1">
                    {alert.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700 mb-8">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'usage', label: 'Usage Details', icon: ArrowTrendingUpIcon },
            { id: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Plan Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-${tierColor}-100 dark:bg-${tierColor}-900/30`}>
                  <BoltIcon className={`w-6 h-6 text-${tierColor}-600 dark:text-${tierColor}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subscription.tierName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Renews {formatDate(subscription.currentPeriod.end)}
                  </p>
                </div>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Cancels at end of period
                </p>
              )}
            </div>

            {/* Usage Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                API Usage This Month
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(usage.current.apiCalls)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  / {formatNumber(usage.limits.apiCalls)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    summaryStats.usagePercentage >= 90
                      ? 'bg-red-500'
                      : summaryStats.usagePercentage >= 75
                      ? 'bg-gray-400'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(summaryStats.usagePercentage, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {summaryStats.usagePercentage}% used • {formatNumber(summaryStats.remaining)} remaining
              </p>
            </div>

            {/* Projected Cost */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Projected This Month
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${subscription.tier === 'free' ? '0' : '29'}
                </span>
                {summaryStats.projectedOverageCost > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    + ${summaryStats.projectedOverageCost.toFixed(2)} overage
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Based on current usage patterns
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {summaryStats.projectedMonthlyUsage > usage.limits.apiCalls ? (
                  <>
                    <ArrowTrendingUpIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Projected to exceed limit
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      Within plan limits
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              API Requests (Last 30 Days)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageHistory}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-gray-500"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatNumber}
                    className="text-gray-500"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [formatNumber(value), 'Requests']}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                label: 'AI Tokens',
                value: formatNumber(usage.current.aiTokens),
                max: formatNumber(usage.limits.aiTokens),
                percentage: Math.round((usage.current.aiTokens / usage.limits.aiTokens) * 100),
                icon: SparklesIcon,
                color: 'purple',
              },
              {
                label: 'Webhooks',
                value: formatNumber(usage.current.webhookDeliveries),
                max: formatNumber(usage.limits.webhookDeliveries),
                percentage: Math.round((usage.current.webhookDeliveries / usage.limits.webhookDeliveries) * 100),
                icon: GlobeAltIcon,
                color: 'green',
              },
              {
                label: 'Data Exports',
                value: usage.current.dataExports.toString(),
                max: usage.limits.dataExports.toString(),
                percentage: Math.round((usage.current.dataExports / usage.limits.dataExports) * 100),
                icon: DocumentTextIcon,
                color: 'amber',
              },
              {
                label: 'WebSocket',
                value: `${usage.current.websocketMinutes} min`,
                max: `${usage.limits.websocketMinutes} min`,
                percentage: Math.round((usage.current.websocketMinutes / usage.limits.websocketMinutes) * 100),
                icon: CpuChipIcon,
                color: 'blue',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value} <span className="text-sm font-normal text-gray-500">/ {stat.max}</span>
                </p>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${stat.color}-500`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Details Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-8">
          {/* Endpoint Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Requests by Endpoint
              </h3>
              <div className="space-y-4">
                {endpointBreakdown.map((endpoint, index) => (
                  <div key={endpoint.endpoint}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                        {endpoint.endpoint}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(endpoint.count)} ({endpoint.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${endpoint.percentage}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Usage Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={endpointBreakdown}
                      dataKey="count"
                      nameKey="endpoint"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ endpoint }) => endpoint.split('/').pop()}
                    >
                      {endpointBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.endpoint}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Average Response Times
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={endpointBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis type="number" unit="ms" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="endpoint"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.replace('/api/', '')}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}ms`, 'Avg Response']}
                  />
                  <Bar dataKey="avgResponseTime" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rate Limit Status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rate Limit Status
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics?.rateLimit?.limit || 100}/min
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics?.rateLimit?.remaining || 100}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Resets In</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  {analytics?.rateLimit?.resetIn || 60}s
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-8">
          {/* Upcoming Invoice */}
          {billingData?.upcomingInvoice && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Upcoming Invoice
                </h3>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${billingData.upcomingInvoice.amountDue.toFixed(2)}
                </span>
              </div>
              {billingData.upcomingInvoice.dueDate && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Due {formatDate(billingData.upcomingInvoice.dueDate)}
                </p>
              )}
              <div className="space-y-2">
                {billingData.upcomingInvoice.lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm text-blue-800 dark:text-blue-200"
                  >
                    <span>{item.description}</span>
                    <span>${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice History */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invoice History
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {invoices.length === 0 ? (
                <div className="p-8 text-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : invoice.status === 'open'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {invoice.status === 'paid' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : invoice.status === 'open' ? (
                          <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.number}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.created)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${invoice.amountPaid.toFixed(2)}
                        </p>
                        <p className={`text-sm capitalize ${
                          invoice.status === 'paid'
                            ? 'text-green-600 dark:text-green-400'
                            : invoice.status === 'open'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="Download PDF"
                          >
                            <DocumentTextIcon className="w-5 h-5" />
                          </a>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="View Invoice"
                          >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
