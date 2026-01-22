'use client';

/**
 * Sparkline Cell Component
 * Mini chart for displaying 7-day price history in table cells
 */

import { useMemo } from 'react';

interface SparklineCellProps {
  data: number[];
  change: number;
  width?: number;
  height?: number;
}

export default function SparklineCell({ 
  data, 
  change,
  width = 100, 
  height = 32 
}: SparklineCellProps) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const isPositive = change >= 0;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const gradientId = `gradient-${Math.random().toString(36).slice(2)}`;

  if (!data || data.length < 2) {
    return (
      <div 
        className="bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
        style={{ width, height }}
      />
    );
  }

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area under the line */}
      <path
        d={`${pathData} L ${width},${height} L 0,${height} Z`}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
