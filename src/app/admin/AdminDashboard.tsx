'use client';

import { useState, useEffect } from 'react';

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

export default function AdminDashboard() {
  const [data, setData] = useState<FullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = async () => {
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
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
      setAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [authenticated, token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchData();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Token
              </label>
              <input
                type="password"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter admin token"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, health } = data!;

  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    up: 'bg-green-500',
    down: 'bg-red-500',
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor API usage and system health</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[health.status]} text-black`}>
              {health.status.toUpperCase()}
            </div>
            <button
              onClick={fetchData}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total API Calls" value={stats.totalCalls.toLocaleString()} />
          <StatCard label="Calls Today" value={stats.callsToday.toLocaleString()} />
          <StatCard label="Unique Users Today" value={stats.uniqueUsersToday.toLocaleString()} />
          <StatCard label="Avg Response Time" value={`${stats.averageResponseTime}ms`} />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Calls by Hour */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Calls by Hour (Last 24h)</h2>
            <div className="h-48 flex items-end gap-1">
              {stats.callsByHour.map((item, i) => {
                const maxCalls = Math.max(...stats.callsByHour.map(h => h.calls)) || 1;
                const height = (item.calls / maxCalls) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-amber-500/80 rounded-t transition-all hover:bg-amber-400"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${item.hour}: ${item.calls} calls`}
                    />
                    {i % 4 === 0 && (
                      <span className="text-xs text-gray-500 mt-1">{item.hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Endpoints */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Top Endpoints</h2>
            <div className="space-y-3">
              {stats.topEndpoints.slice(0, 5).map((endpoint, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300 truncate flex-1 mr-4 font-mono text-sm">
                    {endpoint.endpoint}
                  </span>
                  <span className="text-amber-400 font-semibold">{endpoint.calls}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Memory Usage */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">System Resources</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white">{health.memoryUsage.percentage}%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      health.memoryUsage.percentage > 80 ? 'bg-red-500' :
                      health.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.memoryUsage.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatBytes(health.memoryUsage.used)} / {formatBytes(health.memoryUsage.total)}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white">{formatUptime(health.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error Rate</span>
                <span className={stats.errorRate > 5 ? 'text-red-400' : 'text-green-400'}>
                  {stats.errorRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">External Services</h2>
            <div className="space-y-3">
              {health.services.map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[service.status]}`} />
                    <span className="text-gray-200">{service.name}</span>
                  </div>
                  {service.responseTime && (
                    <span className="text-gray-400 text-sm">{service.responseTime}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Table */}
        {stats.errorsByEndpoint.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Errors by Endpoint</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3 font-medium">Endpoint</th>
                    <th className="pb-3 font-medium text-right">Error Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.errorsByEndpoint.map((error, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      <td className="py-3 font-mono text-sm text-gray-300">{error.endpoint}</td>
                      <td className="py-3 text-right text-red-400">{error.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
