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
 * Blockchain React Components
 *
 * React components for Bitcoin stats, gas prices, L2 data,
 * Solana tokens, token unlocks, and NFT market data.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

function useApi(endpoint, params = {}, refreshInterval = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryString = useMemo(() => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    return searchParams.toString();
  }, [JSON.stringify(params)]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, queryString]);

  useEffect(() => {
    fetchData();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

// ═══════════════════════════════════════════════════════════════
// Bitcoin Stats Widget
// ═══════════════════════════════════════════════════════════════

export function BitcoinStats() {
  const { data, loading, error } = useApi('/api/bitcoin/stats', {}, 60000);

  if (loading) return <div className="animate-pulse">Loading Bitcoin stats...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg text-white p-6">
      <h2 className="text-xl font-bold mb-4">₿ Bitcoin Network</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-orange-100 text-sm">Block Height</div>
          <div className="text-2xl font-bold">{data?.blockHeight?.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-orange-100 text-sm">Hashrate</div>
          <div className="text-2xl font-bold">{(data?.hashrate / 1e18)?.toFixed(1)} EH/s</div>
        </div>
        <div>
          <div className="text-orange-100 text-sm">Difficulty</div>
          <div className="text-lg font-semibold">{(data?.difficulty / 1e12)?.toFixed(2)}T</div>
        </div>
        <div>
          <div className="text-orange-100 text-sm">Mempool</div>
          <div className="text-lg font-semibold">{data?.mempoolSize?.toLocaleString()} tx</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Gas Price Tracker
// ═══════════════════════════════════════════════════════════════

export function GasTracker() {
  const [chain, setChain] = useState('ethereum');
  const { data, loading, error } = useApi('/api/gas', { chain }, 15000);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">⛽ Gas Prices</h2>
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
      </div>

      {loading && <div className="animate-pulse">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {data && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Slow', value: data.slow, color: 'text-green-600' },
            { label: 'Standard', value: data.standard, color: 'text-blue-600' },
            { label: 'Fast', value: data.fast, color: 'text-orange-600' },
            { label: 'Instant', value: data.instant, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 bg-gray-50 rounded">
              <div className="text-gray-500 text-xs">{label}</div>
              <div className={`text-xl font-bold ${color}`}>
                {value?.toFixed(0)}
              </div>
              <div className="text-gray-400 text-xs">Gwei</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// L2 Projects Table
// ═══════════════════════════════════════════════════════════════

export function L2Projects() {
  const { data, loading, error } = useApi('/api/l2/projects');

  if (loading) return <div className="animate-pulse">Loading L2 projects...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const projects = Array.isArray(data) ? data : data?.projects || [];

  return (
    <div className="bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold p-4 border-b">Layer 2 Projects</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Project</th>
              <th className="px-4 py-3 text-left text-sm">Type</th>
              <th className="px-4 py-3 text-right text-sm">TVL</th>
              <th className="px-4 py-3 text-right text-sm">TPS</th>
              <th className="px-4 py-3 text-center text-sm">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.type}</td>
                <td className="px-4 py-3 text-right">
                  ${(p.tvl / 1e9)?.toFixed(2)}B
                </td>
                <td className="px-4 py-3 text-right">{p.tps?.toFixed(1)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    p.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    p.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.riskLevel}
                  </span>
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
// Token Unlocks Timeline
// ═══════════════════════════════════════════════════════════════

export function TokenUnlocks() {
  const { data, loading, error } = useApi('/api/token-unlocks');

  if (loading) return <div className="animate-pulse">Loading token unlocks...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const unlocks = Array.isArray(data) ? data : data?.unlocks || [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">🔓 Upcoming Token Unlocks</h2>
      <div className="space-y-3">
        {unlocks.slice(0, 10).map((unlock, i) => (
          <div key={i} className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="font-semibold">{unlock.token}</span>
              <div className="text-gray-500 text-sm">
                {new Date(unlock.date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-red-600">
                ${((unlock.valueUsd || unlock.amount * unlock.price) / 1e6)?.toFixed(1)}M
              </div>
              <div className="text-gray-500 text-sm">
                {unlock.amount?.toLocaleString()} tokens
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NFT Market Overview
// ═══════════════════════════════════════════════════════════════

export function NftMarketOverview() {
  const { data, loading, error } = useApi('/api/nft/market');
  const { data: trending } = useApi('/api/nft/collections/trending');

  if (loading) return <div className="animate-pulse">Loading NFT market...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const collections = Array.isArray(trending) ? trending : trending?.collections || [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">🎨 NFT Market</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-purple-50 rounded p-3 text-center">
          <div className="text-gray-500 text-xs">24h Volume</div>
          <div className="text-xl font-bold text-purple-700">
            ${((data?.totalVolume24h || 0) / 1e6).toFixed(1)}M
          </div>
        </div>
        <div className="bg-purple-50 rounded p-3 text-center">
          <div className="text-gray-500 text-xs">Sales</div>
          <div className="text-xl font-bold text-purple-700">
            {data?.totalSales24h?.toLocaleString() || '—'}
          </div>
        </div>
        <div className="bg-purple-50 rounded p-3 text-center">
          <div className="text-gray-500 text-xs">Avg Price</div>
          <div className="text-xl font-bold text-purple-700">
            ${data?.averagePrice?.toFixed(2) || '—'}
          </div>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Trending Collections</h3>
      <div className="space-y-2">
        {collections.slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="font-medium">{c.collection || c.name}</span>
            <div className="flex gap-4 text-gray-600">
              <span>Floor: {c.floorPrice?.toFixed(3)} ETH</span>
              <span className={c.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                {c.change24h >= 0 ? '+' : ''}{c.change24h?.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Complete Blockchain Dashboard
// ═══════════════════════════════════════════════════════════════

export default function BlockchainDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BitcoinStats />
        <GasTracker />
      </div>
      <L2Projects />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUnlocks />
        <NftMarketOverview />
      </div>
    </div>
  );
}
