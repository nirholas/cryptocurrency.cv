'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types (matching lib/orderbook-aggregator.ts)
// =============================================================================

interface AggregatedLevel {
  price: number;
  quantity: number;
  valueUsd: number;
  exchanges: Array<{
    exchange: string;
    quantity: number;
  }>;
}

interface BestPrice {
  price: number;
  quantity: number;
  exchange: string;
}

interface ExchangeDepth {
  exchange: string;
  bidDepthUsd: number;
  askDepthUsd: number;
  bidPercent: number;
  askPercent: number;
  spread: number;
  latency: number;
}

interface AggregatedOrderBook {
  symbol: string;
  timestamp: number;
  exchanges: string[];
  bids: AggregatedLevel[];
  asks: AggregatedLevel[];
  bestBid: BestPrice;
  bestAsk: BestPrice;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  totalBidDepthUsd: number;
  totalAskDepthUsd: number;
  imbalance: number;
  exchangeBreakdown: ExchangeDepth[];
}

interface LiquidityAnalysis {
  symbol: string;
  timestamp: number;
  depth1Percent: { bid: number; ask: number };
  depth2Percent: { bid: number; ask: number };
  depth5Percent: { bid: number; ask: number };
  depth10Percent: { bid: number; ask: number };
  bidAskRatio: number;
  liquidityScore: number;
  recommendation: string;
}

interface SlippageEstimate {
  symbol: string;
  side: 'buy' | 'sell';
  orderSizeUsd: number;
  averagePrice: number;
  slippagePercent: number;
  slippageUsd: number;
  levelsConsumed: number;
  exchangeBreakdown: Array<{
    exchange: string;
    filledUsd: number;
    avgPrice: number;
  }>;
}

interface OrderBookDashboardData {
  aggregatedBook: AggregatedOrderBook;
  liquidityAnalysis: LiquidityAnalysis;
  slippageEstimates: {
    buy: SlippageEstimate[];
    sell: SlippageEstimate[];
  };
  arbitrageOpportunity: {
    exists: boolean;
    buyExchange: string;
    sellExchange: string;
    spreadPercent: number;
    potentialProfitBps: number;
  } | null;
}

// =============================================================================
// Component
// =============================================================================

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'] as const;
const MARKET_TYPES = ['spot', 'futures'] as const;

