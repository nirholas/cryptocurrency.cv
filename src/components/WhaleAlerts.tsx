'use client';

import { useState, useEffect } from 'react';

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

interface WhaleAlertsResponse {
  alerts: WhaleTransaction[];
  summary: {
    totalTransactions: number;
    totalValueUsd: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
    largestTransaction: WhaleTransaction | null;
  };
  lastUpdated: string;
}

interface WhaleAlertsProps {
  limit?: number;
  minValue?: number;
  blockchain?: 'all' | 'ethereum' | 'bitcoin';
  autoRefresh?: boolean;
}

/**
 * Whale Alerts Component
 * 
 * Real-time display of large cryptocurrency transactions (whale movements)
 * across multiple blockchains.
 */
export function WhaleAlerts({
  limit = 20,
  minValue = 100000,
  blockchain = 'all',
  autoRefresh = true,
}: WhaleAlertsProps) {
  const [data, setData] = useState<WhaleAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'transfers'>('all');

  useEffect(() => {
    fetchWhaleAlerts();
    if (autoRefresh) {
      const interval = setInterval(fetchWhaleAlerts, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [limit, minValue, blockchain]);

  async function fetchWhaleAlerts() {
    try {
      setError(null);
      const response = await fetch(
        `/api/whale-alerts?limit=${limit}&minValue=${minValue}&blockchain=${blockchain}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch whale alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number, symbol: string): string {
    if (symbol === 'BTC') {
      return `${amount.toFixed(2)} BTC`;
    }
    if (symbol === 'ETH') {
      return `${amount.toFixed(2)} ETH`;
    }
    return `${amount.toLocaleString()} ${symbol}`;
  }

  function formatUsd(amount: number): string {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  }

  function formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  function shortenAddress(address: string): string {
    if (address.length < 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getTransactionIcon(type: WhaleTransaction['transactionType']) {
    switch (type) {
      case 'exchange_deposit':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'exchange_withdrawal':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'whale_transfer':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
    }
  }

  function getSignificanceStyle(significance: WhaleTransaction['significance']) {
    switch (significance) {
      case 'massive':
        return 'border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-800/20';
      case 'notable':
        return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return '';
    }
  }

  // Filter alerts
  const filteredAlerts = data?.alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return alert.transactionType === 'exchange_deposit';
    if (filter === 'withdrawals') return alert.transactionType === 'exchange_withdrawal';
    if (filter === 'transfers') return alert.transactionType === 'whale_transfer';
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Failed to Load Whale Alerts
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {error}
          </p>
          <button
            onClick={fetchWhaleAlerts}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            🐋 Whale Alerts
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Live
            </span>
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Large transactions over {formatUsd(minValue)}
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 overflow-x-auto">
          {(['all', 'deposits', 'withdrawals', 'transfers'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
                filter === f
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              {data.summary.totalTransactions}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Transactions
            </div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              {formatUsd(data.summary.totalValueUsd)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Total Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-red-600">
              {data.summary.exchangeDeposits}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Deposits
            </div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-green-600">
              {data.summary.exchangeWithdrawals}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Withdrawals
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-h-[500px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            No whale alerts matching the current filter
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${getSignificanceStyle(alert.significance)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-1">
                    {getTransactionIcon(alert.transactionType)}
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatAmount(alert.amount, alert.symbol)}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        ({formatUsd(alert.amountUsd)})
                      </span>
                      {alert.significance === 'massive' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 rounded-full">
                          🔥 Massive
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      <span className="font-medium">{alert.from.owner || shortenAddress(alert.from.address)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{alert.to.owner || shortenAddress(alert.to.address)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {alert.blockchain}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">•</span>
                      <a
                        href={`https://${alert.blockchain === 'Ethereum' ? 'etherscan.io/tx/' : 'blockchain.com/btc/tx/'}${alert.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        View TX
                      </a>
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {formatTime(alert.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Data from Blockchair, Blockchain.info, Etherscan • Updates every 30 seconds
      </div>
    </div>
  );
}

export default WhaleAlerts;
