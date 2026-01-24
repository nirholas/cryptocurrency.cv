'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types (matching lib/options-flow.ts)
// =============================================================================

interface OptionContract {
  symbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  expiryTimestamp: number;
  type: 'call' | 'put';
  exchange: string;
}

interface OptionTrade {
  id: string;
  contract: OptionContract;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
  notionalValue: number;
  premium: number;
  impliedVolatility: number;
  isBlock: boolean;
  isUnusual: boolean;
  unusualReason?: string[];
}

interface OptionsFlowSummary {
  totalVolume: number;
  totalPremium: number;
  callVolume: number;
  putVolume: number;
  callPremium: number;
  putPremium: number;
  putCallRatio: number;
  avgIV: number;
  blockTrades: number;
  unusualTrades: number;
}

interface OptionsFlow {
  trades: OptionTrade[];
  summary: OptionsFlowSummary;
  topTrades: OptionTrade[];
  byExpiry: Record<string, { calls: number; puts: number; premium: number }>;
  byStrike: { strike: number; calls: number; puts: number; premium: number }[];
  timestamp: string;
}

interface MaxPainAnalysis {
  underlying: string;
  expiry: string;
  maxPainPrice: number;
  currentPrice: number;
  distanceToMaxPain: number;
  distancePercent: number;
  callOI: { strike: number; oi: number }[];
  putOI: { strike: number; oi: number }[];
  totalCallOI: number;
  totalPutOI: number;
  putCallOIRatio: number;
}

interface GammaExposure {
  underlying: string;
  spotPrice: number;
  netGamma: number;
  gammaFlipPrice: number;
  gammaByStrike: { strike: number; gamma: number }[];
  totalDealerGamma: number;
  marketMakerPositioning: 'long_gamma' | 'short_gamma' | 'neutral';
  expectedVolatility: 'low' | 'medium' | 'high';
}

interface VolatilitySurface {
  underlying: string;
  spotPrice: number;
  strikes: number[];
  expiries: string[];
  atmIV: Record<string, number>;
  skew: Record<string, number>;
  termStructure: { days: number; iv: number }[];
  timestamp: string;
}

