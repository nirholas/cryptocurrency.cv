'use client';

import { useState, useMemo } from 'react';
import { usePortfolio } from './PortfolioProvider';

interface DataPoint {
  date: string;
  value: number;
  change: number;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

/**
 * Portfolio Performance Chart
 * 
 * Displays portfolio value over time with interactive time range selection.
 * Shows gain/loss compared to starting value.
 */
export function PerformanceChart() {
  const { holdings, totalValue } = usePortfolio();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Generate mock historical data based on current holdings
  const chartData = useMemo(() => {
    const now = Date.now();
    const ranges: Record<TimeRange, { days: number; interval: number }> = {
      '1D': { days: 1, interval: 1 }, // hourly
      '1W': { days: 7, interval: 6 }, // 4 per day
      '1M': { days: 30, interval: 24 }, // daily
      '3M': { days: 90, interval: 72 }, // every 3 days
      '1Y': { days: 365, interval: 168 }, // weekly
      'ALL': { days: 730, interval: 336 }, // bi-weekly
    };

    const { days, interval } = ranges[timeRange];
    const points: DataPoint[] = [];
    const hoursBack = days * 24;

    // Generate realistic-looking price movement
    let baseValue = totalValue * (0.7 + Math.random() * 0.2); // Start 70-90% of current
    const volatility = 0.02; // 2% daily volatility

    for (let h = hoursBack; h >= 0; h -= interval) {
      const date = new Date(now - h * 60 * 60 * 1000);
      
      // Random walk with slight upward bias
      const change = (Math.random() - 0.48) * volatility * baseValue;
      baseValue = Math.max(baseValue + change, baseValue * 0.5);
      
      // Approach current value as we get closer to now
      if (h < interval * 5) {
        baseValue = baseValue + (totalValue - baseValue) * ((interval * 5 - h) / (interval * 5));
      }

      points.push({
        date: date.toISOString(),
        value: baseValue,
        change: ((baseValue - points[0]?.value || baseValue) / (points[0]?.value || baseValue)) * 100,
      });
    }

    // Ensure last point is current value
    if (points.length > 0) {
      points[points.length - 1].value = totalValue;
      points[points.length - 1].change = 
        ((totalValue - points[0].value) / points[0].value) * 100;
    }

    return points;
  }, [totalValue, timeRange]);

  const startValue = chartData[0]?.value || 0;
  const endValue = chartData[chartData.length - 1]?.value || totalValue;
  const totalChange = endValue - startValue;
  const totalChangePercent = startValue > 0 ? (totalChange / startValue) * 100 : 0;
  const isPositive = totalChange >= 0;

  // Chart dimensions
  const width = 100; // percentage
  const height = 200;
  const padding = { top: 20, right: 10, bottom: 30, left: 60 };

  // Calculate scales
  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values) * 0.98;
  const maxValue = Math.max(...values) * 1.02;
  const valueRange = maxValue - minValue || 1;

  // Generate SVG path
  const pathData = chartData
    .map((point, i) => {
      const x = (i / (chartData.length - 1)) * (100 - 15) + 12; // percentage
      const y = height - padding.bottom - ((point.value - minValue) / valueRange) * (height - padding.top - padding.bottom);
      return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
    })
    .join(' ');

  // Area path for gradient fill
  const areaPath = `${pathData} L 97% ${height - padding.bottom} L 12% ${height - padding.bottom} Z`;

  const formatValue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Portfolio Performance
        </h3>
        <div className="flex items-center justify-center h-48 text-neutral-500">
          Add holdings to see performance chart
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Portfolio Performance
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatValue(hoveredPoint?.value ?? endValue)}
            </span>
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}{formatValue(totalChange)} ({totalChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          className="w-full h-full"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            const value = maxValue - ratio * valueRange;
            return (
              <g key={ratio}>
                <line
                  x1="12%"
                  y1={y}
                  x2="97%"
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  className="text-neutral-400"
                />
                <text
                  x="10%"
                  y={y + 4}
                  textAnchor="end"
                  className="text-[8px] fill-neutral-500"
                >
                  {formatValue(value)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#portfolioGradient)" />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Interactive overlay */}
          {chartData.map((point, i) => {
            const x = (i / (chartData.length - 1)) * (100 - 15) + 12;
            const y = height - padding.bottom - ((point.value - minValue) / valueRange) * (height - padding.top - padding.bottom);
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredPoint(point)}
                className="cursor-crosshair"
              >
                <rect
                  x={`${x - 2}%`}
                  y={padding.top}
                  width="4%"
                  height={height - padding.top - padding.bottom}
                  fill="transparent"
                />
                {hoveredPoint === point && (
                  <>
                    <line
                      x1={`${x}%`}
                      y1={padding.top}
                      x2={`${x}%`}
                      y2={height - padding.bottom}
                      stroke="currentColor"
                      strokeOpacity="0.3"
                      strokeDasharray="4"
                      className="text-neutral-400"
                    />
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill={isPositive ? '#22c55e' : '#ef4444'}
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-16 bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
            <div className="font-medium">{formatDate(hoveredPoint.date)}</div>
            <div className="text-neutral-300">{formatValue(hoveredPoint.value)}</div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-neutral-500 px-12">
        {chartData
          .filter((_, i) => i % Math.ceil(chartData.length / 5) === 0 || i === chartData.length - 1)
          .map((point, i) => (
            <span key={i}>{formatDate(point.date)}</span>
          ))}
      </div>
    </div>
  );
}

export default PerformanceChart;