export function OrderBookDashboard() {
  const [data, setData] = useState<OrderBookDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>('BTC');
  const [market, setMarket] = useState<(typeof MARKET_TYPES)[number]>('spot');
  const [maxLevels, setMaxLevels] = useState(15);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/orderbook?symbol=${symbol}&market=${market}&view=dashboard`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful');
      }

      setData(result.data);
    } catch (err) {
      console.error('Order book fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order book');
    } finally {
      setLoading(false);
    }
  }, [symbol, market]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 10000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 100) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatQuantity = (qty: number) => {
    if (qty >= 1000) return qty.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (qty >= 1) return qty.toFixed(2);
    return qty.toFixed(4);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
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
            Failed to Load Order Book
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { aggregatedBook, liquidityAnalysis, slippageEstimates, arbitrageOpportunity } = data;

  return (
    <div className="space-y-6">
      {/* Symbol & Market Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSymbol(s);
                setLoading(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                symbol === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {MARKET_TYPES.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMarket(m);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                market === m
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Arbitrage Alert */}
        {arbitrageOpportunity && arbitrageOpportunity.exists && (
          <div className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg text-sm font-medium">
            🔥 Arbitrage: Buy on {arbitrageOpportunity.buyExchange.toUpperCase()}, Sell on{' '}
            {arbitrageOpportunity.sellExchange.toUpperCase()} (+
            {arbitrageOpportunity.potentialProfitBps} bps)
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Mid Price"
          value={formatPrice(aggregatedBook.midPrice)}
          color="blue"
        />
        <SummaryCard
          title="Spread"
          value={`${aggregatedBook.spreadPercent.toFixed(4)}%`}
          subtitle={formatPrice(aggregatedBook.spread)}
          color={aggregatedBook.spreadPercent < 0.05 ? 'green' : 'yellow'}
        />
        <SummaryCard
          title="Bid Depth"
          value={formatVolume(aggregatedBook.totalBidDepthUsd)}
          color="green"
        />
        <SummaryCard
          title="Ask Depth"
          value={formatVolume(aggregatedBook.totalAskDepthUsd)}
          color="red"
        />
        <SummaryCard
          title="Imbalance"
          value={`${(aggregatedBook.imbalance * 100).toFixed(1)}%`}
          color={aggregatedBook.imbalance > 0 ? 'green' : 'red'}
          subtitle={aggregatedBook.imbalance > 0 ? 'Buy pressure' : 'Sell pressure'}
        />
        <SummaryCard
          title="Liquidity Score"
          value={`${liquidityAnalysis.liquidityScore}/100`}
          color={liquidityAnalysis.liquidityScore > 70 ? 'green' : liquidityAnalysis.liquidityScore > 40 ? 'yellow' : 'red'}
        />
      </div>

      {/* Main Order Book */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bids */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                📈 Bids (Buy Orders)
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Best: {formatPrice(aggregatedBook.bestBid.price)} on{' '}
                {aggregatedBook.bestBid.exchange.toUpperCase()}
              </p>
            </div>
            <select
              value={maxLevels}
              onChange={(e) => setMaxLevels(parseInt(e.target.value))}
              className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm"
            >
              <option value={10}>10 levels</option>
              <option value={15}>15 levels</option>
              <option value={25}>25 levels</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-slate-400">Price</th>
                  <th className="px-3 py-2 text-right text-gray-500 dark:text-slate-400">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-right text-gray-500 dark:text-slate-400">Total</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-slate-400">
                    Exchanges
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregatedBook.bids.slice(0, maxLevels).map((level, i) => {
                  const maxValue = Math.max(...aggregatedBook.bids.slice(0, maxLevels).map(l => l.valueUsd));
                  const widthPct = maxValue > 0 ? (level.valueUsd / maxValue) * 100 : 0;
                  return (
                    <tr key={i} className="relative hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2 text-sm font-mono text-green-600 dark:text-green-400 relative z-10">
                        {formatPrice(level.price)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white relative z-10">
                        {formatQuantity(level.quantity)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-500 dark:text-slate-400 relative z-10">
                        {formatVolume(level.valueUsd)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 relative z-10">
                        {level.exchanges.map((e) => e.exchange.charAt(0).toUpperCase()).join(', ')}
                      </td>
                      <td
                        className="absolute inset-0 bg-green-500/10 dark:bg-green-500/20"
                        style={{ width: `${widthPct}%` }}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              📉 Asks (Sell Orders)
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Best: {formatPrice(aggregatedBook.bestAsk.price)} on{' '}
              {aggregatedBook.bestAsk.exchange.toUpperCase()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-slate-400">Price</th>
                  <th className="px-3 py-2 text-right text-gray-500 dark:text-slate-400">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-right text-gray-500 dark:text-slate-400">Total</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-slate-400">
                    Exchanges
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregatedBook.asks.slice(0, maxLevels).map((level, i) => {
                  const maxValue = Math.max(...aggregatedBook.asks.slice(0, maxLevels).map(l => l.valueUsd));
                  const widthPct = maxValue > 0 ? (level.valueUsd / maxValue) * 100 : 0;
                  return (
                    <tr key={i} className="relative hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2 text-sm font-mono text-red-600 dark:text-red-400 relative z-10">
                        {formatPrice(level.price)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white relative z-10">
                        {formatQuantity(level.quantity)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-500 dark:text-slate-400 relative z-10">
                        {formatVolume(level.valueUsd)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 relative z-10">
                        {level.exchanges.map((e) => e.exchange.charAt(0).toUpperCase()).join(', ')}
                      </td>
                      <td
                        className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 right-auto"
                        style={{ width: `${widthPct}%` }}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Exchange Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏦 Exchange Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 dark:text-slate-400">Exchange</th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">
                  Bid Depth
                </th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">
                  Ask Depth
                </th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">Spread</th>
                <th className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">Latency</th>
                <th className="px-4 py-3 text-left text-gray-500 dark:text-slate-400">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {aggregatedBook.exchangeBreakdown.map((ex) => (
                <tr key={ex.exchange} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {ex.exchange}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                    {formatVolume(ex.bidDepthUsd)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                    {formatVolume(ex.askDepthUsd)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-slate-400">
                    {ex.spread.toFixed(4)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-slate-400">
                    {ex.latency}ms
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${ex.bidPercent}%` }}
                        />
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${ex.askPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-slate-400 w-12">
                        {ex.bidPercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slippage Estimates */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Buy Slippage Estimates
          </h3>
          <div className="space-y-3">
            {slippageEstimates.buy.map((est) => (
              <div
                key={est.orderSizeUsd}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatVolume(est.orderSizeUsd)} order
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                    ({est.levelsConsumed} levels)
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      est.slippagePercent < 0.1
                        ? 'text-green-600 dark:text-green-400'
                        : est.slippagePercent < 0.5
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {est.slippagePercent.toFixed(4)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                    ({formatVolume(est.slippageUsd)} cost)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Sell Slippage Estimates
          </h3>
          <div className="space-y-3">
            {slippageEstimates.sell.map((est) => (
              <div
                key={est.orderSizeUsd}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatVolume(est.orderSizeUsd)} order
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                    ({est.levelsConsumed} levels)
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      est.slippagePercent < 0.1
                        ? 'text-green-600 dark:text-green-400'
                        : est.slippagePercent < 0.5
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {est.slippagePercent.toFixed(4)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                    ({formatVolume(est.slippageUsd)} cost)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liquidity Depth */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💧 Liquidity Depth Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: '±1%', data: liquidityAnalysis.depth1Percent },
            { label: '±2%', data: liquidityAnalysis.depth2Percent },
            { label: '±5%', data: liquidityAnalysis.depth5Percent },
            { label: '±10%', data: liquidityAnalysis.depth10Percent },
          ].map((depth) => (
            <div key={depth.label} className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{depth.label} from mid</p>
              <div className="flex justify-center gap-4">
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatVolume(depth.data.bid)}
                  </p>
                  <p className="text-xs text-gray-500">Bid</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatVolume(depth.data.ask)}
                  </p>
                  <p className="text-xs text-gray-500">Ask</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Recommendation:</strong> {liquidityAnalysis.recommendation}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-slate-400 py-4">
        Data from {aggregatedBook.exchanges.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(', ')} •
        Updated {new Date(aggregatedBook.timestamp).toLocaleTimeString()}
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
  color: 'green' | 'red' | 'blue' | 'yellow';
  subtitle?: string;
}

function SummaryCard({ title, value, color, subtitle }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50',
  };

  const textClasses = {
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    blue: 'text-blue-700 dark:text-blue-300',
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

export default OrderBookDashboard;
