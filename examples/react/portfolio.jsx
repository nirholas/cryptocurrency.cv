/**
 * Portfolio Management React Examples
 * 
 * Portfolio tracking, watchlists, alerts, and performance.
 */

import React, { useState, useMemo } from 'react';
import { 
  usePortfolio,
  useWatchlist,
  usePriceAlerts,
  usePortfolioHistory,
  PortfolioChart,
  AllocationPieChart,
} from '@nirholas/react-crypto-news';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
}

interface WatchlistItem {
  symbol: string;
  targetPrice?: number;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════
// Portfolio Overview
// ═══════════════════════════════════════════════════════════════

/**
 * Complete portfolio dashboard
 */
export function PortfolioDashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: 'BTC', quantity: 1.5, avgCost: 42000 },
    { symbol: 'ETH', quantity: 20, avgCost: 2800 },
    { symbol: 'SOL', quantity: 100, avgCost: 95 },
    { symbol: 'LINK', quantity: 500, avgCost: 15 },
    { symbol: 'AVAX', quantity: 50, avgCost: 35 },
  ]);

  const { portfolio, loading, error, refresh } = usePortfolio({ holdings });

  if (loading && !portfolio) return <PortfolioSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const totalValue = portfolio?.totalValue || 0;
  const totalCost = portfolio?.totalCost || 0;
  const pnl = totalValue - totalCost;
  const pnlPercent = (pnl / totalCost) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Portfolio Value" 
          value={formatCurrency(totalValue)}
          large
        />
        <StatCard 
          label="Total Cost" 
          value={formatCurrency(totalCost)}
        />
        <StatCard 
          label="Total P&L" 
          value={formatCurrency(pnl)}
          change={pnlPercent}
          colored
        />
        <StatCard 
          label="24h Change" 
          value={formatCurrency(portfolio?.change24h || 0)}
          change={portfolio?.changePercent24h}
          colored
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2">
          <HoldingsTable 
            holdings={portfolio?.holdings || []}
            onRemove={(symbol) => {
              setHoldings(h => h.filter(x => x.symbol !== symbol));
            }}
          />
        </div>

        {/* Allocation Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Allocation</h3>
          <AllocationPieChart data={portfolio?.allocation || []} />
        </div>
      </div>

      {/* Add Holding */}
      <AddHoldingForm onAdd={(holding) => setHoldings([...holdings, holding])} />
    </div>
  );
}

