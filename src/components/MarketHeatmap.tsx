'use client';

import { useState, useEffect, useMemo } from 'react';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  category?: string;
}

interface MarketHeatmapProps {
  limit?: number;
  timeframe?: '1h' | '24h' | '7d' | '30d';
  category?: 'all' | 'layer-1' | 'defi' | 'meme' | 'ai' | 'gaming';
  showLabels?: boolean;
}

const CATEGORY_MAPPING: Record<string, string[]> = {
  'layer-1': ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 'near', 'algorand', 'cosmos', 'tron'],
  'defi': ['uniswap', 'aave', 'maker', 'compound', 'curve-dao-token', 'lido-dao', 'pancakeswap-token', 'sushiswap', 'yearn-finance', 'jupiter'],
  'meme': ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'bonk', 'dogwifcoin', 'memecoin', 'brett', 'popcat', 'mog-coin'],
  'ai': ['render-token', 'fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor', 'arkham', 'worldcoin', 'akash-network', 'phala-network'],
  'gaming': ['immutable-x', 'the-sandbox', 'axie-infinity', 'decentraland', 'gala', 'enjincoin', 'illuvium', 'stepn', 'pixels', 'ronin'],
};

/**
 * Market Heatmap Component
 * 
 * Interactive treemap visualization showing cryptocurrency market performance.
 * Size represents market cap, color represents price change.
 */
export function MarketHeatmap({
  limit = 100,
  timeframe = '24h',
  category = 'all',
  showLabels = true,
}: MarketHeatmapProps) {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCoin, setHoveredCoin] = useState<CoinData | null>(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [limit, category]);

  async function fetchMarketData() {
    try {
      setError(null);
      
      // Fetch from CoinGecko markets API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      const formattedCoins: CoinData[] = data.map((coin: {
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        price_change_percentage_24h: number;
        price_change_percentage_7d_in_currency?: number;
        market_cap: number;
        total_volume: number;
      }) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h || 0,
        priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        category: getCoinCategory(coin.id),
      }));

      // Filter by category if specified
      const filtered = category === 'all' 
        ? formattedCoins 
        : formattedCoins.filter(coin => coin.category === category);

      setCoins(filtered);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }

  function getCoinCategory(coinId: string): string {
    for (const [cat, ids] of Object.entries(CATEGORY_MAPPING)) {
      if (ids.includes(coinId)) return cat;
    }
    return 'other';
  }

  // Calculate treemap layout
  const layout = useMemo(() => {
    if (coins.length === 0) return [];

    const totalMarketCap = coins.reduce((sum, coin) => sum + coin.marketCap, 0);
    const containerWidth = 1000;
    const containerHeight = 600;
    const containerArea = containerWidth * containerHeight;

    // Sort by market cap descending
    const sortedCoins = [...coins].sort((a, b) => b.marketCap - a.marketCap);

    // Simple squarified treemap algorithm
    const rectangles: Array<{
      coin: CoinData;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    let x = 0;
    let y = 0;
    let remainingWidth = containerWidth;
    let remainingHeight = containerHeight;
    let row: CoinData[] = [];
    let rowArea = 0;

    for (const coin of sortedCoins) {
      const coinArea = (coin.marketCap / totalMarketCap) * containerArea;
      row.push(coin);
      rowArea += coinArea;

      // Decide if we should lay out this row
      const isLastCoin = coin === sortedCoins[sortedCoins.length - 1];
      const rowWidth = remainingWidth;
      const rowHeight = rowArea / rowWidth;

      if (rowHeight > remainingHeight * 0.3 || isLastCoin) {
        // Lay out the row
        let rowX = x;
        const actualRowHeight = Math.min(rowHeight, remainingHeight);

        for (const rowCoin of row) {
          const coinAreaInRow = (rowCoin.marketCap / totalMarketCap) * containerArea;
          const coinWidth = coinAreaInRow / actualRowHeight;

          rectangles.push({
            coin: rowCoin,
            x: rowX,
            y,
            width: Math.min(coinWidth, remainingWidth - (rowX - x)),
            height: actualRowHeight,
          });

          rowX += coinWidth;
        }

        y += actualRowHeight;
        remainingHeight -= actualRowHeight;
        row = [];
        rowArea = 0;
      }
    }

    return rectangles;
  }, [coins]);

  function getColorForChange(change: number): string {
    if (change > 10) return 'bg-green-500';
    if (change > 5) return 'bg-green-400';
    if (change > 2) return 'bg-green-300';
    if (change > 0) return 'bg-green-200';
    if (change > -2) return 'bg-red-200';
    if (change > -5) return 'bg-red-300';
    if (change > -10) return 'bg-red-400';
    return 'bg-red-500';
  }

  function getTextColorForChange(change: number): string {
    if (change > 5 || change < -5) return 'text-white';
    return 'text-neutral-900';
  }

  function formatPrice(price: number): string {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  }

  function formatMarketCap(mc: number): string {
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
          <div className="h-[400px] bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Failed to Load Market Data
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {error}
          </p>
          <button
            onClick={fetchMarketData}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Market Heatmap
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Size = Market Cap, Color = {timeframe} Change
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400">&lt;-10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-300 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400">-5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400">0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-300 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400">+5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400">&gt;+10%</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative" style={{ height: '500px' }}>
        <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {layout.map(({ coin, x, y, width, height }) => {
            const change = timeframe === '7d' ? coin.priceChange7d : coin.priceChange24h;
            const showLabel = showLabels && width > 40 && height > 30;
            const showDetails = width > 80 && height > 50;
            
            return (
              <g 
                key={coin.id}
                onMouseEnter={() => setHoveredCoin(coin)}
                onMouseLeave={() => setHoveredCoin(null)}
                className="cursor-pointer transition-opacity hover:opacity-90"
              >
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={Math.max(0, width - 2)}
                  height={Math.max(0, height - 2)}
                  rx={4}
                  className={`${getColorForChange(change)} stroke-white dark:stroke-neutral-900 stroke-[0.5]`}
                />
                {showLabel && (
                  <>
                    <text
                      x={x + width / 2}
                      y={y + height / 2 - (showDetails ? 10 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-xs font-bold fill-current ${getTextColorForChange(change)}`}
                      style={{ fontSize: Math.min(14, width / 6, height / 4) }}
                    >
                      {coin.symbol}
                    </text>
                    {showDetails && (
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`text-xs fill-current ${getTextColorForChange(change)}`}
                        style={{ fontSize: Math.min(11, width / 8, height / 5) }}
                      >
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredCoin && (
          <div className="absolute top-4 right-4 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-4 z-10 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-neutral-900 dark:text-white">
                {hoveredCoin.symbol}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {hoveredCoin.name}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Price:</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {formatPrice(hoveredCoin.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">24h Change:</span>
                <span className={`font-medium ${hoveredCoin.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hoveredCoin.priceChange24h >= 0 ? '+' : ''}{hoveredCoin.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">7d Change:</span>
                <span className={`font-medium ${hoveredCoin.priceChange7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hoveredCoin.priceChange7d >= 0 ? '+' : ''}{hoveredCoin.priceChange7d.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Market Cap:</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {formatMarketCap(hoveredCoin.marketCap)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Data from CoinGecko • Updates every minute • Top {coins.length} by market cap
      </div>
    </div>
  );
}

export default MarketHeatmap;
