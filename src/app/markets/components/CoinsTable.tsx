'use client';

/**
 * Coins Table Component
 * Main table displaying cryptocurrency data with sortable columns
 */

import type { TokenPrice } from '@/lib/market-data';
import SortableHeader, { type SortField, type SortOrder } from './SortableHeader';
import CoinRow from './CoinRow';
import TablePagination from './TablePagination';

interface CoinsTableProps {
  coins: TokenPrice[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  currentSort: SortField;
  currentOrder: SortOrder;
  showWatchlist?: boolean;
}

export default function CoinsTable({
  coins,
  totalCount,
  currentPage,
  itemsPerPage,
  currentSort,
  currentOrder,
  showWatchlist = false,
}: CoinsTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (coins.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No coins found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
              {/* Rank */}
              <SortableHeader
                label="#"
                field="market_cap_rank"
                currentSort={currentSort}
                currentOrder={currentOrder}
                align="left"
                className="w-12"
              />
              
              {/* Coin */}
              <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">
                Coin
              </th>
              
              {/* Price */}
              <SortableHeader
                label="Price"
                field="current_price"
                currentSort={currentSort}
                currentOrder={currentOrder}
              />
              
              {/* 24h % */}
              <SortableHeader
                label="24h %"
                field="price_change_percentage_24h"
                currentSort={currentSort}
                currentOrder={currentOrder}
                className="hidden sm:table-cell"
              />
              
              {/* 7d % */}
              <SortableHeader
                label="7d %"
                field="price_change_percentage_7d_in_currency"
                currentSort={currentSort}
                currentOrder={currentOrder}
                className="hidden md:table-cell"
              />
              
              {/* Market Cap */}
              <SortableHeader
                label="Market Cap"
                field="market_cap"
                currentSort={currentSort}
                currentOrder={currentOrder}
                className="hidden lg:table-cell"
              />
              
              {/* Volume */}
              <SortableHeader
                label="24h Volume"
                field="total_volume"
                currentSort={currentSort}
                currentOrder={currentOrder}
                className="hidden xl:table-cell"
              />
              
              {/* Circulating Supply */}
              <SortableHeader
                label="Circulating Supply"
                field="circulating_supply"
                currentSort={currentSort}
                currentOrder={currentOrder}
                className="hidden xl:table-cell"
              />
              
              {/* 7d Chart */}
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">
                Last 7 Days
              </th>
              
              {/* Watchlist */}
              {showWatchlist && (
                <th className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium p-4 w-12">
                  <span className="sr-only">Watchlist</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <CoinRow 
                key={coin.id} 
                coin={coin} 
                showWatchlist={showWatchlist}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
