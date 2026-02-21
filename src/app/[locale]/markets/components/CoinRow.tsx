'use client';

/**
 * Coin Row Component
 * Individual row in the coins table — renders only the active columns.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TokenPrice } from '@/lib/market-data';
import { formatPrice, formatNumber, formatPercent } from '@/lib/market-data';
import SparklineCell from './SparklineCell';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist';

interface CoinRowProps {
  coin: TokenPrice;
  /** Ordered list of active column IDs from ColumnDefs */
  activeColumns: string[];
  showWatchlist?: boolean;
  btcPrice?: number;
  ethPrice?: number;
  btcChange1h?: number;
  btcChange24h?: number;
  ethChange1h?: number;
  ethChange24h?: number;
  totalMarketCap?: number;
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function formatSmallPrice(val: number | undefined | null): string {
  if (val == null) return '—';
  if (val < 0.000001) return val.toExponential(4);
  if (val < 0.001) return val.toFixed(8);
  if (val < 1) return val.toFixed(6);
  return val.toFixed(8);
}

function ChangeCell({ value }: { value: number | undefined | null }) {
  if (value == null) return <span className="text-gray-400 dark:text-gray-600">—</span>;
  const positive = value >= 0;
  return (
    <span className={positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
      {formatPercent(value)}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CoinRow({
  coin,
  activeColumns,
  showWatchlist = false,
  btcPrice,
  ethPrice,
  btcChange1h,
  btcChange24h,
  ethChange1h,
  ethChange24h,
  totalMarketCap,
}: CoinRowProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    if (showWatchlist) setIsWatchlisted(isInWatchlist(coin.id));
  }, [coin.id, showWatchlist]);

  const handleWatchlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isWatchlisted) {
        removeFromWatchlist(coin.id);
        setIsWatchlisted(false);
      } else {
        const result = addToWatchlist(coin.id);
        if (result.success) setIsWatchlisted(true);
      }
    },
    [isWatchlisted, coin.id],
  );

  const supplyPercentage =
    coin.max_supply ? (coin.circulating_supply / coin.max_supply) * 100 : null;

  // Derived values
  const priceBtc = btcPrice && btcPrice > 0 ? coin.current_price / btcPrice : undefined;
  const priceEth = ethPrice && ethPrice > 0 ? coin.current_price / ethPrice : undefined;
  const volumeMcap = coin.market_cap > 0 ? coin.total_volume / coin.market_cap : undefined;
  const dominancePct = totalMarketCap && totalMarketCap > 0
    ? (coin.market_cap / totalMarketCap) * 100
    : undefined;

  // 1h% in BTC = coin 1h change minus btc 1h change (relative performance)
  const change1hBtc =
    coin.price_change_percentage_1h_in_currency != null && btcChange1h != null
      ? coin.price_change_percentage_1h_in_currency - btcChange1h
      : undefined;
  const change24hBtc =
    coin.price_change_percentage_24h != null && btcChange24h != null
      ? coin.price_change_percentage_24h - btcChange24h
      : undefined;
  const change1hEth =
    coin.price_change_percentage_1h_in_currency != null && ethChange1h != null
      ? coin.price_change_percentage_1h_in_currency - ethChange1h
      : undefined;
  const change24hEth =
    coin.price_change_percentage_24h != null && ethChange24h != null
      ? coin.price_change_percentage_24h - ethChange24h
      : undefined;

  function renderCell(colId: string) {
    switch (colId) {
      // ── Pinned ──────────────────────────────────────────────────────────
      case 'rank':
        return (
          <td key="rank" className="p-4 text-gray-500 dark:text-gray-400 text-sm">
            {coin.market_cap_rank}
          </td>
        );

      case 'coin':
        return (
          <td key="coin" className="p-4">
            <Link href={`/coin/${coin.id}`} className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                {coin.image && (
                  <Image
                    src={coin.image}
                    alt={coin.name}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {coin.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  {coin.symbol.toUpperCase()}
                </span>
              </div>
            </Link>
          </td>
        );

      // ── Price ────────────────────────────────────────────────────────────
      case 'price':
        return (
          <td key="price" className="p-4 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
            {formatPrice(coin.current_price)}
          </td>
        );

      case 'price_btc':
        return (
          <td key="price_btc" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap text-sm">
            {priceBtc != null ? formatSmallPrice(priceBtc) : '—'}
          </td>
        );

      case 'price_eth':
        return (
          <td key="price_eth" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap text-sm">
            {priceEth != null ? formatSmallPrice(priceEth) : '—'}
          </td>
        );

      case 'ath':
        return (
          <td key="ath" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.ath ? formatPrice(coin.ath) : '—'}
          </td>
        );

      case 'atl':
        return (
          <td key="atl" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.atl ? formatPrice(coin.atl) : '—'}
          </td>
        );

      case 'high_24h':
        return (
          <td key="high_24h" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.high_24h ? formatPrice(coin.high_24h) : '—'}
          </td>
        );

      case 'low_24h':
        return (
          <td key="low_24h" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.low_24h ? formatPrice(coin.low_24h) : '—'}
          </td>
        );

      case 'from_ath':
        return (
          <td key="from_ath" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.ath_change_percentage} />
          </td>
        );

      case 'from_atl':
        return (
          <td key="from_atl" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.atl_change_percentage} />
          </td>
        );

      // ── Price Change ──────────────────────────────────────────────────────
      case 'change_1h':
        return (
          <td key="change_1h" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_1h_in_currency} />
          </td>
        );

      case 'change_24h':
        return (
          <td key="change_24h" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_24h} />
          </td>
        );

      case 'change_7d':
        return (
          <td key="change_7d" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_7d_in_currency} />
          </td>
        );

      case 'change_30d':
        return (
          <td key="change_30d" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_30d_in_currency} />
          </td>
        );

      case 'change_60d':
        return (
          <td key="change_60d" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_60d_in_currency} />
          </td>
        );

      case 'change_90d':
        return (
          <td key="change_90d" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_90d_in_currency} />
          </td>
        );

      case 'change_200d':
        return (
          <td key="change_200d" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={coin.price_change_percentage_200d_in_currency} />
          </td>
        );

      case 'change_1h_btc':
        return (
          <td key="change_1h_btc" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={change1hBtc} />
          </td>
        );

      case 'change_24h_btc':
        return (
          <td key="change_24h_btc" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={change24hBtc} />
          </td>
        );

      case 'change_1h_eth':
        return (
          <td key="change_1h_eth" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={change1hEth} />
          </td>
        );

      case 'change_24h_eth':
        return (
          <td key="change_24h_eth" className="p-4 text-right font-medium whitespace-nowrap">
            <ChangeCell value={change24hEth} />
          </td>
        );

      // ── Market Cap ────────────────────────────────────────────────────────
      case 'market_cap':
        return (
          <td key="market_cap" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            ${formatNumber(coin.market_cap)}
          </td>
        );

      case 'fdv':
        return (
          <td key="fdv" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.fully_diluted_valuation
              ? `$${formatNumber(coin.fully_diluted_valuation)}`
              : '—'}
          </td>
        );

      // ── Volume ────────────────────────────────────────────────────────────
      case 'volume_24h':
        return (
          <td key="volume_24h" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            ${formatNumber(coin.total_volume)}
          </td>
        );

      case 'volume_market_cap':
        return (
          <td key="volume_market_cap" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {volumeMcap != null ? (volumeMcap * 100).toFixed(2) + '%' : '—'}
          </td>
        );

      // ── Supply ────────────────────────────────────────────────────────────
      case 'circulating_supply':
        return (
          <td key="circulating_supply" className="p-4 text-right">
            <div className="flex flex-col items-end">
              <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {formatNumber(coin.circulating_supply)} {coin.symbol.toUpperCase()}
              </span>
              {supplyPercentage !== null && (
                <div className="w-full max-w-[80px] mt-1">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(supplyPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {supplyPercentage.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </td>
        );

      case 'total_supply':
        return (
          <td key="total_supply" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.total_supply != null
              ? `${formatNumber(coin.total_supply)} ${coin.symbol.toUpperCase()}`
              : '∞'}
          </td>
        );

      case 'max_supply':
        return (
          <td key="max_supply" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {coin.max_supply != null
              ? `${formatNumber(coin.max_supply)} ${coin.symbol.toUpperCase()}`
              : '∞'}
          </td>
        );

      // ── Charts ────────────────────────────────────────────────────────────
      case 'sparkline_7d':
        return (
          <td key="sparkline_7d" className="p-4">
            {coin.sparkline_in_7d?.price ? (
              <SparklineCell
                data={coin.sparkline_in_7d.price}
                change={coin.price_change_percentage_7d_in_currency || 0}
              />
            ) : (
              <div className="w-[100px] h-[32px] bg-gray-100 dark:bg-gray-700 rounded" />
            )}
          </td>
        );

      // ── Others ────────────────────────────────────────────────────────────
      case 'dominance':
        return (
          <td key="dominance" className="p-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {dominancePct != null ? dominancePct.toFixed(2) + '%' : '—'}
          </td>
        );

      default:
        return null;
    }
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      {activeColumns.map((colId) => renderCell(colId))}

      {/* Watchlist star */}
      {showWatchlist && (
        <td className="p-4 text-center">
          <button
            onClick={handleWatchlistToggle}
            className={`transition-colors ${
              isWatchlisted
                ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500 dark:hover:text-yellow-400'
            }`}
            title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <svg
              className="w-5 h-5"
              fill={isWatchlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </td>
      )}
    </tr>
  );
}
