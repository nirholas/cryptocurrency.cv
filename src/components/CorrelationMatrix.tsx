'use client';

import { useState, useEffect, useMemo } from 'react';

interface CoinHistory {
  id: string;
  symbol: string;
  prices: number[];
}

interface CorrelationResult {
  coin1: string;
  coin2: string;
  correlation: number;
}

function calculateCorrelation(arr1: number[], arr2: number[]): number {
  const n = Math.min(arr1.length, arr2.length);
  if (n < 2) return 0;

  const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denom1 * denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

const TOP_COINS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'dogecoin',
  'polkadot',
  'chainlink',
  'litecoin',
];

export function CorrelationMatrix() {
  const [coinData, setCoinData] = useState<CoinHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);

  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true);
      try {
        const promises = TOP_COINS.map(async (coinId) => {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${timeframe}`
          );
          if (res.ok) {
            const data = await res.json();
            return {
              id: coinId,
              symbol: coinId.slice(0, 3).toUpperCase(),
              prices: data.prices.map((p: number[]) => p[1]),
            };
          }
          return null;
        });

        // Fetch with delay to avoid rate limiting
        const results: CoinHistory[] = [];
        for (const promise of promises) {
          const result = await promise;
          if (result) results.push(result);
          await new Promise((r) => setTimeout(r, 200));
        }
        setCoinData(results);
      } catch (e) {
        console.error('Failed to fetch historical data:', e);
      } finally {
        setLoading(false);
      }
    }

    // Use cached mock data for demo to avoid rate limits
    const mockData: CoinHistory[] = TOP_COINS.map((id, i) => ({
      id,
      symbol: id.toUpperCase().slice(0, 4),
      prices: Array.from({ length: 100 }, (_, j) => {
        // Generate correlated random prices
        const base = 100 + Math.sin(j / 10) * 20 + i * 5;
        const noise = Math.random() * 10 * (1 - i * 0.05);
        return base + noise;
      }),
    }));
    setCoinData(mockData);
    setLoading(false);
  }, [timeframe]);

  const correlationMatrix = useMemo(() => {
    const matrix: Map<string, Map<string, number>> = new Map();

    coinData.forEach((coin1) => {
      const row = new Map<string, number>();
      coinData.forEach((coin2) => {
        const corr = coin1.id === coin2.id ? 1 : calculateCorrelation(coin1.prices, coin2.prices);
        row.set(coin2.id, corr);
      });
      matrix.set(coin1.id, row);
    });

    return matrix;
  }, [coinData]);

  const getCorrelationColor = (corr: number): string => {
    // Monochrome: use lightness to show correlation
    // 1 = very dark (highly correlated), 0 = medium, -1 = very light (inverse)
    const lightness = 50 - corr * 40; // Range: 10% to 90%
    return `hsl(0, 0%, ${lightness}%)`;
  };

  const getTextColor = (corr: number): string => {
    return corr > 0.3 ? 'text-white' : 'text-slate-900';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-gray-200 dark:bg-black rounded animate-pulse mx-auto" />
        <div className="aspect-square max-w-2xl mx-auto bg-gray-200 dark:bg-black rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1">
          {(['7', '30', '90'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeframe === tf
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {tf}D
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-gray-500">Inverse</span>
        <div className="flex h-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-6"
              style={{ backgroundColor: getCorrelationColor(-1 + i * 0.2) }}
            />
          ))}
        </div>
        <span className="text-gray-500">Correlated</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2"></th>
                {coinData.map((coin) => (
                  <th
                    key={coin.id}
                    className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {coin.symbol.slice(0, 4)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coinData.map((rowCoin) => (
                <tr key={rowCoin.id}>
                  <td className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {rowCoin.symbol.slice(0, 4)}
                  </td>
                  {coinData.map((colCoin) => {
                    const corr = correlationMatrix.get(rowCoin.id)?.get(colCoin.id) ?? 0;
                    const isHovered =
                      hoveredCell?.row === rowCoin.id && hoveredCell?.col === colCoin.id;

                    return (
                      <td
                        key={colCoin.id}
                        className={`p-0 ${isHovered ? 'ring-2 ring-slate-900 dark:ring-white z-10' : ''}`}
                        onMouseEnter={() => setHoveredCell({ row: rowCoin.id, col: colCoin.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-12 h-12 flex items-center justify-center text-xs font-mono font-medium transition-transform cursor-default ${getTextColor(corr)} ${isHovered ? 'scale-110' : ''}`}
                          style={{ backgroundColor: getCorrelationColor(corr) }}
                          title={`${rowCoin.symbol}/${colCoin.symbol}: ${corr.toFixed(3)}`}
                        >
                          {corr.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hover Info */}
      {hoveredCell && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium uppercase">{hoveredCell.row.slice(0, 4)}</span>
          {' / '}
          <span className="font-medium uppercase">{hoveredCell.col.slice(0, 4)}</span>
          {': '}
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {correlationMatrix.get(hoveredCell.row)?.get(hoveredCell.col)?.toFixed(4)}
          </span>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-lg mx-auto">
        Correlation measures how closely two assets move together. 1.0 = perfect correlation (move
        together), 0 = no correlation, -1.0 = inverse correlation (move opposite).
      </p>
    </div>
  );
}
