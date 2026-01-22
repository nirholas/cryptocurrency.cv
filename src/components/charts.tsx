/**
 * Interactive Chart Components using Recharts
 * For price charts, volume, and analytics visualization
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Color palette for charts
const COLORS = {
  primary: '#f59e0b',
  secondary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  gray: '#6b7280',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface ChartProps {
  data: Record<string, unknown>[];
  height?: number;
  className?: string;
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// Price Line Chart
interface PriceChartProps extends ChartProps {
  dataKey?: string;
  showGrid?: boolean;
  color?: string;
}

export function PriceLineChart({
  data,
  height = 300,
  className,
  dataKey = 'price',
  showGrid = true,
  color = COLORS.primary,
}: PriceChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          )}
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Price Area Chart with gradient
interface AreaChartProps extends ChartProps {
  dataKey?: string;
  color?: string;
  showChange?: boolean;
}

export function PriceAreaChart({
  data,
  height = 300,
  className,
  dataKey = 'price',
  color = COLORS.primary,
}: AreaChartProps) {
  const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Volume Bar Chart
interface VolumeChartProps extends ChartProps {
  dataKey?: string;
}

export function VolumeChart({
  data,
  height = 200,
  className,
  dataKey = 'volume',
}: VolumeChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
              if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
              return `$${value.toLocaleString()}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={COLORS.secondary} opacity={0.8} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Multi-line comparison chart
interface ComparisonChartProps extends ChartProps {
  lines: { dataKey: string; name: string; color: string }[];
}

export function ComparisonChart({
  data,
  height = 300,
  className,
  lines,
}: ComparisonChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Portfolio Allocation Pie Chart
interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  className?: string;
  showLabel?: boolean;
}

export function AllocationPieChart({
  data,
  height = 300,
  className,
  showLabel = true,
}: PieChartProps) {
  const renderLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={showLabel ? renderLabel : undefined}
            labelLine={showLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline mini chart
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = COLORS.primary,
  className,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const trend = data[data.length - 1] >= data[0];
  const lineColor = trend ? COLORS.success : COLORS.danger;

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color || lineColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Activity Heatmap (simplified as bar chart)
interface HeatmapProps {
  data: { day: string; hour: number; value: number }[];
  height?: number;
  className?: string;
}

export function ActivityHeatmap({
  data,
  height = 200,
  className,
}: HeatmapProps) {
  // Group by hour
  const hourlyData = useMemo(() => {
    const grouped: Record<number, number> = {};
    data.forEach((item) => {
      grouped[item.hour] = (grouped[item.hour] || 0) + item.value;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      value: grouped[i] || 0,
    }));
  }, [data]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="hour"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={COLORS.primary} radius={[2, 2, 0, 0]}>
            {hourlyData.map((entry, index) => {
              const maxValue = Math.max(...hourlyData.map((d) => d.value));
              const opacity = entry.value / maxValue || 0.1;
              return <Cell key={index} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export colors for use elsewhere
export { COLORS, PIE_COLORS };