function HoldingsTable({ holdings, onRemove }: { 
  holdings: any[];
  onRemove: (symbol: string) => void;
}) {
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'change'>('value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aVal = sortBy === 'value' ? a.currentValue :
                   sortBy === 'pnl' ? a.pnl :
                   a.changePercent24h;
      const bVal = sortBy === 'value' ? b.currentValue :
                   sortBy === 'pnl' ? b.pnl :
                   b.changePercent24h;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [holdings, sortBy, sortDir]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Asset</th>
            <th className="px-4 py-3 text-right">Quantity</th>
            <th className="px-4 py-3 text-right">Avg Cost</th>
            <th className="px-4 py-3 text-right">Current</th>
            <th 
              className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('value')}
            >
              Value {sortBy === 'value' && (sortDir === 'desc' ? '↓' : '↑')}
            </th>
            <th 
              className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('pnl')}
            >
              P&L {sortBy === 'pnl' && (sortDir === 'desc' ? '↓' : '↑')}
            </th>
            <th 
              className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('change')}
            >
              24h {sortBy === 'change' && (sortDir === 'desc' ? '↓' : '↑')}
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((holding) => (
            <tr key={holding.symbol} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={holding.icon} 
                    alt="" 
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-medium">{holding.symbol}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {holding.quantity.toFixed(4)}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                ${holding.avgCost.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                ${holding.currentPrice.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono font-medium">
                ${holding.currentValue.toLocaleString()}
              </td>
              <td className={`px-4 py-3 text-right font-mono ${
                holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                <div className="text-xs">
                  ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%)
                </div>
              </td>
              <td className={`px-4 py-3 text-right ${
                holding.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {holding.changePercent24h >= 0 ? '+' : ''}
                {holding.changePercent24h.toFixed(2)}%
              </td>
              <td className="px-4 py-3">
                <button 
                  onClick={() => onRemove(holding.symbol)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddHoldingForm({ onAdd }: { onAdd: (holding: Holding) => void }) {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && quantity && avgCost) {
      onAdd({
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        avgCost: parseFloat(avgCost),
      });
      setSymbol('');
      setQuantity('');
      setAvgCost('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Add Holding</h3>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          placeholder="Symbol (e.g., BTC)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
          step="any"
        />
        <input
          type="number"
          placeholder="Avg Cost ($)"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
          step="any"
        />
        <button 
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Portfolio Performance Chart
// ═══════════════════════════════════════════════════════════════

export function PortfolioPerformance() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  const holdings = [
    { symbol: 'BTC', quantity: 1.5, avgCost: 42000 },
    { symbol: 'ETH', quantity: 20, avgCost: 2800 },
  ];

  const { history, loading } = usePortfolioHistory({ 
    holdings, 
    timeframe 
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Portfolio Performance</h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      ) : (
        <PortfolioChart 
          data={history}
          height={300}
          showComparison
          compareWith={['BTC', 'ETH']}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Watchlist
// ═══════════════════════════════════════════════════════════════

export function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([
    { symbol: 'AVAX', targetPrice: 45, notes: 'Wait for breakout' },
    { symbol: 'MATIC', targetPrice: 1.20, notes: 'Layer 2 play' },
    { symbol: 'ARB', notes: 'Monitor for entry' },
    { symbol: 'OP', targetPrice: 3.50 },
  ]);

  const { watchlist, loading } = useWatchlist({ items });

  const [newSymbol, setNewSymbol] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const addItem = () => {
    if (newSymbol) {
      setItems([...items, { 
        symbol: newSymbol.toUpperCase(),
        targetPrice: newTarget ? parseFloat(newTarget) : undefined,
      }]);
      setNewSymbol('');
      setNewTarget('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">👀 Watchlist</h3>

      {/* Add Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Symbol"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <input
          type="number"
          placeholder="Target $"
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          className="w-24 px-3 py-2 border rounded-lg text-sm"
        />
        <button 
          onClick={addItem}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Add
        </button>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))
        ) : (
          watchlist.map((item) => (
            <WatchlistCard 
              key={item.symbol}
              item={item}
              onRemove={() => setItems(items.filter(i => i.symbol !== item.symbol))}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WatchlistCard({ item, onRemove }: { item: any; onRemove: () => void }) {
  const distanceToTarget = item.targetPrice 
    ? ((item.targetPrice - item.currentPrice) / item.currentPrice) * 100
    : null;

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={item.icon} alt="" className="w-8 h-8 rounded-full" />
          <div>
            <div className="font-bold">{item.symbol}</div>
            <div className="text-sm text-gray-500">{item.name}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-mono text-lg">
            ${item.currentPrice.toLocaleString()}
          </div>
          <div className={`text-sm ${
            item.change24h >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
          </div>
        </div>
      </div>

      {item.targetPrice && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Target: ${item.targetPrice}</span>
            <span className={distanceToTarget! >= 0 ? 'text-green-600' : 'text-red-600'}>
              {distanceToTarget! >= 0 ? '▲' : '▼'} {Math.abs(distanceToTarget!).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${distanceToTarget! >= 0 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ 
                width: `${Math.min(100, Math.abs(100 - Math.abs(distanceToTarget!)))}%` 
              }}
            />
          </div>
        </div>
      )}

      {item.notes && (
        <div className="mt-2 text-sm text-gray-500">
          📝 {item.notes}
        </div>
      )}

      <button 
        onClick={onRemove}
        className="mt-2 text-xs text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Price Alerts
// ═══════════════════════════════════════════════════════════════

export function PriceAlerts() {
  const { alerts, addAlert, removeAlert, triggeredAlerts } = usePriceAlerts();
  
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleAdd = () => {
    if (symbol && price) {
      addAlert({
        symbol: symbol.toUpperCase(),
        price: parseFloat(price),
        condition,
      });
      setSymbol('');
      setPrice('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">🔔 Price Alerts</h3>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">⚡ Triggered!</h4>
          {triggeredAlerts.map((alert, i) => (
            <div key={i} className="text-sm text-yellow-700">
              {alert.symbol} {alert.condition} ${alert.price}
            </div>
          ))}
        </div>
      )}

      {/* Add Alert Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 px-3 py-2 border rounded-lg text-sm"
        />
        <button 
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Add
        </button>
      </div>

      {/* Active Alerts */}
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className={alert.condition === 'above' ? 'text-green-600' : 'text-red-600'}>
                {alert.condition === 'above' ? '📈' : '📉'}
              </span>
              <span className="font-medium">{alert.symbol}</span>
              <span className="text-gray-500">{alert.condition}</span>
              <span className="font-mono">${alert.price.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => removeAlert(i)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        
        {alerts.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, change, large, colored }: {
  label: string;
  value: string;
  change?: number;
  large?: boolean;
  colored?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`font-bold ${large ? 'text-3xl' : 'text-xl'} ${
        colored && change !== undefined
          ? change >= 0 ? 'text-green-600' : 'text-red-600'
          : ''
      }`}>
        {value}
      </div>
      {change !== undefined && (
        <div className={`text-sm ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-lg" />
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-red-500 text-xl mb-4">⚠️ {error.message}</div>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Retry
      </button>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ═══════════════════════════════════════════════════════════════
// Full App
// ═══════════════════════════════════════════════════════════════

export default function PortfolioApp() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">💼 Portfolio Manager</h1>

        <div className="space-y-8">
          <PortfolioDashboard />
          
          <PortfolioPerformance />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Watchlist />
            <PriceAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}
