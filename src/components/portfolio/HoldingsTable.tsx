'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  Plus,
  Minus,
  History
} from 'lucide-react';
import { Holding } from './PortfolioProvider';

interface HoldingWithPrice extends Holding {
  currentPrice: number;
  change24h: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
  image?: string;
}

interface HoldingsTableProps {
  holdings: HoldingWithPrice[];
  onAddTransaction?: (coinId: string) => void;
  onSellTransaction?: (coinId: string) => void;
  isLoading?: boolean;
}

export function HoldingsTable({ 
  holdings, 
  onAddTransaction, 
  onSellTransaction,
  isLoading = false 
}: HoldingsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'value' | 'profitLoss' | 'change24h'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedHoldings = [...holdings].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'value':
        comparison = a.value - b.value;
        break;
      case 'profitLoss':
        comparison = a.profitLoss - b.profitLoss;
        break;
      case 'change24h':
        comparison = a.change24h - b.change24h;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                Asset
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                Holdings
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                Avg. Buy
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                Current Price
              </th>
              <th className="px-4 py-4 text-right">
                <button
                  onClick={() => handleSort('value')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                >
                  Value
                  {sortField === 'value' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-4 text-right">
                <button
                  onClick={() => handleSort('profitLoss')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                >
                  P&L
                  {sortField === 'profitLoss' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-4 text-right hidden md:table-cell">
                <button
                  onClick={() => handleSort('change24h')}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-auto"
                >
                  24h
                  {sortField === 'change24h' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                Allocation
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map(holding => (
              <React.Fragment key={holding.coinId}>
                <tr 
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link href={`/coin/${holding.coinId}`} className="flex items-center gap-3 group">
                      {holding.image ? (
                        <img src={holding.image} alt={holding.coinName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                          {holding.coinSymbol.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {holding.coinName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {holding.coinSymbol.toUpperCase()}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {holding.coinSymbol.toUpperCase()}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300">
                    ${holding.averageBuyPrice.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: holding.averageBuyPrice < 1 ? 6 : 2 
                    })}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                    ${holding.currentPrice.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: holding.currentPrice < 1 ? 6 : 2 
                    })}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className={`flex items-center justify-end gap-1 font-medium ${
                      holding.profitLoss >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holding.profitLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <div>
                        <p>{holding.profitLoss >= 0 ? '+' : '-'}${Math.abs(holding.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs">{holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right hidden md:table-cell">
                    <span className={`font-medium ${
                      holding.change24h >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(holding.allocation, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 w-12">
                        {holding.allocation.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onAddTransaction && (
                        <button
                          onClick={() => onAddTransaction(holding.coinId)}
                          className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Buy more"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      {onSellTransaction && (
                        <button
                          onClick={() => onSellTransaction(holding.coinId)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Sell"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedRow(expandedRow === holding.coinId ? null : holding.coinId)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        title="Transaction history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded transaction history */}
                {expandedRow === holding.coinId && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Transaction History
                        </h4>
                        {holding.transactions.length > 0 ? (
                          <div className="space-y-2">
                            {holding.transactions.slice().reverse().map(tx => (
                              <div 
                                key={tx.id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    tx.type === 'buy' || tx.type === 'transfer_in'
                                      ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                  }`}>
                                    {tx.type === 'buy' || tx.type === 'transfer_in' ? (
                                      <Plus className="w-4 h-4" />
                                    ) : (
                                      <Minus className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                                      {tx.type.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(tx.date).toLocaleDateString()}
                                      {tx.exchange && ` • ${tx.exchange}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {tx.amount.toLocaleString()} {holding.coinSymbol.toUpperCase()}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @ ${tx.pricePerCoin.toLocaleString()} = ${tx.totalValue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsTable;
