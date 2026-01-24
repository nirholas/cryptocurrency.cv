'use client';

import { useState, useEffect } from 'react';
import { FearGreedIndex } from '@/components/FearGreedIndex';

interface FearGreedData {
  current: {
    value: number;
    valueClassification: string;
    timestamp: number;
  };
  historical: Array<{
    value: number;
    valueClassification: string;
    timestamp: number;
  }>;
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

export default function FearGreedDashboard() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/fear-greed?days=30');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch Fear & Greed data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        Unable to load Fear & Greed data. Please try again later.
      </div>
    );
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'improving':
        return 'text-green-400';
      case 'worsening':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getValueColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-400';
    if (value <= 55) return 'text-yellow-400';
    if (value <= 75) return 'text-green-400';
    return 'text-green-500';
  };

  return (
    <div className="space-y-8">
      {/* Main Gauge */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-shrink-0">
            <FearGreedIndex showBreakdown showHistory historyDays={30} />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {data.current.valueClassification}
              </h2>
              <p className={`text-4xl font-bold ${getValueColor(data.current.value)}`}>
                {data.current.value}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">7-Day Trend</div>
                <div className={`font-bold ${getTrendColor(data.trend.direction)}`}>
                  {data.trend.change7d > 0 ? '+' : ''}
                  {data.trend.change7d.toFixed(1)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">30-Day Trend</div>
                <div className={`font-bold ${data.trend.change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.trend.change30d > 0 ? '+' : ''}
                  {data.trend.change30d.toFixed(1)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm">Direction</div>
                <div className={`font-bold capitalize ${getTrendColor(data.trend.direction)}`}>
                  {data.trend.direction}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Index Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.breakdown).map(([key, item]) => (
            <div key={key} className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-gray-500 text-sm">{item.weight}% weight</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.value <= 25
                        ? 'bg-red-500'
                        : item.value <= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className={`font-bold ${getValueColor(item.value)}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">30-Day History</h3>
        <div className="h-48 flex items-end gap-1">
          {data.historical.slice(-30).map((day, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all hover:opacity-80"
              style={{
                height: `${day.value}%`,
                backgroundColor:
                  day.value <= 25
                    ? '#ef4444'
                    : day.value <= 45
                    ? '#f97316'
                    : day.value <= 55
                    ? '#eab308'
                    : day.value <= 75
                    ? '#22c55e'
                    : '#16a34a',
              }}
              title={`${new Date(day.timestamp * 1000).toLocaleDateString()}: ${day.value} (${day.valueClassification})`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-gray-500 text-xs">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* What It Means */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">What Does This Mean?</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
            <div className="text-2xl">😱</div>
            <div>
              <div className="font-bold text-red-400">Extreme Fear (0-24)</div>
              <div className="text-gray-400 text-sm">
                Investors are very worried. Could be a buying opportunity.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg">
            <div className="text-2xl">😰</div>
            <div>
              <div className="font-bold text-orange-400">Fear (25-44)</div>
              <div className="text-gray-400 text-sm">
                Market is fearful. Consider accumulating carefully.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
            <div className="text-2xl">😐</div>
            <div>
              <div className="font-bold text-yellow-400">Neutral (45-55)</div>
              <div className="text-gray-400 text-sm">
                Market is balanced between fear and greed.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl">🤑</div>
            <div>
              <div className="font-bold text-green-400">Greed (56-75)</div>
              <div className="text-gray-400 text-sm">
                Investors are getting greedy. Be cautious.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
