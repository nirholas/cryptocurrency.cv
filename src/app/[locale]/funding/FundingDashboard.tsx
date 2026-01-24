'use client';

import { useState, useEffect } from 'react';

interface FundingRate {
  symbol: string;
  exchange: string;
  rate: number;
  nextFundingTime: number;
  predicted?: number;
}

interface FundingData {
  rates: FundingRate[];
  summary: {
    averageFunding: number;
    highestFunding: { symbol: string; rate: number };
    lowestFunding: { symbol: string; rate: number };
  };
  arbitrage?: Array<{
    symbol: string;
    longExchange: string;
    shortExchange: string;
    spread: number;
  }>;
}

export default function FundingDashboard() {
  const [data, setData] = useState<FundingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rate' | 'symbol'>('rate');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (exchange !== 'all') params.set('exchange', exchange);
        const res = await fetch(`/api/funding?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch funding data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [exchange]);

  const getRateColor = (rate: number) => {
    if (rate > 0.05) return 'text-green-400';
    if (rate > 0) return 'text-green-300';
    if (rate < -0.05) return 'text-red-400';
    if (rate < 0) return 'text-red-300';
    return 'text-gray-400';
  };

  const formatRate = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        Unable to load funding data. Please try again later.
      </div>
    );
  }

  const sortedRates = [...data.rates].sort((a, b) => {
    if (sortBy === 'rate') return Math.abs(b.rate) - Math.abs(a.rate);
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Average Funding</div>
          <div className={`text-2xl font-bold ${getRateColor(data.summary.averageFunding)}`}>
            {formatRate(data.summary.averageFunding)}
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Highest Funding</div>
          <div className="text-2xl font-bold text-green-400">
            {data.summary.highestFunding.symbol}: {formatRate(data.summary.highestFunding.rate)}
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="text-gray-400 text-sm mb-1">Lowest Funding</div>
          <div className="text-2xl font-bold text-red-400">
            {data.summary.lowestFunding.symbol}: {formatRate(data.summary.lowestFunding.rate)}
          </div>
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      {data.arbitrage && data.arbitrage.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
          <h3 className="text-lg font-bold text-purple-400 mb-3">🎯 Funding Arbitrage</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.arbitrage.slice(0, 6).map((arb, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                <div className="font-bold text-white">{arb.symbol}</div>
                <div className="text-sm text-gray-400">
                  Long {arb.longExchange} / Short {arb.shortExchange}
                </div>
                <div className="text-green-400 font-medium">
                  Spread: {formatRate(arb.spread)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="all">All Exchanges</option>
          <option value="binance">Binance</option>
          <option value="bybit">Bybit</option>
          <option value="okx">OKX</option>
          <option value="hyperliquid">Hyperliquid</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'rate' | 'symbol')}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="rate">Sort by Rate</option>
          <option value="symbol">Sort by Symbol</option>
        </select>
      </div>

      {/* Rates Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Symbol</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Exchange</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Rate (8h)</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">APR</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Next Funding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sortedRates.slice(0, 50).map((rate, i) => (
              <tr key={i} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium text-white">{rate.symbol}</td>
                <td className="px-4 py-3 text-gray-300 capitalize">{rate.exchange}</td>
                <td className={`px-4 py-3 text-right font-mono ${getRateColor(rate.rate)}`}>
                  {formatRate(rate.rate)}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${getRateColor(rate.rate)}`}>
                  {formatRate(rate.rate * 3 * 365)}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {new Date(rate.nextFundingTime).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
