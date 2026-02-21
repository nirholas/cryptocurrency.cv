'use client';

import { useState, useEffect, useCallback } from 'react';

interface ArbitrageOpportunity {
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  spreadPercent: number;
  potentialProfit: number;
  volume24h?: number;
}

interface ArbitrageData {
  opportunities: ArbitrageOpportunity[];
  bestSpread: number;
}

interface CoinArbitrageOpportunitiesProps {
  coinId: string;
  coinSymbol: string;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export function CoinArbitrageOpportunities({ coinId, coinSymbol }: CoinArbitrageOpportunitiesProps) {
  const [data, setData] = useState<ArbitrageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/arbitrage?symbol=${coinSymbol.toUpperCase()}&limit=10`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      const opps = result.data?.opportunities || [];
      const parsed: ArbitrageOpportunity[] = opps.slice(0, 8).map((o: Record<string, unknown>) => ({
        buyExchange: (o.buyExchange as string) || (o.lowExchange as string) || 'Unknown',
        buyPrice: Number(o.buyPrice || o.lowPrice || 0),
        sellExchange: (o.sellExchange as string) || (o.highExchange as string) || 'Unknown',
        sellPrice: Number(o.sellPrice || o.highPrice || 0),
        spreadPercent: Number(o.spreadPercent || o.profitPercent || 0),
        potentialProfit: Number(o.potentialProfit || 0),
        volume24h: o.volume24h ? Number(o.volume24h) : undefined,
      }));

      parsed.sort((a, b) => b.spreadPercent - a.spreadPercent);

      setData({
        opportunities: parsed,
        bestSpread: parsed.length > 0 ? parsed[0].spreadPercent : 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [coinSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">💰</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Arbitrage Opportunities</h3>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Arbitrage</h3>
          </div>
          {data && data.bestSpread > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              Best: {data.bestSpread.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {data && data.opportunities.length > 0 ? (
        <div className="px-6 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-slate-400 uppercase">
                  <th className="text-left pb-2 font-medium">Buy</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-left pb-2 font-medium pl-4">Sell</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Spread</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data.opportunities.map((opp, i) => {
                  const spreadColor = opp.spreadPercent > 2 ? 'text-green-600 dark:text-green-400 font-bold'
                    : opp.spreadPercent > 1 ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400';
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="py-2 text-gray-900 dark:text-white font-medium">{opp.buyExchange}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-slate-300">{formatPrice(opp.buyPrice)}</td>
                      <td className="py-2 text-gray-900 dark:text-white font-medium pl-4">{opp.sellExchange}</td>
                      <td className="py-2 text-right text-gray-700 dark:text-slate-300">{formatPrice(opp.sellPrice)}</td>
                      <td className={`py-2 text-right ${spreadColor}`}>{opp.spreadPercent.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">No arbitrage opportunities found for {coinSymbol.toUpperCase()}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          ⚠️ Prices may vary. Fees not included. Not financial advice. Refreshes every 30s.
        </p>
      </div>
    </div>
  );
}
