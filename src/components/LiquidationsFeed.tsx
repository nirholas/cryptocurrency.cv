'use client';

import { useState, useEffect } from 'react';
import { ArrowTrendingDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Liquidation {
  id: string;
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  price: number;
  timestamp: number;
}

// Generate realistic mock liquidation data
function generateMockLiquidations(): Liquidation[] {
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'dYdX'];
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'MATIC', 'LINK'];
  const now = Date.now();

  return Array.from({ length: 50 }, (_, i) => ({
    id: `liq-${now}-${i}`,
    exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    side: (Math.random() > 0.5 ? 'long' : 'short') as 'long' | 'short',
    amount: Math.floor(Math.random() * 500000) + 1000,
    price: Math.random() * 50000 + 1000,
    timestamp: now - Math.floor(Math.random() * 3600000), // Last hour
  })).sort((a, b) => b.timestamp - a.timestamp);
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export function LiquidationsFeed() {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');
  const [minAmount, setMinAmount] = useState<number>(0);

  useEffect(() => {
    // Initial load
    setLiquidations(generateMockLiquidations());
    setLoading(false);

    // Simulate new liquidations every few seconds
    const interval = setInterval(() => {
      const newLiq: Liquidation = {
        id: `liq-${Date.now()}`,
        exchange: ['Binance', 'Bybit', 'OKX', 'Bitget', 'dYdX'][Math.floor(Math.random() * 5)],
        symbol: ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'][Math.floor(Math.random() * 5)],
        side: Math.random() > 0.5 ? 'long' : 'short',
        amount: Math.floor(Math.random() * 500000) + 1000,
        price: Math.random() * 50000 + 1000,
        timestamp: Date.now(),
      };

      setLiquidations((prev) => [newLiq, ...prev.slice(0, 49)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredLiquidations = liquidations.filter((liq) => {
    if (filter !== 'all' && liq.side !== filter) return false;
    if (liq.amount < minAmount) return false;
    return true;
  });

  const stats = {
    totalLongs: liquidations.filter((l) => l.side === 'long').reduce((s, l) => s + l.amount, 0),
    totalShorts: liquidations.filter((l) => l.side === 'short').reduce((s, l) => s + l.amount, 0),
    largestLiq: Math.max(...liquidations.map((l) => l.amount)),
    count: liquidations.length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-black rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="text-sm text-gray-500 dark:text-gray-400">Longs Liquidated</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.totalLongs)}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="text-sm text-gray-500 dark:text-gray-400">Shorts Liquidated</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.totalShorts)}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="text-sm text-gray-500 dark:text-gray-400">Largest Liquidation</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.largestLiq)}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.count}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1">
          {(['all', 'long', 'short'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {f === 'all' ? 'All' : `${f}s`}
            </button>
          ))}
        </div>

        <select
          value={minAmount}
          onChange={(e) => setMinAmount(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-black"
        >
          <option value={0}>All sizes</option>
          <option value={10000}>$10K+</option>
          <option value={50000}>$50K+</option>
          <option value={100000}>$100K+</option>
          <option value={500000}>$500K+</option>
        </select>
      </div>

      {/* Liquidations List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredLiquidations.map((liq) => (
          <div
            key={liq.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              liq.side === 'long'
                ? 'bg-gray-50 dark:bg-black/50 border-gray-200 dark:border-slate-700'
                : 'bg-gray-100 dark:bg-black border-gray-300 dark:border-gray-600'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                liq.side === 'long'
                  ? 'bg-gray-200 dark:bg-black'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              {liq.side === 'long' ? (
                <ArrowTrendingDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <CurrencyDollarIcon className="w-5 h-5 text-slate-700 dark:text-gray-200" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{liq.symbol}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
                    liq.side === 'long'
                      ? 'bg-gray-200 dark:bg-black text-gray-600 dark:text-gray-300'
                      : 'bg-black dark:bg-gray-200 text-white dark:text-slate-900'
                  }`}
                >
                  {liq.side}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {liq.exchange} · $
                {liq.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatAmount(liq.amount)}
              </div>
              <div className="text-xs text-gray-400">{formatTime(liq.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Simulated liquidation data for demonstration. Real data requires exchange APIs.
      </p>
    </div>
  );
}
