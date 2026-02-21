'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: { address: string; owner?: string; ownerType?: string };
  to: { address: string; owner?: string; ownerType?: string };
  hash: string;
  timestamp: number;
  transactionType: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_transfer' | 'unknown';
  significance: 'normal' | 'notable' | 'massive';
}

interface WhaleData {
  alerts: WhaleTransaction[];
  summary: {
    totalTransactions: number;
    totalValueUsd: number;
  };
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || 'Unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const typeConfig: Record<string, { label: string; emoji: string; color: string }> = {
  exchange_deposit: { label: 'Deposit', emoji: '🔴', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  exchange_withdrawal: { label: 'Withdrawal', emoji: '🟢', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  whale_transfer: { label: 'Transfer', emoji: '🔵', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  unknown: { label: 'Transfer', emoji: '⚪', color: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400' },
};

const significanceStyle: Record<string, string> = {
  massive: 'border-l-4 border-l-amber-500',
  notable: 'border-l-4 border-l-blue-400',
  normal: '',
};

export function WhaleActivityFeed() {
  const [data, setData] = useState<WhaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/whale-alerts?limit=8');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setData({
        alerts: result.alerts || [],
        summary: result.summary || { totalTransactions: 0, totalValueUsd: 0 },
      });
      setFadeIn(true);
      setTimeout(() => setFadeIn(false), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <section className="mb-12" aria-label="Whale Activity">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
            <div className="animate-pulse flex items-center gap-3">
              <div className="h-6 w-48 bg-gray-200 dark:bg-slate-600 rounded" />
              <div className="ml-auto h-5 w-24 bg-gray-200 dark:bg-slate-600 rounded" />
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-24 bg-gray-100 dark:bg-slate-700/50 rounded" />
                  <div className="ml-auto h-4 w-20 bg-gray-100 dark:bg-slate-700/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) return null;

  return (
    <section className="mb-12" aria-label="Whale Activity">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-opacity duration-500 ${fadeIn ? 'opacity-90' : 'opacity-100'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐋</span>
              <h3 className="font-bold text-gray-900 dark:text-white">Whale Activity</h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900 dark:text-white">{formatUsd(data.summary.totalValueUsd)}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">24h volume</div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {data.alerts.slice(0, 8).map((tx) => {
            const type = typeConfig[tx.transactionType] || typeConfig.unknown;
            const sigStyle = significanceStyle[tx.significance] || '';
            return (
              <div key={tx.id} className={`px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition ${sigStyle}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${type.color}`}>
                    {type.emoji} {type.label}
                  </span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{tx.symbol.toUpperCase()}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{formatUsd(tx.amountUsd)}</span>
                  <div className="ml-auto text-right flex-shrink-0">
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {truncateAddress(tx.from.address)} → {truncateAddress(tx.to.address)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{timeAgo(tx.timestamp)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700">
          <Link
            href="/whales"
            className="text-sm font-semibold text-brand-600 dark:text-amber-400 hover:text-brand-700 dark:hover:text-amber-300 transition-colors flex items-center justify-center gap-1"
          >
            View All Whale Activity
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
