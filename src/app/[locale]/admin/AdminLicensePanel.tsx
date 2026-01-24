'use client';

import { useState, useEffect } from 'react';

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

interface LicenseData {
  keys: APIKeyStats;
  revenue: RevenueStats;
}

export default function AdminLicensePanel() {
  const [data, setData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'revenue' | 'payments'>('overview');

  useEffect(() => {
    // Simulated data - in production, fetch from API
    const mockData: LicenseData = {
      keys: {
        totalKeys: 156,
        activeKeys: 142,
        keysByTier: [
          { tier: 'free', count: 98 },
          { tier: 'pro', count: 45 },
          { tier: 'enterprise', count: 13 },
        ],
        recentKeys: [
          {
            id: 'key_1',
            name: 'Trading Bot Alpha',
            tier: 'pro',
            createdAt: '2026-01-24T08:30:00Z',
            lastUsed: '2026-01-24T12:45:00Z',
            usageToday: 2341,
          },
          {
            id: 'key_2',
            name: 'Analytics Dashboard',
            tier: 'enterprise',
            createdAt: '2026-01-23T15:20:00Z',
            lastUsed: '2026-01-24T12:50:00Z',
            usageToday: 8923,
          },
          {
            id: 'key_3',
            name: 'Mobile App',
            tier: 'pro',
            createdAt: '2026-01-22T09:15:00Z',
            lastUsed: '2026-01-24T11:30:00Z',
            usageToday: 1567,
          },
        ],
      },
      revenue: {
        totalRevenue: 12458.32,
        revenueToday: 156.45,
        revenueThisWeek: 892.18,
        revenueThisMonth: 3241.67,
        revenueByType: [
          { type: 'Subscriptions', amount: 2890.0 },
          { type: 'x402 Payments', amount: 351.67 },
        ],
        x402Payments: 12847,
        subscriptions: [
          { tier: 'pro', count: 45, revenue: 1305 },
          { tier: 'enterprise', count: 13, revenue: 1287 },
        ],
        recentPayments: [
          {
            id: 'pay_1',
            type: 'x402',
            amount: 0.005,
            endpoint: '/api/v1/historical/bitcoin',
            timestamp: '2026-01-24T12:55:00Z',
          },
          {
            id: 'pay_2',
            type: 'subscription',
            amount: 29.0,
            tier: 'pro',
            timestamp: '2026-01-24T12:30:00Z',
          },
          {
            id: 'pay_3',
            type: 'x402',
            amount: 0.001,
            endpoint: '/api/v1/coins',
            timestamp: '2026-01-24T12:28:00Z',
          },
          {
            id: 'pay_4',
            type: 'x402',
            amount: 0.002,
            endpoint: '/api/v1/market-data',
            timestamp: '2026-01-24T12:25:00Z',
          },
          {
            id: 'pay_5',
            type: 'subscription',
            amount: 99.0,
            tier: 'enterprise',
            timestamp: '2026-01-24T11:45:00Z',
          },
        ],
      },
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-400 py-12">
        Failed to load license data
      </div>
    );
  }

  const { keys, revenue } = data;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-4">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'keys', label: '🔑 API Keys' },
          { id: 'revenue', label: '💰 Revenue' },
          { id: 'payments', label: '📝 Payments' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total API Keys"
              value={keys.totalKeys.toString()}
              subtext={`${keys.activeKeys} active`}
              color="blue"
            />
            <StatCard
              label="x402 Payments"
              value={revenue.x402Payments.toLocaleString()}
              subtext="All time"
              color="purple"
            />
            <StatCard
              label="Revenue Today"
              value={`$${revenue.revenueToday.toFixed(2)}`}
              subtext={`$${revenue.revenueThisMonth.toFixed(2)} this month`}
              color="green"
            />
            <StatCard
              label="Total Revenue"
              value={`$${revenue.totalRevenue.toFixed(2)}`}
              subtext="All time"
              color="amber"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Keys by Tier */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">API Keys by Tier</h3>
              <div className="space-y-4">
                {keys.keysByTier.map((tier) => (
                  <div key={tier.tier}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300 capitalize">{tier.tier}</span>
                      <span className="text-white font-medium">{tier.count}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tier.tier === 'enterprise'
                            ? 'bg-purple-500'
                            : tier.tier === 'pro'
                              ? 'bg-amber-500'
                              : 'bg-gray-500'
                        }`}
                        style={{ width: `${(tier.count / keys.totalKeys) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Type */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Revenue by Type (This Month)</h3>
              <div className="space-y-4">
                {revenue.revenueByType.map((type) => (
                  <div key={type.type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{type.type}</span>
                      <span className="text-white font-medium">${type.amount.toFixed(2)}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          type.type === 'Subscriptions' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${(type.amount / revenue.revenueThisMonth) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {revenue.recentPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.type === 'x402'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {payment.type}
                    </span>
                    <span className="text-gray-300 font-mono text-sm">
                      {payment.endpoint || `${payment.tier} subscription`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">${payment.amount.toFixed(3)}</span>
                    <span className="text-gray-500 text-sm">
                      {new Date(payment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">All API Keys</h3>
            <button className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-medium transition-all">
              + Create Key
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Tier</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Created</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Last Used</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Usage Today</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {keys.recentKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-700/30">
                    <td className="p-4">
                      <span className="text-white font-medium">{key.name}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          key.tier === 'enterprise'
                            ? 'bg-purple-500/20 text-purple-400'
                            : key.tier === 'pro'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {key.tier}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4 text-right text-white font-mono">
                      {key.usageToday.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-white mr-2">Edit</button>
                      <button className="text-red-400 hover:text-red-300">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h4 className="text-gray-400 text-sm mb-1">Today</h4>
              <p className="text-3xl font-bold text-green-400">${revenue.revenueToday.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h4 className="text-gray-400 text-sm mb-1">This Week</h4>
              <p className="text-3xl font-bold text-green-400">
                ${revenue.revenueThisWeek.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h4 className="text-gray-400 text-sm mb-1">This Month</h4>
              <p className="text-3xl font-bold text-green-400">
                ${revenue.revenueThisMonth.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Subscription Revenue</h3>
            <div className="space-y-4">
              {revenue.subscriptions.map((sub) => (
                <div
                  key={sub.tier}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <span className="text-white font-medium capitalize">{sub.tier}</span>
                    <span className="text-gray-400 ml-2">({sub.count} subscribers)</span>
                  </div>
                  <span className="text-green-400 font-semibold">${sub.revenue.toFixed(2)}/mo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">x402 Revenue</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="text-gray-400 text-sm mb-1">Total Payments</h4>
                <p className="text-2xl font-bold text-white">
                  {revenue.x402Payments.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <h4 className="text-gray-400 text-sm mb-1">Revenue This Month</h4>
                <p className="text-2xl font-bold text-blue-400">
                  ${revenue.revenueByType.find((t) => t.type === 'x402 Payments')?.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <div className="flex gap-2">
              <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option>All Types</option>
                <option>x402</option>
                <option>Subscription</option>
              </select>
              <input
                type="date"
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Details</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {revenue.recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-700/30">
                    <td className="p-4">
                      <code className="text-gray-400 text-sm">{payment.id}</code>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.type === 'x402'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {payment.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-sm">
                      {payment.endpoint || `${payment.tier} tier subscription`}
                    </td>
                    <td className="p-4 text-right text-white font-semibold">
                      ${payment.amount.toFixed(3)}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(payment.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  color: 'blue' | 'purple' | 'green' | 'amber';
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
  );
}
