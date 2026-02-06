'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types (matching lib/arbitrage-scanner.ts)
// =============================================================================

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  grossProfit: number;
  estimatedFees: number;
  netProfit: number;
  netProfitPercent: number;
  availableSize: number;
  maxTradeSize: number;
  profitAtMaxSize: number;
  latencyRisk: 'low' | 'medium' | 'high';
  liquidityScore: number;
  overallScore: number;
  direction: 'spot' | 'futures' | 'cross-type';
  expiresAt: number;
  detectedAt: number;
  notes: string[];
}

interface TriangularArbitrage {
  id: string;
  path: string[];
  exchanges: string[];
  legs: {
    from: string;
    to: string;
    exchange: string;
    rate: number;
    side: 'buy' | 'sell';
  }[];
  startAmount: number;
  endAmount: number;
  profit: number;
  profitPercent: number;
  estimatedFees: number;
  netProfit: number;
  executionTime: number;
  riskScore: number;
  detectedAt: number;
}

interface ExchangeStats {
  opportunities: number;
  avgSpread: number;
}

interface ArbitrageSummary {
  totalOpportunities: number;
  avgSpread: number;
  bestOpportunity: ArbitrageOpportunity | null;
  exchangeStats: Record<string, ExchangeStats>;
  scannedPairs: number;
  scanDuration: number;
}

interface ArbitrageScanResult {
  opportunities: ArbitrageOpportunity[];
  triangular: TriangularArbitrage[];
  summary: ArbitrageSummary;
  lastUpdated: string;
}

// =============================================================================
// Component
// =============================================================================

const EXCHANGES = ['binance', 'bybit', 'okx', 'kraken', 'kucoin'] as const;

