'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: {
    address: string;
    owner?: string;
    ownerType?: 'exchange' | 'whale' | 'unknown';
  };
  to: {
    address: string;
    owner?: string;
    ownerType?: 'exchange' | 'whale' | 'unknown';
  };
  hash: string;
  timestamp: number;
  transactionType: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_transfer' | 'unknown';
  significance: 'normal' | 'notable' | 'massive';
}

interface WhaleAlertsSummary {
  totalTransactions: number;
  totalValueUsd: number;
  exchangeDeposits: number;
  exchangeWithdrawals: number;
  largestTransaction: WhaleTransaction | null;
}

interface WhaleAlertsData {
  alerts: WhaleTransaction[];
  summary: WhaleAlertsSummary;
  lastUpdated: string;
}

// =============================================================================
// Component
// =============================================================================

type BlockchainFilter = 'all' | 'ethereum' | 'bitcoin';
type TypeFilter = 'all' | 'exchange_deposit' | 'exchange_withdrawal' | 'whale_transfer';
type SignificanceFilter = 'all' | 'notable' | 'massive';

const MIN_VALUE_OPTIONS = [
  { value: 100000, label: '$100K+' },
  { value: 500000, label: '$500K+' },
  { value: 1000000, label: '$1M+' },
  { value: 5000000, label: '$5M+' },
  { value: 10000000, label: '$10M+' },
];

export function WhaleAlertsDashboard() {
  const [data, setData] = useState<WhaleAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockchain, setBlockchain] = useState<BlockchainFilter>('all');
  const [minValue, setMinValue] = useState(100000);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [significanceFilter, setSignificanceFilter] = useState<SignificanceFilter>('all');
  const [liveUpdates, setLiveUpdates] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/whale-alerts?blockchain=${blockchain}&minValue=${minValue}&limit=100`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Whale alerts fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch whale alerts');
    } finally {
      setLoading(false);
    }
  }, [blockchain, minValue]);

  useEffect(() => {
    fetchData();
    
    if (liveUpdates) {
      const interval = setInterval(fetchData, 15000); // Refresh every 15s
      return () => clearInterval(interval);
    }
  }, [fetchData, liveUpdates]);

  // Format helpers
  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatAmount = (amount: number, symbol: string) => {
    if (amount >= 1000) return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${symbol}`;
    return `${amount.toFixed(4)} ${symbol}`;
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exchange_deposit': return '📥 Exchange Deposit';
      case 'exchange_withdrawal': return '📤 Exchange Withdrawal';
      case 'whale_transfer': return '🔄 Whale Transfer';
      default: return '❓ Unknown';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exchange_deposit': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'exchange_withdrawal': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'whale_transfer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'massive': return 'border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'notable': return 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return '';
    }
  };

  const getBlockchainIcon = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum': return '⟠';
      case 'bitcoin': return '₿';
      default: return '🔗';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            className="w-12 h-12 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Whale Alerts
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { alerts, summary } = data;

  // Apply client-side filters
  const filteredAlerts = alerts.filter((alert) => {
    if (typeFilter !== 'all' && alert.transactionType !== typeFilter) return false;
    if (significanceFilter !== 'all' && alert.significance !== significanceFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Blockchain Filter */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {(['all', 'ethereum', 'bitcoin'] as const).map((chain) => (
            <button
              key={chain}
              onClick={() => {
                setBlockchain(chain);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                blockchain === chain
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {chain === 'all' ? '🌐 All' : chain === 'ethereum' ? '⟠ ETH' : '₿ BTC'}
            </button>
          ))}
        </div>

        {/* Min Value Filter */}
        <select
          value={minValue}
          onChange={(e) => {
            setMinValue(parseInt(e.target.value));
            setLoading(true);
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm border-0"
        >
          {MIN_VALUE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm border-0"
        >
          <option value="all">All Types</option>
          <option value="exchange_deposit">Exchange Deposits</option>
          <option value="exchange_withdrawal">Exchange Withdrawals</option>
          <option value="whale_transfer">Whale Transfers</option>
        </select>

        {/* Significance Filter */}
        <select
          value={significanceFilter}
          onChange={(e) => setSignificanceFilter(e.target.value as SignificanceFilter)}
          className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm border-0"
        >
          <option value="all">All Sizes</option>
          <option value="notable">Notable Only</option>
          <option value="massive">Massive Only</option>
        </select>

        {/* Live Updates Toggle */}
        <label className="ml-auto flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={liveUpdates}
            onChange={(e) => setLiveUpdates(e.target.checked)}
            className="rounded text-cyan-500"
          />
          <span className="text-sm text-gray-600 dark:text-slate-400">Live Updates</span>
          {liveUpdates && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </label>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Transactions"
          value={summary.totalTransactions.toString()}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          title="Total Value"
          value={formatValue(summary.totalValueUsd)}
          icon="💰"
          color="green"
        />
        <SummaryCard
          title="Exchange Deposits"
          value={summary.exchangeDeposits.toString()}
          icon="📥"
          color="red"
          subtitle="Potential sell pressure"
        />
        <SummaryCard
          title="Exchange Withdrawals"
          value={summary.exchangeWithdrawals.toString()}
          icon="📤"
          color="green"
          subtitle="Bullish signal"
        />
      </div>

      {/* Largest Transaction Highlight */}
      {summary.largestTransaction && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">🐳 Largest Transaction</p>
              <p className="text-2xl font-bold">{formatValue(summary.largestTransaction.amountUsd)}</p>
              <p className="text-sm opacity-80">
                {formatAmount(summary.largestTransaction.amount, summary.largestTransaction.symbol)} •{' '}
                {summary.largestTransaction.blockchain}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                {getTypeLabel(summary.largestTransaction.transactionType).replace(/📥|📤|🔄|❓ /g, '')}
              </span>
              <p className="text-sm opacity-80 mt-2">
                {formatTime(summary.largestTransaction.timestamp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🐋 Recent Whale Transactions
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {filteredAlerts.length} transactions matching your filters
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              No transactions match your current filters
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${getSignificanceColor(alert.significance)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getBlockchainIcon(alert.blockchain)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatAmount(alert.amount, alert.symbol)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(alert.transactionType)}`}
                        >
                          {getTypeLabel(alert.transactionType).replace(/📥|📤|🔄|❓ /g, '')}
                        </span>
                        {alert.significance !== 'normal' && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              alert.significance === 'massive'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}
                          >
                            {alert.significance === 'massive' ? '🔥 Massive' : '⭐ Notable'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                        <span>
                          From: {alert.from.owner || formatAddress(alert.from.address)}
                          {alert.from.ownerType === 'exchange' && ' (Exchange)'}
                        </span>
                        <span>→</span>
                        <span>
                          To: {alert.to.owner || formatAddress(alert.to.address)}
                          {alert.to.ownerType === 'exchange' && ' (Exchange)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatValue(alert.amountUsd)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {formatTime(alert.timestamp)}
                    </p>
                    <a
                      href={
                        alert.blockchain === 'ethereum'
                          ? `https://etherscan.io/tx/${alert.hash}`
                          : `https://blockstream.info/tx/${alert.hash}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                    >
                      View TX →
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-slate-400 py-4">
        Data from Etherscan and Mempool.space • Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple';
  subtitle?: string;
}

function SummaryCard({ title, value, icon, color, subtitle }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50',
  };

  const textClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    purple: 'text-purple-700 dark:text-purple-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
      </div>
      <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default WhaleAlertsDashboard;
