/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
}

interface MarketHeatmapProps {
  coins: CoinData[];
  className?: string;
}

type TimeRange = '1h' | '24h' | '7d';

function getChangeValue(coin: CoinData, range: TimeRange): number {
  switch (range) {
    case '1h':
      return coin.price_change_percentage_1h_in_currency ?? 0;
    case '7d':
      return coin.price_change_percentage_7d_in_currency ?? 0;
    default:
      return coin.price_change_percentage_24h ?? 0;
  }
}

function getBlockColor(change: number): string {
  if (change >= 10) return 'rgba(13, 138, 94, 0.9)';
  if (change >= 5) return 'rgba(22, 199, 132, 0.85)';
  if (change >= 2) return 'rgba(22, 199, 132, 0.6)';
  if (change >= 0) return 'rgba(22, 199, 132, 0.35)';
  if (change >= -2) return 'rgba(234, 57, 67, 0.35)';
  if (change >= -5) return 'rgba(234, 57, 67, 0.6)';
  if (change >= -10) return 'rgba(234, 57, 67, 0.85)';
  return 'rgba(234, 57, 67, 0.9)';
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

interface TreemapBlock {
  coin: CoinData;
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeTreemap(
  coins: CoinData[],
  containerWidth: number,
  containerHeight: number,
): TreemapBlock[] {
  if (coins.length === 0) return [];

  const totalMcap = coins.reduce((sum, c) => sum + c.market_cap, 0);
  const blocks: TreemapBlock[] = [];

  // Squarified treemap via slice-and-dice rows
  let remaining = [...coins];
  let x = 0,
    y = 0,
    w = containerWidth,
    h = containerHeight;
  let remainingArea = containerWidth * containerHeight;

  while (remaining.length > 0) {
    // Decide orientation based on which side is longer
    const horizontal = w >= h;
    const sideLength = horizontal ? h : w;

    // Take items for this row greedily until aspect ratio worsens
    const row: CoinData[] = [];
    let rowMcap = 0;
    const totalRemaining = remaining.reduce((sum, c) => sum + c.market_cap, 0);

    for (let i = 0; i < remaining.length; i++) {
      const candidate = [...row, remaining[i]];
      const candidateMcap = rowMcap + remaining[i].market_cap;
      const rowFraction = candidateMcap / totalRemaining;
      const rowSize = rowFraction * (horizontal ? w : h);

      // Check worst aspect ratio of candidate row
      let worstAR = 0;
      for (const c of candidate) {
        const frac = c.market_cap / candidateMcap;
        const blockSize = frac * sideLength;
        const ar = Math.max(rowSize / blockSize, blockSize / rowSize);
        worstAR = Math.max(worstAR, ar);
      }

      if (row.length > 0) {
        // Check if adding this item worsens the aspect ratio
        const prevRowFraction = rowMcap / totalRemaining;
        const prevRowSize = prevRowFraction * (horizontal ? w : h);
        let prevWorstAR = 0;
        for (const c of row) {
          const frac = c.market_cap / rowMcap;
          const blockSize = frac * sideLength;
          const ar = Math.max(prevRowSize / blockSize, blockSize / prevRowSize);
          prevWorstAR = Math.max(prevWorstAR, ar);
        }

        if (worstAR > prevWorstAR && row.length >= 1) {
          break; // Stop adding to this row
        }
      }

      row.push(remaining[i]);
      rowMcap = candidateMcap;
    }

    // Layout this row
    const rowFraction = rowMcap / totalRemaining;
    const rowSize = rowFraction * (horizontal ? w : h);

    let offset = 0;
    for (const c of row) {
      const frac = c.market_cap / rowMcap;
      const blockSize = frac * sideLength;

      if (horizontal) {
        blocks.push({
          coin: c,
          x: x + offset,
          y,
          width: rowSize,
          height: blockSize,
        });
        offset += blockSize;
      } else {
        blocks.push({
          coin: c,
          x: x + offset,
          y,
          width: blockSize,
          height: rowSize,
        });
        offset += blockSize;
      }
    }

    // Reduce remaining area
    if (horizontal) {
      x += rowSize;
      w -= rowSize;
    } else {
      y += rowSize;
      h -= rowSize;
    }

    remainingArea -= rowFraction * containerWidth * containerHeight;
    remaining = remaining.slice(row.length);
  }

  return blocks;
}

export default function MarketHeatmap({ coins, className }: MarketHeatmapProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const sortedCoins = useMemo(
    () =>
      [...coins]
        .filter((c) => c.market_cap > 0)
        .sort((a, b) => b.market_cap - a.market_cap)
        .slice(0, 50),
    [coins],
  );

  const containerW = 900;
  const containerH = 500;

  const blocks = useMemo(() => computeTreemap(sortedCoins, containerW, containerH), [sortedCoins]);

  const hoveredCoin = useMemo(
    () => sortedCoins.find((c) => c.id === hoveredId) ?? null,
    [sortedCoins, hoveredId],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>, coinId: string) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredId(coinId);
  }, []);

  const ranges: { key: TimeRange; label: string }[] = [
    { key: '1h', label: '1H' },
    { key: '24h', label: '24H' },
    { key: '7d', label: '7D' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Time range toggle */}
      <div className="border-border flex w-fit gap-1 rounded-lg border bg-(--color-surface) p-1">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setTimeRange(r.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              timeRange === r.key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="border-border relative overflow-hidden rounded-lg border">
        <svg
          viewBox={`0 0 ${containerW} ${containerH}`}
          className="w-full"
          onMouseLeave={() => setHoveredId(null)}
        >
          {blocks.map((block) => {
            const change = getChangeValue(block.coin, timeRange);
            const minDim = Math.min(block.width, block.height);
            const showSymbol = minDim > 25;
            const showChange = minDim > 40;

            return (
              <g key={block.coin.id}>
                <rect
                  x={block.x + 1}
                  y={block.y + 1}
                  width={Math.max(0, block.width - 2)}
                  height={Math.max(0, block.height - 2)}
                  fill={getBlockColor(change)}
                  rx={3}
                  className="cursor-pointer transition-opacity"
                  opacity={hoveredId && hoveredId !== block.coin.id ? 0.5 : 1}
                  onMouseMove={(e) => handleMouseMove(e, block.coin.id)}
                  onMouseEnter={() => setHoveredId(block.coin.id)}
                />
                {showSymbol && (
                  <text
                    x={block.x + block.width / 2}
                    y={block.y + block.height / 2 - (showChange ? 6 : 0)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={Math.min(14, minDim / 3.5)}
                    fontWeight="bold"
                    pointerEvents="none"
                    className="select-none"
                  >
                    {block.coin.symbol.toUpperCase()}
                  </text>
                )}
                {showChange && (
                  <text
                    x={block.x + block.width / 2}
                    y={block.y + block.height / 2 + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.85)"
                    fontSize={Math.min(11, minDim / 5)}
                    pointerEvents="none"
                    className="tabular-nums select-none"
                  >
                    {change >= 0 ? '+' : ''}
                    {change.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredCoin && (
          <div
            className="border-border pointer-events-none absolute z-10 min-w-45 rounded-lg border bg-(--color-surface) p-3 text-sm shadow-lg"
            style={{
              left: `${Math.min(tooltipPos.x + 12, containerW - 200)}px`,
              top: `${tooltipPos.y + 12}px`,
              transform: tooltipPos.x > containerW * 0.7 ? 'translateX(-110%)' : 'none',
            }}
          >
            <div className="text-text-primary font-semibold">
              {hoveredCoin.name}{' '}
              <span className="text-text-secondary font-normal">
                {hoveredCoin.symbol.toUpperCase()}
              </span>
            </div>
            <div className="text-text-secondary mt-1 space-y-0.5">
              <div className="flex justify-between gap-4">
                <span>Price</span>
                <span className="text-text-primary font-medium tabular-nums">
                  $
                  {hoveredCoin.current_price.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Market Cap</span>
                <span className="text-text-primary font-medium">
                  {formatCompact(hoveredCoin.market_cap)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Volume</span>
                <span className="text-text-primary font-medium">
                  {formatCompact(hoveredCoin.total_volume)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Change ({timeRange})</span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    getChangeValue(hoveredCoin, timeRange) >= 0 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {getChangeValue(hoveredCoin, timeRange) >= 0 ? '+' : ''}
                  {getChangeValue(hoveredCoin, timeRange).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="text-text-secondary flex items-center justify-center gap-1 text-xs">
        <span>-10%+</span>
        <div className="flex gap-0.5">
          {[
            'rgba(234,57,67,0.9)',
            'rgba(234,57,67,0.6)',
            'rgba(234,57,67,0.35)',
            'rgba(22,199,132,0.35)',
            'rgba(22,199,132,0.6)',
            'rgba(22,199,132,0.85)',
            'rgba(13,138,94,0.9)',
          ].map((color, i) => (
            <div key={i} className="h-3 w-6 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>+10%+</span>
      </div>
    </div>
  );
}
