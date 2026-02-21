'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { UsageChart, TierDistribution } from '@/components/admin/UsageChart';

// Existing types
interface DashboardStats {
  totalCalls: number;
  callsToday: number;
  uniqueUsersToday: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: { endpoint: string; calls: number }[];
  callsByHour: { hour: string; calls: number }[];
  errorsByEndpoint: { endpoint: string; count: number }[];
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    lastCheck: string;
    responseTime?: number;
  }[];
}

interface FullData {
  stats: DashboardStats;
  health: SystemHealth;
}

// New API key types
interface KeyStats {
  total: number;
  byTier: {
    free: number;
    pro: number;
    enterprise: number;
  };
  active24h: number;
  active7d: number;
  active30d: number;
  totalRequestsToday: number;
  totalRequestsMonth: number;
  topKeys: {
    id: string;
    keyPrefix: string;
    email: string;
    tier: string;
    usageToday: number;
    usageMonth: number;
    lastUsedAt?: string;
  }[];
  usageByDay: { date: string; requests: number }[];
}

interface ApiKeyListItem {
  id: string;
  keyPrefix: string;
  name: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: string[];
  rateLimit: number;
  usageToday: number;
  usageMonth: number;
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
}

interface KeysResponse {
  keys: ApiKeyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type TabType = 'overview' | 'keys' | 'system';

export default function AdminDashboard() {
  const [data, setData] = useState<FullData | null>(null);
  const [keyStats, setKeyStats] = useState<KeyStats | null>(null);
  const [keysList, setKeysList] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Keys list filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const t = useTranslations('common');

  const fetchSystemData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin?view=full', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setError('Invalid token');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch system data');
      }

      const result = await response.json();
      setData(result);
      setAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [token]);

  const fetchKeyStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setKeyStats(result.stats);
      }
    } catch (err) {
      console.error('Failed to fetch key stats:', err);
    }
  }, [token]);

  const fetchKeysList = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (searchQuery) params.set('search', searchQuery);
      if (tierFilter) params.set('tier', tierFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/keys?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setKeysList(result);
      }
    } catch (err) {
      console.error('Failed to fetch keys list:', err);
    }
  }, [token, currentPage, searchQuery, tierFilter, statusFilter, sortBy, sortOrder]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSystemData(), fetchKeyStats(), fetchKeysList()]);
    setLoading(false);
  }, [fetchSystemData, fetchKeyStats, fetchKeysList]);

  useEffect(() => {
    if (authenticated) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchAllData]);

  useEffect(() => {
    if (authenticated) {
      fetchKeysList();
    }
  }, [
    authenticated,
    currentPage,
    searchQuery,
    tierFilter,
    statusFilter,
    sortBy,
    sortOrder,
    fetchKeysList,
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, just validate the token with the main admin API
      const response = await fetch('/api/admin?view=full', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setError('Invalid token');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const result = await response.json();
      setData(result);
      setAuthenticated(true);
      setError(null);
      setLoading(false);

      // Fetch additional data in the background (don't block)
      fetchKeyStats();
      fetchKeysList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  const handleKeyAction = async (keyId: string, action: 'revoke' | 'activate') => {
    try {
      const response = await fetch('/api/admin/keys', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyId, action }),
      });

      if (response.ok) {
        fetchKeysList();
        fetchKeyStats();
      }
    } catch (err) {
      console.error('Failed to update key:', err);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 w-full max-w-md border border-neutral-800">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400 text-sm mb-6">Enter your admin token to continue</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium mb-2">
                Admin Token
              </label>
              <input
                type="password"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                placeholder="Enter admin token"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !data && !keyStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Error state
  if (error && !data && !keyStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    up: 'bg-green-500',
    down: 'bg-red-500',
  };

  const tierColors = {
    free: 'bg-green-500/20 text-green-400 border-green-500/30',
    pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-neutral-400 mt-1">Monitor API keys, usage, and system health</p>
          </div>
          <div className="flex items-center gap-4">
            {data?.health && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[data.health.status]} text-black`}
              >
                {data.health.status.toUpperCase()}
              </div>
            )}
            <button
              onClick={fetchAllData}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              title={t('refresh')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-800">
          {[
            { id: 'overview', label: 'API Key Analytics', icon: '📊' },
            { id: 'keys', label: 'Manage Keys', icon: '🔑' },
            { id: 'system', label: 'System Health', icon: '🖥️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && keyStats && (
          <div className="space-y-8">
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total API Keys"
                value={formatNumber(keyStats.total)}
                subtitle={`${keyStats.byTier.free} free / ${keyStats.byTier.pro} pro / ${keyStats.byTier.enterprise} ent`}
              />
              <StatCard
                label="Active (24h)"
                value={formatNumber(keyStats.active24h)}
                subtitle={`${((keyStats.active24h / keyStats.total) * 100 || 0).toFixed(0)}% of total`}
                trend={keyStats.active24h > 0 ? 'up' : 'neutral'}
              />
              <StatCard label="Requests Today" value={formatNumber(keyStats.totalRequestsToday)} />
              <StatCard
                label="Requests This Month"
                value={formatNumber(keyStats.totalRequestsMonth)}
              />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Usage Chart */}
              <UsageChart data={keyStats.usageByDay} title="Daily API Requests (Last 30 Days)" />

              {/* Tier Distribution */}
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h3 className="text-lg font-semibold mb-4">Keys by Tier</h3>
                <TierDistribution
                  free={keyStats.byTier.free}
                  pro={keyStats.byTier.pro}
                  enterprise={keyStats.byTier.enterprise}
                />
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400">24h</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{keyStats.active24h}</p>
                    <p className="text-sm text-neutral-400">Active last 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400">7d</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{keyStats.active7d}</p>
                    <p className="text-sm text-neutral-400">Active last 7 days</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400">30d</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{keyStats.active30d}</p>
                    <p className="text-sm text-neutral-400">Active last 30 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users Table */}
            {keyStats.topKeys.length > 0 && (
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h3 className="text-lg font-semibold mb-4">Top 10 API Keys by Usage</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-neutral-400 border-b border-neutral-800">
                        <th className="pb-3 font-medium">Key</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Tier</th>
                        <th className="pb-3 font-medium text-right">Today</th>
                        <th className="pb-3 font-medium text-right">Month</th>
                        <th className="pb-3 font-medium text-right">Last Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyStats.topKeys.map((key) => (
                        <tr key={key.id} className="border-b border-neutral-800/50">
                          <td className="py-3 font-mono text-sm">{key.keyPrefix}...</td>
                          <td className="py-3 text-sm">{key.email}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${tierColors[key.tier as keyof typeof tierColors]}`}
                            >
                              {key.tier}
                            </span>
                          </td>
                          <td className="py-3 text-right text-white font-medium">
                            {formatNumber(key.usageToday)}
                          </td>
                          <td className="py-3 text-right">{formatNumber(key.usageMonth)}</td>
                          <td className="py-3 text-right text-sm text-neutral-400">
                            {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by email, name, or key prefix..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <select
                  value={tierFilter}
                  onChange={(e) => {
                    setTierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Revoked</option>
                </select>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by);
                    setSortOrder(order as 'asc' | 'desc');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="usageMonth-desc">Most Usage</option>
                  <option value="lastUsedAt-desc">Recently Active</option>
                  <option value="email-asc">Email A-Z</option>
                </select>
              </div>
            </div>

            {/* Keys Table */}
            {keysList && (
              <>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-neutral-400 bg-neutral-800/50">
                          <th className="px-4 py-3 font-medium">Key</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Tier</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Usage</th>
                          <th className="px-4 py-3 font-medium text-right">Created</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keysList.keys.map((key) => (
                          <tr
                            key={key.id}
                            className="border-t border-neutral-800 hover:bg-neutral-800/30"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-mono text-sm">{key.keyPrefix}...</span>
                                <p className="text-xs text-neutral-500">{key.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{key.email}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${tierColors[key.tier]}`}
                              >
                                {key.tier}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  key.active
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {key.active ? 'Active' : 'Revoked'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div>
                                <span className="text-white font-medium">
                                  {formatNumber(key.usageToday)}
                                </span>
                                <span className="text-neutral-500">
                                  {' '}
                                  / {formatNumber(key.usageMonth)}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">today / month</p>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-400">
                              {formatDate(key.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {key.active ? (
                                <button
                                  onClick={() => handleKeyAction(key.id, 'revoke')}
                                  className="px-3 py-1 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleKeyAction(key.id, 'activate')}
                                  className="px-3 py-1 text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                                >
                                  Activate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {keysList.keys.length === 0 && (
                    <div className="p-8 text-center text-neutral-500">
                      No API keys found matching your criteria
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {keysList.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-400">
                      Showing {(keysList.pagination.page - 1) * keysList.pagination.limit + 1} -{' '}
                      {Math.min(
                        keysList.pagination.page * keysList.pagination.limit,
                        keysList.pagination.total
                      )}{' '}
                      of {keysList.pagination.total} keys
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={!keysList.pagination.hasPrev}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('previous')}
                      </button>
                      <span className="px-4 py-2 bg-neutral-900 rounded-lg">
                        {keysList.pagination.page} / {keysList.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={!keysList.pagination.hasNext}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('next')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!keysList && (
              <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 text-center text-neutral-500">
                Loading API keys...
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && data && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total API Calls" value={formatNumber(data.stats.totalCalls)} />
              <StatCard label="Calls Today" value={formatNumber(data.stats.callsToday)} />
              <StatCard
                label="Unique Users Today"
                value={formatNumber(data.stats.uniqueUsersToday)}
              />
              <StatCard label="Avg Response Time" value={`${data.stats.averageResponseTime}ms`} />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calls by Hour */}
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-lg font-semibold mb-4">Calls by Hour (Last 24h)</h2>
                <div className="h-48 flex items-end gap-1">
                  {data.stats.callsByHour.map((item, i) => {
                    const maxCalls = Math.max(...data.stats.callsByHour.map((h) => h.calls)) || 1;
                    const height = (item.calls / maxCalls) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-white/80 rounded-t transition-all hover:bg-gray-200"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${item.hour}: ${item.calls} calls`}
                        />
                        {i % 4 === 0 && (
                          <span className="text-xs text-neutral-500 mt-1">{item.hour}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Endpoints */}
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-lg font-semibold mb-4">Top Endpoints</h2>
                <div className="space-y-3">
                  {data.stats.topEndpoints.slice(0, 5).map((endpoint, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="truncate flex-1 mr-4 font-mono text-sm">
                        {endpoint.endpoint}
                      </span>
                      <span className="text-white font-semibold">{endpoint.calls}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Memory Usage */}
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-lg font-semibold mb-4">System Resources</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-400">Memory Usage</span>
                      <span>{data.health.memoryUsage.percentage}%</span>
                    </div>
                    <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          data.health.memoryUsage.percentage > 80
                            ? 'bg-red-500'
                            : data.health.memoryUsage.percentage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${data.health.memoryUsage.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      {formatBytes(data.health.memoryUsage.used)} /{' '}
                      {formatBytes(data.health.memoryUsage.total)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Uptime</span>
                    <span>{formatUptime(data.health.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Error Rate</span>
                    <span className={data.stats.errorRate > 5 ? 'text-red-400' : 'text-green-400'}>
                      {data.stats.errorRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Services Status */}
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-lg font-semibold mb-4">External Services</h2>
                <div className="space-y-3">
                  {data.health.services.map((service, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[service.status]}`} />
                        <span>{service.name}</span>
                      </div>
                      {service.responseTime && (
                        <span className="text-neutral-400 text-sm">{service.responseTime}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Table */}
            {data.stats.errorsByEndpoint.length > 0 && (
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                <h2 className="text-lg font-semibold mb-4">Errors by Endpoint</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-neutral-400 border-b border-neutral-800">
                        <th className="pb-3 font-medium">Endpoint</th>
                        <th className="pb-3 font-medium text-right">Error Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stats.errorsByEndpoint.map((error, i) => (
                        <tr key={i} className="border-b border-neutral-800/50">
                          <td className="py-3 font-mono text-sm">{error.endpoint}</td>
                          <td className="py-3 text-right text-red-400">{error.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  trend,
}: {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <p className="text-neutral-400 text-sm mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend === 'up' && (
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        )}
        {trend === 'down' && (
          <svg
            className="w-4 h-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        )}
      </div>
      {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
    </div>
  );
}
