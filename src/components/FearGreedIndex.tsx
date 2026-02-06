'use client';

import { useState, useEffect } from 'react';

interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: number;
  timeUntilUpdate: string;
}

interface FearGreedResponse {
  current: FearGreedData;
  historical: FearGreedData[];
  trend: {
    direction: 'improving' | 'worsening' | 'stable';
    change7d: number;
    change30d: number;
    averageValue7d: number;
    averageValue30d: number;
  };
  breakdown: {
    volatility: { value: number; weight: number };
    marketMomentum: { value: number; weight: number };
    socialMedia: { value: number; weight: number };
    surveys: { value: number; weight: number };
    dominance: { value: number; weight: number };
    trends: { value: number; weight: number };
  };
}

interface FearGreedIndexProps {
  showBreakdown?: boolean;
  showHistory?: boolean;
  historyDays?: number;
  size?: 'sm' | 'md' | 'lg' | string;
  showLabel?: boolean;
}

const CLASSIFICATIONS = {
  'Extreme Fear': { color: 'text-red-600', bgColor: 'bg-red-500', description: 'Investors are very fearful - potential buying opportunity' },
  'Fear': { color: 'text-orange-600', bgColor: 'bg-orange-500', description: 'Market sentiment is fearful' },
  'Neutral': { color: 'text-yellow-600', bgColor: 'bg-yellow-500', description: 'Market sentiment is balanced' },
  'Greed': { color: 'text-lime-600', bgColor: 'bg-lime-500', description: 'Market sentiment is greedy' },
  'Extreme Greed': { color: 'text-green-600', bgColor: 'bg-green-500', description: 'Investors are very greedy - potential selling opportunity' },
};

/**
 * Fear & Greed Index Component
 * 
 * Displays the current crypto market sentiment index with
 * historical trend and breakdown analysis.
 */
export function FearGreedIndex({
  showBreakdown = true,
  showHistory = true,
  historyDays = 14,
}: FearGreedIndexProps) {
  const [data, setData] = useState<FearGreedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFearGreedData();
    const interval = setInterval(fetchFearGreedData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [historyDays]);

  async function fetchFearGreedData() {
    try {
      setError(null);
      const response = await fetch(`/api/fear-greed?days=${historyDays}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch Fear & Greed data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          </div>
          <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Failed to Load Fear & Greed Index
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {error || 'Unknown error'}
          </p>
          <button
            onClick={fetchFearGreedData}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { current, historical, trend, breakdown } = data;
  const classification = CLASSIFICATIONS[current.valueClassification as keyof typeof CLASSIFICATIONS] || CLASSIFICATIONS['Neutral'];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Crypto Fear & Greed Index
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Market sentiment indicator based on multiple factors
        </p>
      </div>

      {/* Main Gauge */}
      <div className="p-6">
        <div className="flex flex-col items-center">
          {/* Circular Gauge */}
          <div className="relative w-48 h-48 mb-4">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {/* Background arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                className="text-neutral-200 dark:text-neutral-700"
                strokeDasharray={`${Math.PI * 160 * 0.75} ${Math.PI * 160 * 0.25}`}
              />
              {/* Value arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="url(#fearGreedGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(current.value / 100) * Math.PI * 160 * 0.75} ${Math.PI * 160}`}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="75%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${classification.color}`}>
                {current.value}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {current.valueClassification}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-xs mb-4">
            {classification.description}
          </p>

          {/* Trend indicator */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 dark:text-neutral-400">7d:</span>
              <span className={`font-medium ${trend.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change7d >= 0 ? '+' : ''}{trend.change7d}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 dark:text-neutral-400">30d:</span>
              <span className={`font-medium ${trend.change30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change30d >= 0 ? '+' : ''}{trend.change30d}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 dark:text-neutral-400">Trend:</span>
              <span className={`font-medium ${
                trend.direction === 'improving' ? 'text-green-600' : 
                trend.direction === 'worsening' ? 'text-red-600' : 'text-neutral-600'
              }`}>
                {trend.direction === 'improving' ? '↗ Improving' :
                 trend.direction === 'worsening' ? '↘ Worsening' : '→ Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && breakdown && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            Sentiment Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, { value, weight }]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-neutral-500 dark:text-neutral-400 w-32 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()} ({weight}%)
                </span>
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      value < 30 ? 'bg-red-500' :
                      value < 50 ? 'bg-orange-500' :
                      value < 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-white w-8 text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Chart */}
      {showHistory && historical && historical.length > 0 && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            Historical Trend ({historyDays} days)
          </h4>
          <div className="h-24 flex items-end gap-1">
            {historical.slice(0, historyDays).reverse().map((day, index) => {
              const height = (day.value / 100) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    backgroundColor: day.value < 30 ? '#ef4444' :
                      day.value < 50 ? '#f97316' :
                      day.value < 70 ? '#eab308' :
                      '#22c55e',
                  }}
                  title={`${new Date(day.timestamp).toLocaleDateString()}: ${day.value} (${day.valueClassification})`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{historyDays}d ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Data from Alternative.me • Updates every hour • Next update: {current.timeUntilUpdate}
      </div>
    </div>
  );
}

export default FearGreedIndex;
