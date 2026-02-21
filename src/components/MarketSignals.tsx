'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FearGreedCurrent {
  value: number;
  valueClassification: string;
}

interface TradingSignal {
  ticker: string;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  timeframe: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface LiquidationTotals {
  totalLongs: number;
  totalShorts: number;
  totalUsd: number;
}

interface LiquidationEvent {
  symbol: string;
  side: 'long' | 'short';
  amount: number;
}

interface MarketSignalsData {
  fearGreed: FearGreedCurrent | null;
  signals: TradingSignal[];
  liquidations: LiquidationTotals | null;
  topLiquidation: LiquidationEvent | null;
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: 'Strong Buy', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  buy: { label: 'Buy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  hold: { label: 'Hold', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/50' },
  sell: { label: 'Sell', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  strong_sell: { label: 'Strong Sell', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

function FearGreedGauge({ value, classification }: { value: number; classification: string }) {
  const color = value < 25 ? 'text-red-500' : value < 45 ? 'text-orange-500' : value < 55 ? 'text-yellow-500' : value < 75 ? 'text-lime-500' : 'text-green-500';
  const ringColor = value < 25 ? 'stroke-red-500' : value < 45 ? 'stroke-orange-500' : value < 55 ? 'stroke-yellow-500' : value < 75 ? 'stroke-lime-500' : 'stroke-green-500';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-slate-600" />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="8"
            className={ringColor}
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 mt-2">{classification}</span>
    </div>
  );
}

export function MarketSignals() {
  const [data, setData] = useState<MarketSignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [fgRes, sigRes, liqRes] = await Promise.all([
          fetch('/api/fear-greed?days=1').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/signals?limit=3').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/liquidations').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const topLiq = liqRes?.recentEvents?.[0] || null;

        setData({
          fearGreed: fgRes?.current || null,
          signals: sigRes?.signals?.slice(0, 3) || [],
          liquidations: liqRes?.totals || null,
          topLiquidation: topLiq ? { symbol: topLiq.symbol, side: topLiq.side, amount: topLiq.amount } : null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="mb-10" aria-label="Market Signals">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Market Signals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-28 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) return null;

  return (
    <section className="mb-10" aria-label="Market Signals">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Market Signals</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fear & Greed */}
        <Link
          href="/fear-greed"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Fear & Greed Index</h3>
          {data.fearGreed ? (
            <FearGreedGauge value={data.fearGreed.value} classification={data.fearGreed.valueClassification} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Unavailable</p>
          )}
        </Link>

        {/* Trading Signals */}
        <Link
          href="/signals"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Trading Signals</h3>
          {data.signals.length > 0 ? (
            <div className="space-y-3">
              {data.signals.map((sig, i) => {
                const cfg = signalConfig[sig.signal] || signalConfig.hold;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{sig.ticker}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{sig.confidence}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">No signals available</p>
          )}
        </Link>

        {/* Liquidations */}
        <Link
          href="/liquidations"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Liquidations (24h)</h3>
          {data.liquidations ? (
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUsd(data.liquidations.totalUsd)}
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Longs: </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{formatUsd(data.liquidations.totalLongs)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Shorts: </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{formatUsd(data.liquidations.totalShorts)}</span>
                </div>
              </div>
              {data.topLiquidation && (
                <div className="text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-700">
                  Largest: {data.topLiquidation.symbol} {data.topLiquidation.side} {formatUsd(data.topLiquidation.amount)}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Unavailable</p>
          )}
        </Link>
      </div>
    </section>
  );
}
