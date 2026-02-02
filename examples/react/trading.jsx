/**
 * Trading Dashboard React Examples
 * 
 * Signals, whale alerts, funding rates, liquidations, and orderbook.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  useSignals,
  useWhaleAlerts,
  useFundingRates,
  useLiquidations,
  useOrderbook,
  useArbitrage,
  SignalCard,
  WhaleAlertFeed,
  OrderbookDepth,
} from '@nirholas/react-crypto-news';

// ═══════════════════════════════════════════════════════════════
// Trading Signals
// ═══════════════════════════════════════════════════════════════

/**
 * Trading signals list
 */
export function TradingSignals() {
  const { signals, loading, error } = useSignals({ limit: 10 });

  if (loading) return <SignalsSkeleton />;
  if (error) return <div className="text-red-500">Failed to load signals</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">📊 Trading Signals</h2>
      
      <div className="space-y-3">
        {signals.map((signal, i) => (
          <div 
            key={i}
            className={`p-4 rounded-lg border-l-4 ${
              signal.action === 'buy' || signal.action === 'long'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${
                  signal.action === 'buy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {signal.action === 'buy' ? '🟢' : '🔴'} {signal.action.toUpperCase()}
                </span>
                <span className="text-lg font-bold">{signal.symbol}</span>
              </div>
              
              <div className="text-right">
                <div className="font-mono text-lg">
                  ${signal.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Confidence: {(signal.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            {signal.reason && (
              <div className="mt-2 text-sm text-gray-600">
                💡 {signal.reason}
              </div>
            )}
            
            {signal.targets && (
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600">
                  TP: ${signal.targets.takeProfit.toLocaleString()}
                </span>
                <span className="text-red-600">
                  SL: ${signal.targets.stopLoss.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Whale Alerts
// ═══════════════════════════════════════════════════════════════

/**
 * Real-time whale alerts
 */
export function WhaleAlerts() {
  const { alerts, loading } = useWhaleAlerts({ 
    limit: 15,
    refreshInterval: 10000,
  });

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🐋 Whale Alerts</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.map((alert, i) => (
            <div 
              key={i}
              className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {alert.type === 'exchange_inflow' ? '📥' :
                     alert.type === 'exchange_outflow' ? '📤' :
                     '🔄'}
                  </span>
                  <div>
                    <div className="font-bold">{alert.symbol}</div>
                    <div className="text-sm text-gray-400">
                      {formatAmount(alert.amount)} ({formatUsd(alert.usdValue)})
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  <div className="text-gray-400">{alert.fromLabel}</div>
                  <div>→ {alert.toLabel}</div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {alert.timeAgo} • {alert.blockchain}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Funding Rates
// ═══════════════════════════════════════════════════════════════

/**
 * Funding rates heatmap
 */
export function FundingRatesTable() {
  const { rates, loading, error } = useFundingRates();
  const [sortBy, setSortBy] = useState<'symbol' | 'rate'>('rate');

  const sortedRates = [...(rates || [])].sort((a, b) => {
    if (sortBy === 'rate') return Math.abs(b.rate) - Math.abs(a.rate);
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">💵 Funding Rates</h2>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="rate">Sort by Rate</option>
          <option value="symbol">Sort by Symbol</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Binance</th>
                <th className="pb-2">Bybit</th>
                <th className="pb-2">OKX</th>
                <th className="pb-2">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedRates.slice(0, 20).map((item) => (
                <tr key={item.symbol} className="hover:bg-gray-50">
                  <td className="py-2 font-medium">{item.symbol}</td>
                  <td className="py-2">
                    <FundingCell rate={item.binance} />
                  </td>
                  <td className="py-2">
                    <FundingCell rate={item.bybit} />
                  </td>
                  <td className="py-2">
                    <FundingCell rate={item.okx} />
                  </td>
                  <td className="py-2">
                    <FundingCell rate={item.rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded" /> Negative (shorts pay)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded" /> High positive (longs pay)
        </span>
      </div>
    </div>
  );
}

function FundingCell({ rate }: { rate?: number }) {
  if (rate === undefined) return <span className="text-gray-300">-</span>;
  
  const isHigh = Math.abs(rate) > 0.01;
  const isNegative = rate < 0;
  
  return (
    <span className={`font-mono ${
      isNegative ? 'text-green-600' :
      isHigh ? 'text-red-600' :
      'text-gray-600'
    }`}>
      {rate >= 0 ? '+' : ''}{rate.toFixed(4)}%
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Liquidations
// ═══════════════════════════════════════════════════════════════

/**
 * Liquidation feed
 */
export function LiquidationFeed() {
  const { liquidations, stats, loading } = useLiquidations({
    refreshInterval: 5000,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">💥 Liquidations</h2>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">
              ${(stats.total24h / 1e6).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-500">24h Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${(stats.longs24h / 1e6).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-500">Long Liqs</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              ${(stats.shorts24h / 1e6).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-500">Short Liqs</div>
          </div>
        </div>
      )}

      {/* Liquidation Bar */}
      {stats && (
        <div className="mb-6">
          <div className="h-4 rounded-full overflow-hidden bg-gray-200 flex">
            <div 
              className="bg-green-500" 
              style={{ width: `${stats.longs24h / stats.total24h * 100}%` }}
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${stats.shorts24h / stats.total24h * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Longs {((stats.longs24h / stats.total24h) * 100).toFixed(0)}%</span>
            <span>Shorts {((stats.shorts24h / stats.total24h) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Recent Liquidations */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : (
          liquidations.slice(0, 20).map((liq, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-2 rounded ${
                liq.side === 'long' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{liq.side === 'long' ? '🔻' : '🔺'}</span>
                <span className="font-medium">{liq.symbol}</span>
                <span className={`text-xs px-1 rounded ${
                  liq.side === 'long' ? 'bg-green-200' : 'bg-red-200'
                }`}>
                  {liq.side.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono">${liq.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">@ ${liq.price.toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Orderbook
// ═══════════════════════════════════════════════════════════════

/**
 * Live orderbook display
 */
export function LiveOrderbook() {
  const [symbol, setSymbol] = useState('BTC');
  const { orderbook, loading, error } = useOrderbook({
    symbol,
    depth: 15,
    refreshInterval: 1000,
  });

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📗 Order Book</h2>
        <select 
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-gray-800 text-white px-3 py-1 rounded"
        >
          <option value="BTC">BTC/USDT</option>
          <option value="ETH">ETH/USDT</option>
          <option value="SOL">SOL/USDT</option>
        </select>
      </div>

      {loading && !orderbook ? (
        <div className="animate-pulse space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-800 rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Asks (sells) - reversed to show highest first */}
          <div className="space-y-0.5 mb-2">
            {orderbook?.asks.slice().reverse().map((ask, i) => (
              <OrderbookRow 
                key={i}
                price={ask.price}
                quantity={ask.quantity}
                total={ask.total}
                side="ask"
                maxTotal={orderbook.maxTotal}
              />
            ))}
          </div>

          {/* Spread */}
          <div className="py-2 text-center border-y border-gray-700">
            <span className="text-lg font-mono font-bold">
              ${orderbook?.midPrice.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 ml-2">
              Spread: ${orderbook?.spread.toFixed(2)} ({orderbook?.spreadPercent.toFixed(3)}%)
            </span>
          </div>

          {/* Bids (buys) */}
          <div className="space-y-0.5 mt-2">
            {orderbook?.bids.map((bid, i) => (
              <OrderbookRow 
                key={i}
                price={bid.price}
                quantity={bid.quantity}
                total={bid.total}
                side="bid"
                maxTotal={orderbook.maxTotal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderbookRow({ price, quantity, total, side, maxTotal }: {
  price: number;
  quantity: number;
  total: number;
  side: 'ask' | 'bid';
  maxTotal: number;
}) {
  const percentage = (total / maxTotal) * 100;
  
  return (
    <div className="relative flex text-sm font-mono">
      <div 
        className={`absolute inset-0 ${
          side === 'ask' ? 'bg-red-500/20' : 'bg-green-500/20'
        }`}
        style={{ width: `${percentage}%` }}
      />
      <div className={`relative z-10 w-1/3 ${
        side === 'ask' ? 'text-red-400' : 'text-green-400'
      }`}>
        {price.toLocaleString()}
      </div>
      <div className="relative z-10 w-1/3 text-right text-gray-300">
        {quantity.toFixed(4)}
      </div>
      <div className="relative z-10 w-1/3 text-right text-gray-500">
        {total.toFixed(4)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Arbitrage
// ═══════════════════════════════════════════════════════════════

/**
 * Arbitrage opportunities
 */
export function ArbitrageOpportunities() {
  const { opportunities, loading } = useArbitrage({ limit: 10 });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">🔄 Arbitrage Opportunities</h2>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No significant opportunities at the moment
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((arb, i) => (
            <div key={i} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="font-bold text-lg">{arb.symbol}</div>
                <div className="text-green-600 font-bold">
                  +{arb.spreadPercent.toFixed(2)}%
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex-1">
                  <div className="text-gray-500">Buy on</div>
                  <div className="font-medium">{arb.buyExchange}</div>
                  <div className="font-mono">${arb.buyPrice.toLocaleString()}</div>
                </div>
                <div className="text-2xl text-gray-300">→</div>
                <div className="flex-1 text-right">
                  <div className="text-gray-500">Sell on</div>
                  <div className="font-medium">{arb.sellExchange}</div>
                  <div className="font-mono">${arb.sellPrice.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Est. Profit on $10K: ${((arb.spreadPercent / 100) * 10000).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function formatAmount(amount: number): string {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
  return amount.toFixed(2);
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function SignalsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Full Trading Dashboard
// ═══════════════════════════════════════════════════════════════

export default function TradingDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">📊 Trading Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TradingSignals />
            <FundingRatesTable />
            <ArbitrageOpportunities />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <LiveOrderbook />
            <WhaleAlerts />
            <LiquidationFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