export function ArbitrageDashboard() {
  const [data, setData] = useState<ArbitrageScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchange, setExchange] = useState<string>('all');
  const [minProfit, setMinProfit] = useState(0.1);
  const [showTriangular, setShowTriangular] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        minProfit: minProfit.toString(),
        limit: '100',
        includeTriangular: showTriangular.toString(),
      });
      
      if (exchange !== 'all') {
        params.set('exchange', exchange);
      }

      const response = await fetch(`/api/arbitrage?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful');
      }

      setData(result.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Arbitrage fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch arbitrage data');
    } finally {
      setLoading(false);
    }
  }, [exchange, minProfit, showTriangular]);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 10000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatPercent = (pct: number) => {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%`;
  };

  const formatProfit = (profit: number) => {
    if (profit >= 1000) return `$${(profit / 1000).toFixed(1)}K`;
    return `$${profit.toFixed(2)}`;
  };

  const getLatencyColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[risk as keyof typeof colors] || colors.medium;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
            Failed to Load Arbitrage Data
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { opportunities, triangular, summary } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Exchange Filter */}
        <select
          value={exchange}
          onChange={(e) => {
            setExchange(e.target.value);
            setLoading(true);
          }}
          className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm border-0"
        >
          <option value="all">All Exchanges</option>
          {EXCHANGES.map((ex) => (
            <option key={ex} value={ex}>
              {ex.charAt(0).toUpperCase() + ex.slice(1)}
            </option>
          ))}
        </select>

        {/* Min Profit Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-slate-400">Min Profit:</label>
          <select
            value={minProfit}
            onChange={(e) => {
              setMinProfit(parseFloat(e.target.value));
              setLoading(true);
            }}
            className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm border-0"
          >
            <option value={0}>0%</option>
            <option value={0.05}>0.05%</option>
            <option value={0.1}>0.1%</option>
            <option value={0.2}>0.2%</option>
            <option value={0.5}>0.5%</option>
            <option value={1}>1%</option>
          </select>
        </div>

        {/* Triangular Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTriangular}
            onChange={(e) => setShowTriangular(e.target.checked)}
            className="rounded text-amber-500"
          />
          <span className="text-sm text-gray-600 dark:text-slate-400">Show Triangular</span>
        </label>

        {/* Auto Refresh Toggle */}
        <label className="ml-auto flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded text-amber-500"
          />
          <span className="text-sm text-gray-600 dark:text-slate-400">Auto Refresh</span>
          {autoRefresh && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </label>

        {lastRefresh && (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Opportunities"
          value={summary.totalOpportunities.toString()}
          icon="⚡"
          color="amber"
        />
        <SummaryCard
          title="Avg Spread"
          value={`${summary.avgSpread.toFixed(3)}%`}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          title="Pairs Scanned"
          value={summary.scannedPairs.toString()}
          icon="🔍"
          color="purple"
        />
        <SummaryCard
          title="Scan Time"
          value={`${summary.scanDuration}ms`}
          icon="⏱️"
          color="green"
        />
      </div>

      {/* Best Opportunity Highlight */}
      {summary.bestOpportunity && (
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">🏆 Best Opportunity</p>
              <p className="text-2xl font-bold">
                {summary.bestOpportunity.symbol}
              </p>
              <p className="text-sm opacity-80">
                Buy on {summary.bestOpportunity.buyExchange.toUpperCase()} → Sell on{' '}
                {summary.bestOpportunity.sellExchange.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                +{summary.bestOpportunity.netProfitPercent.toFixed(3)}%
              </p>
              <p className="text-sm opacity-80">
                {formatProfit(summary.bestOpportunity.profitAtMaxSize)} max profit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🏦 Exchange Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {EXCHANGES.map((ex) => {
            const stats = summary.exchangeStats[ex];
            return (
              <div
                key={ex}
                className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {ex}
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.opportunities || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Avg: {(stats?.avgSpread || 0).toFixed(3)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📈 Arbitrage Opportunities
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {opportunities.length} opportunities found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 dark:text-slate-400">Pair</th>
                <th className="px-4 py-3 text-left text-gray-500 dark:text-slate-400">
                  Buy Exchange
                </th>
                <th className="px-4 py-3 text-left text-gray-500 dark:text-slate-400">
                  Sell Exchange
                </th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">Spread</th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">
                  Net Profit
                </th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">
                  Max Trade
                </th>
                <th className="px-4 py-3 text-center text-gray-500 dark:text-slate-400">Risk</th>
                <th className="px-4 py-3 text-center text-gray-500 dark:text-slate-400">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                    No arbitrage opportunities found matching your filters
                  </td>
                </tr>
              ) : (
                opportunities.slice(0, 25).map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{opp.symbol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {opp.buyExchange}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 block">
                          {formatPrice(opp.buyPrice)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {opp.sellExchange}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 block">
                          {formatPrice(opp.sellPrice)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {formatPercent(opp.spreadPercent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatPercent(opp.netProfitPercent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-slate-400">
                      {formatProfit(opp.maxTradeSize)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getRiskBadge(opp.latencyRisk)}`}
                      >
                        {opp.latencyRisk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${getScoreColor(opp.overallScore)}`}>
                        {opp.overallScore}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triangular Arbitrage */}
      {showTriangular && triangular.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🔺 Triangular Arbitrage
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {triangular.length} triangular opportunities found
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {triangular.slice(0, 10).map((tri) => (
              <div key={tri.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {tri.path.map((asset, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="font-medium text-gray-900 dark:text-white">{asset}</span>
                          {i < tri.path.length - 1 && (
                            <span className="text-gray-400">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      via {tri.exchanges.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(' → ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{tri.profitPercent.toFixed(3)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {tri.executionTime}ms execution
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-slate-400 py-4">
        Scan completed in {summary.scanDuration}ms • {summary.scannedPairs} pairs checked • Last
        updated: {new Date(data.lastUpdated).toLocaleTimeString()}
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
  color: 'amber' | 'blue' | 'purple' | 'green';
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const colorClasses = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50',
  };

  const textClasses = {
    amber: 'text-amber-700 dark:text-amber-300',
    blue: 'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    green: 'text-green-700 dark:text-green-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
      </div>
      <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
    </div>
  );
}

export default ArbitrageDashboard;
