'use client';

import { useState, useEffect, useCallback } from 'react';

interface FundingRate {
  exchange: string;
  rate: number;
  nextFundingTime?: string;
  predictedRate?: number;
  interval: string;
}

interface FundingRatesData {
  rates: FundingRate[];
  averageRate: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface CoinFundingRatesProps {
  coinId: string;
  coinSymbol: string;
}

function formatRate(rate: number): string {
  const pct = rate * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(4)}%`;
}

function getCountdown(nextFundingTime: string | undefined): string {
  if (!nextFundingTime) return '--:--:--';
  const diff = new Date(nextFundingTime).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CoinFundingRates({ coinId, coinSymbol }: CoinFundingRatesProps) {
  const [data, setData] = useState<FundingRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('--:--:--');
  const [nextTime, setNextTime] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/funding?symbol=${coinSymbol.toUpperCase()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      const dashboard = result.data || result;
      const crossExchange = dashboard.crossExchange || [];

      // Find the coin in crossExchange data, or fall back to topPositive/topNegative
      let coinRates: FundingRate[] = [];

      // Try crossExchange first
      const matched = crossExchange.find(
        (c: Record<string, unknown>) =>
          (c.symbol as string)?.toUpperCase()?.includes(coinSymbol.toUpperCase())
      );

      if (matched && matched.exchanges) {
        coinRates = (matched.exchanges as Record<string, unknown>[]).map((e) => ({
          exchange: (e.exchange as string) || 'Unknown',
          rate: Number(e.fundingRate || e.rate || 0),
          nextFundingTime: e.nextFundingTime as string | undefined,
          predictedRate: e.predictedRate ? Number(e.predictedRate) : undefined,
          interval: (e.interval as string) || '8h',
        }));
      }

      // Fallback: topPositive + topNegative
      if (coinRates.length === 0) {
        const all = [...(dashboard.topPositive || []), ...(dashboard.topNegative || [])];
        coinRates = all
          .filter((r: Record<string, unknown>) =>
            (r.symbol as string)?.toUpperCase()?.includes(coinSymbol.toUpperCase())
          )
          .map((r: Record<string, unknown>) => ({
            exchange: (r.exchange as string) || 'Unknown',
            rate: Number(r.fundingRate || r.rate || 0),
            nextFundingTime: r.nextFundingTime as string | undefined,
            predictedRate: r.predictedRate ? Number(r.predictedRate) : undefined,
            interval: (r.interval as string) || '8h',
          }));
      }

      const avgRate = coinRates.length > 0
        ? coinRates.reduce((sum, r) => sum + r.rate, 0) / coinRates.length
        : 0;

      const sentiment: 'bullish' | 'bearish' | 'neutral' =
        avgRate > 0.0001 ? 'bullish' : avgRate < -0.0001 ? 'bearish' : 'neutral';

      const firstNext = coinRates.find(r => r.nextFundingTime)?.nextFundingTime;
      setNextTime(firstNext);

      setData({
        rates: coinRates,
        averageRate: avgRate,
        sentiment,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [coinSymbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!nextTime) return;
    const tick = () => setCountdown(getCountdown(nextTime));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextTime]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
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
          <span className="text-xl">📊</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Funding Rates</h3>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition">Retry</button>
        </div>
      </div>
    );
  }

  const sentimentColors = {
    bullish: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    bearish: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    neutral: { bg: 'bg-gray-100 dark:bg-slate-700/50', text: 'text-gray-600 dark:text-slate-400' },
  };

  const sc = data ? sentimentColors[data.sentiment] : sentimentColors.neutral;

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Funding Rates</h3>
          </div>
          {data && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${sc.bg} ${sc.text}`}>
              {data.sentiment}
            </span>
          )}
        </div>

        {/* Countdown */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">Next funding:</span>
            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{countdown}</span>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">Avg rate:</span>
              <span className={`font-mono text-sm font-bold ${data.averageRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatRate(data.averageRate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rates list */}
      {data && data.rates.length > 0 ? (
        <div className="px-6 pb-4 space-y-2">
          {data.rates.map((rate, i) => {
            const barWidth = Math.min(Math.abs(rate.rate) * 10000, 100);
            const positive = rate.rate >= 0;
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <span className="text-sm font-medium text-gray-900 dark:text-white w-24 truncate">{rate.exchange}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${positive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`font-mono text-sm font-medium w-20 text-right ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatRate(rate.rate)}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 w-8">{rate.interval}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">No funding rate data for {coinSymbol.toUpperCase()}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Positive rates = longs pay shorts (bullish market). Refreshes every 60s.
        </p>
      </div>
    </div>
  );
}
