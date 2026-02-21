'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PortfolioDataPoint {
  date: string;
  value: number;
  change: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
  timeframe?: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

export function PortfolioChart({ data, timeframe = '30d' }: PortfolioChartProps) {
  const [showChange, setShowChange] = useState(false);
  
  const filteredData = useMemo(() => {
    const now = Date.now();
    const cutoffs: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    return data.filter(d => now - new Date(d.date).getTime() < cutoffs[timeframe]);
  }, [data, timeframe]);
  
  const isPositive = filteredData.length > 1 && 
    filteredData[filteredData.length - 1].value > filteredData[0].value;
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Portfolio Performance
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChange(false)}
            className={`px-3 py-1 text-sm rounded-lg ${!showChange ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
          >
            Value
          </button>
          <button
            onClick={() => setShowChange(true)}
            className={`px-3 py-1 text-sm rounded-lg ${showChange ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
          >
            Change %
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={showChange ? (v) => `${v}%` : formatValue}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={((value: number | string | undefined) => [
                value !== undefined
                  ? (showChange ? `${Number(value).toFixed(2)}%` : formatValue(value as number))
                  : '',
                showChange ? 'Change' : 'Value'
              ]) as any}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey={showChange ? 'change' : 'value'}
              stroke={isPositive ? '#10b981' : '#ef4444'}
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
