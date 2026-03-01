/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Market Data React Examples
 * 
 * Price tickers, charts, market cap, and trading data.
 */

import React, { useState, useEffect } from 'react';
import { 
  useMarketData,
  useFearGreed,
  usePrices,
  PriceTicker,
  MarketOverview,
  FearGreedGauge,
  PriceChart,
} from '@nirholas/react-crypto-news';

// ═══════════════════════════════════════════════════════════════
// Price Components
// ═══════════════════════════════════════════════════════════════

/**
 * Simple price ticker
 */
export function SimplePriceTicker() {
  return (
    <div className="bg-gray-900 text-white p-4">
      <PriceTicker 
        symbols={['BTC', 'ETH', 'SOL', 'XRP', 'DOGE']}
        showChange
        showIcon
      />
    </div>
  );
}

/**
 * Custom price display with hook
 */
export function CustomPrices() {
  const { prices, loading, error } = usePrices({
    symbols: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'LINK', 'DOT'],
    refreshInterval: 30000,
  });

  if (loading) return <div className="animate-pulse">Loading prices...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {prices.map((coin) => (
        <div 
          key={coin.symbol}
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={coin.icon} 
              alt={coin.symbol}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <div className="font-bold">{coin.symbol}</div>
              <div className="text-xs text-gray-500">{coin.name}</div>
            </div>
          </div>
          
          <div className="text-2xl font-bold">
            ${coin.price.toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: coin.price < 1 ? 6 : 2 
            })}
          </div>
          
          <div className={`flex items-center gap-1 text-sm ${
            coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            <span>{coin.change24h >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(coin.change24h).toFixed(2)}%</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            MCap: ${(coin.marketCap / 1e9).toFixed(1)}B
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Market Overview
// ═══════════════════════════════════════════════════════════════

/**
 * Complete market overview
 */
export function MarketDashboard() {
  const { data, loading, error } = useMarketData();

  if (loading) return <MarketSkeleton />;
  if (error) return <div className="text-red-500">Failed to load market data</div>;

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Market Cap"
          value={`$${(data.totalMarketCap / 1e12).toFixed(2)}T`}
          change={data.marketCapChange24h}
        />
        <StatCard 
          label="24h Volume"
          value={`$${(data.totalVolume24h / 1e9).toFixed(1)}B`}
        />
        <StatCard 
          label="BTC Dominance"
          value={`${data.btcDominance.toFixed(1)}%`}
        />
        <StatCard 
          label="Active Coins"
          value={data.activeCryptos.toLocaleString()}
        />
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopMovers title="🚀 Top Gainers" coins={data.topGainers} positive />
        <TopMovers title="📉 Top Losers" coins={data.topLosers} />
      </div>

      {/* Market Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">24h %</th>
              <th className="px-4 py-3 text-right">7d %</th>
              <th className="px-4 py-3 text-right">Market Cap</th>
              <th className="px-4 py-3 text-right">Volume (24h)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.coins.slice(0, 20).map((coin, i) => (
              <tr key={coin.symbol} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={coin.icon} alt="" className="w-6 h-6" />
                    <span className="font-medium">{coin.name}</span>
                    <span className="text-gray-400">{coin.symbol}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${coin.price.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right ${
                  coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </td>
                <td className={`px-4 py-3 text-right ${
                  coin.change7d >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {coin.change7d >= 0 ? '+' : ''}{coin.change7d.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right">
                  ${(coin.marketCap / 1e9).toFixed(2)}B
                </td>
                <td className="px-4 py-3 text-right">
                  ${(coin.volume24h / 1e9).toFixed(2)}B
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Fear & Greed
// ═══════════════════════════════════════════════════════════════

/**
 * Fear & Greed Index display
 */
export function FearGreedIndex() {
  const { value, classification, loading, error, history } = useFearGreed();

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded" />;
  if (error) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Fear & Greed Index</h3>
      
      {/* Gauge */}
      <div className="flex items-center justify-center mb-4">
        <FearGreedGauge value={value} size={200} />
      </div>
      
      {/* Current Value */}
      <div className="text-center mb-4">
        <div className="text-4xl font-bold">{value}</div>
        <div className={`text-lg font-medium ${
          classification === 'Extreme Fear' ? 'text-red-600' :
          classification === 'Fear' ? 'text-orange-500' :
          classification === 'Greed' ? 'text-green-500' :
          classification === 'Extreme Greed' ? 'text-green-600' :
          'text-gray-600'
        }`}>
          {classification}
        </div>
      </div>

      {/* History */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Yesterday</span>
          <span>{history.yesterday}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Last Week</span>
          <span>{history.lastWeek}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Last Month</span>
          <span>{history.lastMonth}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Price Charts
// ═══════════════════════════════════════════════════════════════

/**
 * Interactive price chart
 */
export function InteractivePriceChart() {
  const [symbol, setSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <select 
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="BTC">Bitcoin</option>
          <option value="ETH">Ethereum</option>
          <option value="SOL">Solana</option>
          <option value="XRP">XRP</option>
        </select>

        <div className="flex gap-1">
          {['24h', '7d', '30d', '90d', '1y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded ${
                timeframe === tf 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <PriceChart 
        symbol={symbol}
        timeframe={timeframe}
        height={400}
        showVolume
      />
    </div>
  );
}

/**
 * Mini sparkline charts
 */
export function SparklineCards() {
  const { prices } = usePrices({
    symbols: ['BTC', 'ETH', 'SOL', 'XRP'],
    includeSparkline: true,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {prices.map((coin) => (
        <div key={coin.symbol} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-bold">{coin.symbol}</div>
              <div className="text-lg font-mono">
                ${coin.price.toLocaleString()}
              </div>
            </div>
            <span className={`text-sm ${
              coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
            </span>
          </div>
          
          {/* Mini sparkline */}
          <div className="h-12">
            <PriceChart 
              symbol={coin.symbol}
              timeframe="24h"
              height={48}
              minimal
              color={coin.change24h >= 0 ? '#22c55e' : '#ef4444'}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, change }: { 
  label: string; 
  value: string; 
  change?: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function TopMovers({ title, coins, positive = false }: { 
  title: string; 
  coins: any[];
  positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="space-y-2">
        {coins.slice(0, 5).map((coin) => (
          <div key={coin.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={coin.icon} alt="" className="w-6 h-6" />
              <span className="font-medium">{coin.symbol}</span>
            </div>
            <span className={positive ? 'text-green-500' : 'text-red-500'}>
              {positive ? '+' : ''}{coin.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Full App
// ═══════════════════════════════════════════════════════════════

export default function MarketApp() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">💹 Market Dashboard</h1>
        
        {/* Price Ticker */}
        <div className="mb-8">
          <SimplePriceTicker />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <InteractivePriceChart />
            <SparklineCards />
            <MarketDashboard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FearGreedIndex />
            <CustomPrices />
          </div>
        </div>
      </div>
    </div>
  );
}