interface OptionsAlert {
  type: 'unusual_activity' | 'high_volume' | 'iv_spike' | 'gamma_flip' | 'max_pain';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface OptionsDashboard {
  flow: OptionsFlow;
  surface: VolatilitySurface;
  maxPain: MaxPainAnalysis;
  gamma: GammaExposure;
  alerts: OptionsAlert[];
  lastUpdated: string;
}

// =============================================================================
// Component
// =============================================================================

export function OptionsFlowDashboard() {
  const [dashboard, setDashboard] = useState<OptionsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [underlying, setUnderlying] = useState<'BTC' | 'ETH'>('BTC');
  const [activeTab, setActiveTab] = useState<'flow' | 'surface' | 'maxpain' | 'gamma'>('flow');

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/options?underlying=${underlying}&view=dashboard`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful');
      }
      
      setDashboard(result.data);
    } catch (err) {
      console.error('Options dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch options data');
    } finally {
      setLoading(false);
    }
  }, [underlying]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatExpiry = (expiry: string) => {
    const date = new Date(expiry);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded" />
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
            Failed to Load Options Data
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { flow, surface, maxPain, gamma, alerts } = dashboard;

  return (
    <div className="space-y-6">
      {/* Asset Selector & Alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          {(['BTC', 'ETH'] as const).map((asset) => (
            <button
              key={asset}
              onClick={() => {
                setUnderlying(asset);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                underlying === asset
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>

        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-1.5 rounded-full ${
                  alert.severity === 'critical'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : alert.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Put/Call Ratio"
          value={flow.summary.putCallRatio.toFixed(2)}
          color={flow.summary.putCallRatio > 1 ? 'red' : 'green'}
          subtitle={flow.summary.putCallRatio > 1 ? 'Bearish' : 'Bullish'}
        />
        <SummaryCard
          title="Total Premium"
          value={formatVolume(flow.summary.totalPremium)}
          color="purple"
          subtitle="24h traded"
        />
        <SummaryCard
          title="Avg IV"
          value={`${flow.summary.avgIV.toFixed(1)}%`}
          color="blue"
          subtitle="Implied volatility"
        />
        <SummaryCard
          title="Block Trades"
          value={flow.summary.blockTrades.toString()}
          color="orange"
          subtitle="Large orders"
        />
        <SummaryCard
          title="Max Pain"
          value={formatPrice(maxPain.maxPainPrice)}
          color="yellow"
          subtitle={`${maxPain.distancePercent > 0 ? '+' : ''}${maxPain.distancePercent.toFixed(1)}% away`}
        />
        <SummaryCard
          title="Gamma"
          value={gamma.marketMakerPositioning.replace('_', ' ')}
          color={gamma.marketMakerPositioning === 'short_gamma' ? 'red' : 'green'}
          subtitle={gamma.expectedVolatility + ' volatility'}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
        {(
          [
            { key: 'flow', label: '📈 Flow' },
            { key: 'surface', label: '📊 Volatility' },
            { key: 'maxpain', label: '🎯 Max Pain' },
            { key: 'gamma', label: '⚡ Gamma' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          {/* Top Unusual Trades */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🔥 Unusual Options Activity
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Large and unusual trades that may indicate smart money positioning
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Contract
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Strike
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Premium
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      IV
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Side
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                      Signal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {flow.topTrades.slice(0, 10).map((trade) => (
                    <tr
                      key={trade.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {trade.contract.underlying}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            trade.contract.type === 'call'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {trade.contract.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white font-mono">
                        {formatPrice(trade.contract.strike)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-slate-400">
                        {formatExpiry(trade.contract.expiry)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatVolume(trade.premium)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-slate-400">
                        {trade.impliedVolatility.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            trade.side === 'buy'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                        {trade.unusualReason?.join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volume by Expiry */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Volume by Expiry
              </h3>
              <div className="space-y-3">
                {Object.entries(flow.byExpiry)
                  .slice(0, 6)
                  .map(([expiry, data]) => {
                    const total = data.calls + data.puts;
                    const callPct = total > 0 ? (data.calls / total) * 100 : 50;
                    return (
                      <div key={expiry}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-slate-300">
                            {formatExpiry(expiry)}
                          </span>
                          <span className="text-gray-500 dark:text-slate-400">
                            {formatVolume(data.premium)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full"
                            style={{ width: `${callPct}%` }}
                          />
                          <div
                            className="bg-red-500 h-full"
                            style={{ width: `${100 - callPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded" />
                  Calls
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded" />
                  Puts
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Trades
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {flow.trades.slice(0, 15).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          trade.contract.type === 'call' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatPrice(trade.contract.strike)}{' '}
                        {trade.contract.type.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {formatExpiry(trade.contract.expiry)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${
                          trade.side === 'buy'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatVolume(trade.premium)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                        {formatTime(trade.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'surface' && (
        <div className="space-y-6">
          {/* Term Structure */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 IV Term Structure
            </h3>
            <div className="h-48 flex items-end gap-2">
              {surface.termStructure.slice(0, 12).map((point, i) => {
                const maxIV = Math.max(...surface.termStructure.map((p) => p.iv)) || 100;
                const height = (point.iv / maxIV) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-400"
                      style={{ height: `${height}%` }}
                      title={`${point.days}d: ${point.iv.toFixed(1)}% IV`}
                    />
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {point.days}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ATM IV & Skew by Expiry */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ATM Implied Volatility
              </h3>
              <div className="space-y-3">
                {Object.entries(surface.atmIV)
                  .slice(0, 8)
                  .map(([expiry, iv]) => (
                    <div key={expiry} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {formatExpiry(expiry)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${Math.min(iv, 150)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                          {iv.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Volatility Skew
              </h3>
              <div className="space-y-3">
                {Object.entries(surface.skew)
                  .slice(0, 8)
                  .map(([expiry, skew]) => (
                    <div key={expiry} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {formatExpiry(expiry)}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          skew > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {skew > 0 ? '+' : ''}
                        {skew.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
                Positive skew = puts more expensive (bearish hedging)
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'maxpain' && (
        <div className="space-y-6">
          {/* Max Pain Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Current Price</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(maxPain.currentPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Max Pain Price</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatPrice(maxPain.maxPainPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Distance</p>
                <p
                  className={`text-3xl font-bold ${
                    maxPain.distancePercent > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {maxPain.distancePercent > 0 ? '+' : ''}
                  {maxPain.distancePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* OI Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Open Interest Distribution
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">Call OI</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {maxPain.totalCallOI.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">Put OI</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {maxPain.totalPutOI.toLocaleString()}
                </p>
              </div>
            </div>

            {/* OI Chart */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {maxPain.callOI.slice(0, 15).map((call, i) => {
                const put = maxPain.putOI[i];
                const maxOI = Math.max(
                  ...maxPain.callOI.map((c) => c.oi),
                  ...maxPain.putOI.map((p) => p.oi)
                );
                const callWidth = maxOI > 0 ? (call.oi / maxOI) * 100 : 0;
                const putWidth = maxOI > 0 ? (put?.oi || 0) / maxOI * 100 : 0;
                const isMaxPain = call.strike === maxPain.maxPainPrice;

                return (
                  <div
                    key={call.strike}
                    className={`flex items-center gap-2 py-1 ${isMaxPain ? 'bg-yellow-50 dark:bg-yellow-900/20 rounded' : ''}`}
                  >
                    <div className="w-16 text-xs text-right text-green-600 dark:text-green-400">
                      {call.oi.toLocaleString()}
                    </div>
                    <div className="flex-1 h-4 flex">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="bg-green-500 h-full rounded-l"
                          style={{ width: `${callWidth}%` }}
                        />
                      </div>
                      <div
                        className={`w-16 text-center text-xs font-medium ${isMaxPain ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-slate-300'}`}
                      >
                        {formatPrice(call.strike)}
                      </div>
                      <div className="flex-1">
                        <div
                          className="bg-red-500 h-full rounded-r"
                          style={{ width: `${putWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-xs text-red-600 dark:text-red-400">
                      {(put?.oi || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gamma' && (
        <div className="space-y-6">
          {/* Gamma Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Spot Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(gamma.spotPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Net Gamma</p>
                <p
                  className={`text-2xl font-bold ${gamma.netGamma >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {gamma.netGamma >= 0 ? '+' : ''}
                  {gamma.netGamma.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Gamma Flip</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPrice(gamma.gammaFlipPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Positioning</p>
                <p
                  className={`text-2xl font-bold capitalize ${
                    gamma.marketMakerPositioning === 'short_gamma'
                      ? 'text-red-600 dark:text-red-400'
                      : gamma.marketMakerPositioning === 'long_gamma'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {gamma.marketMakerPositioning.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Gamma Explanation */}
          <div
            className={`p-4 rounded-xl ${
              gamma.marketMakerPositioning === 'short_gamma'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
            }`}
          >
            <h3
              className={`font-semibold mb-2 ${
                gamma.marketMakerPositioning === 'short_gamma'
                  ? 'text-red-900 dark:text-red-200'
                  : 'text-green-900 dark:text-green-200'
              }`}
            >
              {gamma.marketMakerPositioning === 'short_gamma'
                ? '⚠️ Short Gamma Environment'
                : '✅ Long Gamma Environment'}
            </h3>
            <p
              className={`text-sm ${
                gamma.marketMakerPositioning === 'short_gamma'
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-green-800 dark:text-green-300'
              }`}
            >
              {gamma.marketMakerPositioning === 'short_gamma'
                ? 'Market makers need to sell when price drops and buy when price rises, amplifying volatility. Expect larger moves.'
                : 'Market makers will buy when price drops and sell when price rises, dampening volatility. Expect mean reversion.'}
            </p>
          </div>

          {/* Gamma by Strike */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gamma Exposure by Strike
            </h3>
            <div className="h-48 flex items-center gap-1">
              {gamma.gammaByStrike.slice(0, 20).map((point, i) => {
                const maxGamma = Math.max(...gamma.gammaByStrike.map((p) => Math.abs(p.gamma)));
                const height = maxGamma > 0 ? (Math.abs(point.gamma) / maxGamma) * 100 : 0;
                const isPositive = point.gamma >= 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full">
                    {isPositive ? (
                      <>
                        <div className="flex-1 flex items-end w-full">
                          <div
                            className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="flex-1" />
                      </>
                    ) : (
                      <>
                        <div className="flex-1" />
                        <div className="flex-1 flex items-start w-full">
                          <div
                            className="w-full bg-red-500 rounded-b transition-all duration-300 hover:bg-red-400"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-gray-500 dark:text-slate-400 mt-2">
              Strike prices from low to high
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-slate-400 py-4">
        Data from Deribit, OKX, and Bybit • Last updated:{' '}
        {new Date(dashboard.lastUpdated).toLocaleTimeString()}
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
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow';
  subtitle?: string;
}

function SummaryCard({ title, value, color, subtitle }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50',
  };

  const textClasses = {
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    blue: 'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    orange: 'text-orange-700 dark:text-orange-300',
    yellow: 'text-yellow-700 dark:text-yellow-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
      <p className={`text-xl font-bold mt-1 ${textClasses[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default OptionsFlowDashboard;
