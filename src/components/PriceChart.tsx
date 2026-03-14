'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OHLCCandle {
  0: number; // timestamp
  1: number; // open
  2: number; // high
  3: number; // low
  4: number; // close
}

const TIME_RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
] as const;

function formatChartPrice(n: number): string {
  if (n >= 1)
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}

function formatDate(ts: number, days: number): string {
  const d = new Date(ts);
  if (days <= 1) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (days <= 30) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function PriceChart({ coinId }: { coinId: string }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<OHLCCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    price: number;
    date: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/ohlc?coinId=${encodeURIComponent(coinId)}&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load chart data');
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        // API returns array of [timestamp, open, high, low, close]
        const candles: OHLCCandle[] = Array.isArray(json) ? json : (json.data ?? []);
        setData(candles);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coinId, days]);

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 60, bottom: 30, left: 10 };

  const { closePrices, minPrice, maxPrice, priceRange, path, areaPath, isPositive, changePercent } =
    useMemo(() => {
      if (data.length === 0) {
        return {
          closePrices: [],
          minPrice: 0,
          maxPrice: 0,
          priceRange: 0,
          path: '',
          areaPath: '',
          isPositive: true,
          changePercent: 0,
        };
      }

      const closes = data.map((c) => c[4]);
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      const range = max - min || 1;
      const first = closes[0];
      const last = closes[closes.length - 1];
      const positive = last >= first;
      const change = first > 0 ? ((last - first) / first) * 100 : 0;

      const usableWidth = chartWidth - padding.left - padding.right;
      const usableHeight = chartHeight - padding.top - padding.bottom;

      const points = closes.map((price, i) => {
        const x = padding.left + (i / (closes.length - 1)) * usableWidth;
        const y = padding.top + usableHeight - ((price - min) / range) * usableHeight;
        return { x, y };
      });

      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

      const area =
        linePath +
        ` L${points[points.length - 1].x},${padding.top + usableHeight}` +
        ` L${points[0].x},${padding.top + usableHeight} Z`;

      return {
        closePrices: closes,
        minPrice: min,
        maxPrice: max,
        priceRange: range,
        path: linePath,
        areaPath: area,
        isPositive: positive,
        changePercent: change,
      };
    }, [data]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (data.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
      const usableWidth = chartWidth - padding.left - padding.right;
      const index = Math.round(((mouseX - padding.left) / usableWidth) * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      const candle = data[clampedIndex];
      const price = candle[4];
      const usableHeight = chartHeight - padding.top - padding.bottom;
      const x = padding.left + (clampedIndex / (data.length - 1)) * usableWidth;
      const y = padding.top + usableHeight - ((price - minPrice) / priceRange) * usableHeight;
      setTooltip({ x, y, price, date: candle[0] });
    },
    [data, minPrice, priceRange],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // Y-axis labels
  const yLabels = useMemo(() => {
    if (data.length === 0) return [];
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = minPrice + (priceRange * i) / steps;
      const usableHeight = chartHeight - padding.top - padding.bottom;
      const y = padding.top + usableHeight - (i / steps) * usableHeight;
      return { price, y };
    });
  }, [data, minPrice, priceRange]);

  const strokeColor = isPositive ? 'var(--chart-green, #22c55e)' : 'var(--chart-red, #ef4444)';
  const fillGradientId = `chart-gradient-${coinId}`;

  return (
    <div className="border-border rounded-xl border bg-(--color-surface) p-4 md:p-6">
      {/* Time range selector */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm font-medium">Price Chart</span>
          {data.length > 0 && (
            <span
              className={cn(
                'text-sm font-semibold',
                isPositive ? 'text-green-500' : 'text-red-500',
              )}
            >
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex gap-1" role="group" aria-label="Chart time range">
          {TIME_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                days === range.days
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-(--color-bg-secondary)',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative">
        {loading && (
          <div className="text-text-tertiary flex h-75 items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading chart…
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="text-text-tertiary flex h-75 items-center justify-center">
            Chart data unavailable
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-auto w-full select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="img"
            aria-label={`Price chart for ${coinId} over ${days} days. ${changePercent != null ? `Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : ''}`}
          >
            <defs>
              <linearGradient id={fillGradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map((label, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={label.y}
                  x2={chartWidth - padding.right}
                  y2={label.y}
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
                <text
                  x={chartWidth - padding.right + 8}
                  y={label.y + 4}
                  fontSize="10"
                  fill="var(--color-text-tertiary)"
                >
                  {formatChartPrice(label.price)}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${fillGradientId})`} />

            {/* Price line */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tooltip crosshair */}
            {tooltip && (
              <>
                <line
                  x1={tooltip.x}
                  y1={padding.top}
                  x2={tooltip.x}
                  y2={chartHeight - padding.bottom}
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={tooltip.x}
                  cy={tooltip.y}
                  r="4"
                  fill={strokeColor}
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>
        )}

        {/* Tooltip overlay */}
        {tooltip && (
          <div
            className="border-border pointer-events-none absolute z-10 rounded-lg border bg-(--color-surface) px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(tooltip.x / chartWidth) * 100}%`,
              top: '0',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-text-primary font-semibold">{formatChartPrice(tooltip.price)}</p>
            <p className="text-text-tertiary">{formatDate(tooltip.date, days)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
