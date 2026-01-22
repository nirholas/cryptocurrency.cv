'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  AreaChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';

// ============================================
// Types
// ============================================

export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'max';
export type ChartType = 'line' | 'area' | 'candlestick';

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'max' },
];

// ============================================
// Utility Functions
// ============================================

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatAxisTick(timestamp: number, dataLength: number): string {
  const date = new Date(timestamp);
  if (dataLength <= 48) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (dataLength <= 168) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatVolume(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ============================================
// Time Range Selector
// ============================================

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

export function TimeRangeSelector({ value, onChange, isLoading }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg" role="tablist">
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          disabled={isLoading}
          role="tab"
          aria-selected={value === range.value}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === range.value
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {range.label}
        </button>
      ))}
      {isLoading && (
        <div className="ml-2 w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

// ============================================
// Chart Type Selector
// ============================================

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  const types: { type: ChartType; label: string }[] = [
    { type: 'line', label: 'Line' },
    { type: 'area', label: 'Area' },
    { type: 'candlestick', label: 'Candle' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
      {types.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === type
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Chart Skeleton
// ============================================

export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full bg-gradient-to-b from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 dark:text-slate-500">Loading chart...</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Chart Error
// ============================================

export function ChartError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
      <svg className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}

// ============================================
// Custom Tooltip
// ============================================

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PricePoint }> }) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  const date = new Date(data.timestamp);

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[140px]">
      <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' '}
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(data.price)}</div>
      {data.volume && (
        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Vol: {formatVolume(data.volume)}
        </div>
      )}
    </div>
  );
}

// ============================================
// Price Chart (Line/Area)
// ============================================

interface PriceChartProps {
  data: PricePoint[];
  height?: number;
  type?: 'line' | 'area';
  showGrid?: boolean;
}

export function PriceChart({ data, height = 300, type = 'area', showGrid = true }: PriceChartProps) {
  const { isPositive, color, gradientId } = useMemo(() => {
    if (data.length < 2) return { isPositive: true, color: '#10b981', gradientId: 'priceGradient' };
    const start = data[0].price;
    const end = data[data.length - 1].price;
    const positive = end >= start;
    return {
      isPositive: positive,
      color: positive ? '#10b981' : '#ef4444',
      gradientId: `gradient-${positive ? 'up' : 'down'}`,
    };
  }, [data]);

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 100];
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [data]);

  if (data.length === 0) return <ChartSkeleton height={height} />;

  const ChartComponent = type === 'line' ? LineChart : AreaChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-slate-700" opacity={0.5} vertical={false} />
        )}
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => formatAxisTick(ts, data.length)}
          tick={{ fill: 'currentColor', fontSize: 11 }}
          className="text-gray-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          minTickGap={50}
        />
        <YAxis
          domain={yDomain}
          tickFormatter={formatPrice}
          tick={{ fill: 'currentColor', fontSize: 11 }}
          className="text-gray-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={data[0]?.price} stroke={color} strokeDasharray="3 3" opacity={0.5} />
        {type === 'area' ? (
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive animationDuration={500} />
        ) : (
          <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} isAnimationActive animationDuration={500} />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

// ============================================
// Volume Chart
// ============================================

interface VolumeChartProps {
  data: PricePoint[];
  height?: number;
}

export function VolumeChart({ data, height = 80 }: VolumeChartProps) {
  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      isUp: i === 0 || d.price >= data[i - 1].price,
    }));
  }, [data]);

  if (!data.some(d => d.volume)) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="timestamp" tick={false} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatVolume} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-gray-400 dark:text-slate-500" axisLine={false} tickLine={false} width={70} />
        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.isUp ? '#10b981' : '#ef4444'} opacity={0.6} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Mini Chart (Sparkline)
// ============================================

interface MiniChartProps {
  data: PricePoint[];
  width?: number;
  height?: number;
}

export function MiniChart({ data, width = 100, height = 32 }: MiniChartProps) {
  const color = useMemo(() => {
    if (data.length < 2) return '#10b981';
    return data[data.length - 1].price >= data[0].price ? '#10b981' : '#ef4444';
  }, [data]);

  if (data.length < 2) return <div style={{ width, height }} className="bg-gray-100 dark:bg-slate-800 rounded" />;

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`mini-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill={`url(#mini-${color})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Main CoinChart Component
// ============================================

interface CoinChartProps {
  coinId: string;
  coinName?: string;
  coinSymbol?: string;
  initialTimeRange?: TimeRange;
  initialChartType?: ChartType;
  showVolume?: boolean;
  showControls?: boolean;
  height?: number;
  className?: string;
}

export function CoinChart({
  coinId,
  coinName,
  coinSymbol,
  initialTimeRange = '24h',
  initialChartType = 'area',
  showVolume = true,
  showControls = true,
  height = 400,
  className = '',
}: CoinChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/charts?coin=${coinId}&range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      const json = await res.json();
      setData(json.prices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setIsLoading(false);
    }
  }, [coinId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    if (data.length < 2) return null;
    const prices = data.map(d => d.price);
    const start = prices[0];
    const current = prices[prices.length - 1];
    const change = current - start;
    const changePercent = (change / start) * 100;
    return {
      current,
      change,
      changePercent,
      high: Math.max(...prices),
      low: Math.min(...prices),
      isPositive: change >= 0,
    };
  }, [data]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {coinName && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {coinName}
                {coinSymbol && <span className="text-sm font-normal text-gray-500 dark:text-slate-400">{coinSymbol.toUpperCase()}</span>}
              </h3>
            )}
            {stats && (
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.current)}</span>
                <span className={`text-sm font-medium ${stats.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          {showControls && (
            <div className="flex flex-wrap items-center gap-3">
              <ChartTypeSelector value={chartType} onChange={setChartType} />
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {isLoading ? (
          <ChartSkeleton height={height} />
        ) : error ? (
          <ChartError error={error} onRetry={fetchData} />
        ) : (
          <>
            <PriceChart data={data} height={height} type={chartType === 'candlestick' ? 'line' : chartType} />
            {showVolume && <VolumeChart data={data} />}
          </>
        )}
      </div>

      {/* Footer */}
      {stats && !isLoading && !error && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span><span className="font-medium">H:</span> {formatPrice(stats.high)}</span>
              <span><span className="font-medium">L:</span> {formatPrice(stats.low)}</span>
            </div>
            <span>{TIME_RANGES.find(r => r.value === timeRange)?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoinChart;
