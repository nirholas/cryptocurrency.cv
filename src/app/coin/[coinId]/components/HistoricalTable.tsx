/**
 * HistoricalTable Component - Historical OHLCV data with CSV export
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { OHLCData } from '@/lib/market-data';

interface HistoricalTableProps {
  ohlcData: OHLCData[];
  coinId: string;
  coinSymbol: string;
  coinName: string;
}

const ITEMS_PER_PAGE = 30;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(8);
}

function formatPercent(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(2) + '%';
}

export default function HistoricalTable({
  ohlcData,
  coinId,
  coinSymbol,
  coinName,
}: HistoricalTableProps) {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // Filter data by date range
  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };

    const cutoff = now - ranges[dateRange];
    return ohlcData
      .filter((d) => d.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [ohlcData, dateRange]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Calculate daily change
  const getChange = useCallback((data: OHLCData) => {
    return ((data.close - data.open) / data.open) * 100;
  }, []);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Change (%)'];
    const rows = filteredData.map((d) => [
      new Date(d.timestamp).toISOString().split('T')[0],
      d.open.toString(),
      d.high.toString(),
      d.low.toString(),
      d.close.toString(),
      getChange(d).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${coinId}-historical-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, coinId, dateRange, getChange]);

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Historical Data
            </h3>
            <p className="text-sm text-gray-400">
              {filteredData.length} data points for {coinName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex bg-gray-900 rounded-lg p-0.5">
              {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateRange === range
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Open
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                High
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Low
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Close
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {paginatedData.map((data, index) => {
              const change = getChange(data);
              const isPositive = change >= 0;

              return (
                <motion.tr
                  key={data.timestamp}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-700/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">
                      {formatDate(data.timestamp)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">
                      {formatPrice(data.open)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-green-400">
                      {formatPrice(data.high)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-red-400">
                      {formatPrice(data.low)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-white">
                      {formatPrice(data.close)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatPercent(change)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {filteredData.length > 0 && (
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Period High</span>
              <p className="text-green-400 font-medium">
                {formatPrice(Math.max(...filteredData.map((d) => d.high)))}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Period Low</span>
              <p className="text-red-400 font-medium">
                {formatPrice(Math.min(...filteredData.map((d) => d.low)))}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Avg Close</span>
              <p className="text-white font-medium">
                {formatPrice(
                  filteredData.reduce((sum, d) => sum + d.close, 0) / filteredData.length
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Period Change</span>
              {filteredData.length > 1 && (
                <p
                  className={`font-medium ${
                    filteredData[0].close >= filteredData[filteredData.length - 1].close
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {formatPercent(
                    ((filteredData[0].close - filteredData[filteredData.length - 1].close) /
                      filteredData[filteredData.length - 1].close) *
                      100
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Previous
            </button>
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
      {filteredData.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-400">No historical data available</p>
        </div>
      )}
    </div>
  );
}
