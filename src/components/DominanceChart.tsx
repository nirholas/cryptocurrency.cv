'use client';

import { useState, useEffect, useMemo } from 'react';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
}

interface DominanceData {
  name: string;
  symbol: string;
  dominance: number;
  color: string;
}

const COIN_COLORS: Record<string, string> = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  tether: '#26A17B',
  binancecoin: '#F3BA2F',
  solana: '#00FFA3',
  ripple: '#23292F',
  cardano: '#0033AD',
  dogecoin: '#C2A633',
  polkadot: '#E6007A',
  others: '#6B7280',
};

// Monochrome version
const MONO_SHADES = [
  '#000000',
  '#1a1a1a',
  '#333333',
  '#4d4d4d',
  '#666666',
  '#808080',
  '#999999',
  '#b3b3b3',
  '#cccccc',
  '#e6e6e6',
];

export function DominanceChart({ coins }: { coins: Coin[] }) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'donut' | 'bar'>('donut');

  const dominanceData = useMemo(() => {
    if (!coins.length) return [];

    const totalMarketCap = coins.reduce((sum, c) => sum + c.market_cap, 0);
    const topCoins = coins.slice(0, 9);
    const othersCap = coins.slice(9).reduce((sum, c) => sum + c.market_cap, 0);

    const data: DominanceData[] = topCoins.map((coin, i) => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      dominance: (coin.market_cap / totalMarketCap) * 100,
      color: MONO_SHADES[i],
    }));

    if (othersCap > 0) {
      data.push({
        name: 'Others',
        symbol: 'OTHER',
        dominance: (othersCap / totalMarketCap) * 100,
        color: MONO_SHADES[9],
      });
    }

    return data;
  }, [coins]);

  // Calculate SVG arc paths for donut chart
  const donutSegments = useMemo(() => {
    const segments: Array<{
      path: string;
      data: DominanceData;
      startAngle: number;
      endAngle: number;
    }> = [];
    let currentAngle = -90; // Start from top

    dominanceData.forEach((item) => {
      const angle = (item.dominance / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const outerRadius = 100;
      const innerRadius = 60;

      const x1Outer = 100 + outerRadius * Math.cos(startRad);
      const y1Outer = 100 + outerRadius * Math.sin(startRad);
      const x2Outer = 100 + outerRadius * Math.cos(endRad);
      const y2Outer = 100 + outerRadius * Math.sin(endRad);

      const x1Inner = 100 + innerRadius * Math.cos(endRad);
      const y1Inner = 100 + innerRadius * Math.sin(endRad);
      const x2Inner = 100 + innerRadius * Math.cos(startRad);
      const y2Inner = 100 + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = `
        M ${x1Outer} ${y1Outer}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
        L ${x1Inner} ${y1Inner}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
        Z
      `;

      segments.push({ path, data: item, startAngle, endAngle });
      currentAngle = endAngle;
    });

    return segments;
  }, [dominanceData]);

  if (!coins.length) {
    return <div className="h-64 bg-gray-200 dark:bg-black rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1">
          <button
            onClick={() => setDisplayMode('donut')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              displayMode === 'donut'
                ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Donut
          </button>
          <button
            onClick={() => setDisplayMode('bar')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              displayMode === 'bar'
                ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {displayMode === 'donut' ? (
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {donutSegments.map(({ path, data }) => (
                <path
                  key={data.symbol}
                  d={path}
                  fill={data.color}
                  className="transition-opacity cursor-pointer"
                  opacity={hoveredSegment && hoveredSegment !== data.symbol ? 0.3 : 1}
                  onMouseEnter={() => setHoveredSegment(data.symbol)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hoveredSegment ? (
                <>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dominanceData.find((d) => d.symbol === hoveredSegment)?.dominance.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {hoveredSegment}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dominanceData[0]?.dominance.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    BTC Dominance
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-3">
            {dominanceData.map((item) => (
              <div
                key={item.symbol}
                className="relative"
                onMouseEnter={() => setHoveredSegment(item.symbol)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.symbol}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.dominance.toFixed(2)}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.dominance}%`,
                      backgroundColor: item.color,
                      opacity: hoveredSegment && hoveredSegment !== item.symbol ? 0.3 : 1,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          {dominanceData.map((item) => (
            <div
              key={item.symbol}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                hoveredSegment === item.symbol ? 'bg-gray-100 dark:bg-black' : ''
              }`}
              onMouseEnter={() => setHoveredSegment(item.symbol)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {item.symbol}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.dominance.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
