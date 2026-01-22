/**
 * MarketsTable Component - Exchange trading pairs with sorting and pagination
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Ticker } from '@/lib/market-data';

interface MarketsTableProps {
  tickers: Ticker[];
  coinSymbol: string;
}

type SortKey = 'exchange' | 'pair' | 'price' | 'spread' | 'volume' | 'trust';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

function formatPrice(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(8);
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return '$' + (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return '$' + (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return '$' + (volume / 1e3).toFixed(2) + 'K';
  return '$' + volume.toFixed(0);
}

function getTrustColor(score: string | null): string {
  switch (score) {
    case 'green': return 'bg-green-500';
    case 'yellow': return 'bg-yellow-500';
    case 'red': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export default function MarketsTable({ tickers, coinSymbol }: MarketsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort tickers
  const filteredTickers = useMemo(() => {
    let filtered = tickers.filter((t) => !t.is_stale && !t.is_anomaly);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.market.name.toLowerCase().includes(query) ||
          t.target.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'exchange':
          comparison = a.market.name.localeCompare(b.market.name);
          break;
        case 'pair':
          comparison = a.target.localeCompare(b.target);
          break;
        case 'price':
          comparison = a.converted_last.usd - b.converted_last.usd;
          break;
        case 'spread':
          comparison = (a.bid_ask_spread_percentage || 0) - (b.bid_ask_spread_percentage || 0);
          break;
        case 'volume':
          comparison = a.converted_volume.usd - b.converted_volume.usd;
          break;
        case 'trust':
          const trustOrder = { green: 3, yellow: 2, red: 1, null: 0 };
          comparison = (trustOrder[a.trust_score || 'null'] || 0) - (trustOrder[b.trust_score || 'null'] || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tickers, sortKey, sortOrder, searchQuery]);

  const totalPages = Math.ceil(filteredTickers.length / ITEMS_PER_PAGE);
  const paginatedTickers = filteredTickers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors ${
        sortKey === sortKeyName ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
      {sortKey === sortKeyName && (
        <svg
          className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {coinSymbol.toUpperCase()} Markets
            </h3>
            <p className="text-sm text-gray-400">
              {filteredTickers.length} trading pairs across {
                new Set(tickers.map((t) => t.market.identifier)).size
              } exchanges
            </p>
          </div>
          
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search exchange or pair..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-4 py-3 text-left">
                <SortHeader label="Exchange" sortKeyName="exchange" />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Pair" sortKeyName="pair" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="Price" sortKeyName="price" />
              </th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">
                <SortHeader label="Spread" sortKeyName="spread" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="24h Volume" sortKeyName="volume" />
              </th>
              <th className="px-4 py-3 text-center hidden md:table-cell">
                <SortHeader label="Trust" sortKeyName="trust" />
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Trade
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {paginatedTickers.map((ticker, index) => (
              <motion.tr
                key={`${ticker.market.identifier}-${ticker.target}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-gray-700/20 transition-colors"
              >
                {/* Exchange */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {ticker.market.logo && (
                      <img
                        src={ticker.market.logo}
                        alt={ticker.market.name}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-white">
                      {ticker.market.name}
                    </span>
                    {ticker.market.has_trading_incentive && (
                      <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                        ⚡
                      </span>
                    )}
                  </div>
                </td>

                {/* Pair */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-300">
                    {ticker.base}/{ticker.target}
                  </span>
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-white">
                    {formatPrice(ticker.converted_last.usd)}
                  </span>
                </td>

                {/* Spread */}
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className={`text-sm ${
                    ticker.bid_ask_spread_percentage > 1 
                      ? 'text-red-400' 
                      : ticker.bid_ask_spread_percentage > 0.5 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                  }`}>
                    {ticker.bid_ask_spread_percentage?.toFixed(2) || '-'}%
                  </span>
                </td>

                {/* Volume */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-gray-300">
                    {formatVolume(ticker.converted_volume.usd)}
                  </span>
                </td>

                {/* Trust Score */}
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${getTrustColor(ticker.trust_score)}`}
                      title={ticker.trust_score || 'Unknown'}
                    />
                  </div>
                </td>

                {/* Trade */}
                <td className="px-4 py-3 text-center">
                  {ticker.trade_url ? (
                    <a
                      href={ticker.trade_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded transition-colors"
                    >
                      Trade
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-gray-600 text-xs">-</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredTickers.length)} of {filteredTickers.length}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-amber-500 text-gray-900 font-medium'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTickers.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-400">No trading pairs found</p>
        </div>
      )}
    </div>
  );
}
