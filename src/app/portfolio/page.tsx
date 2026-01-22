'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  PieChart,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { usePortfolio, Holding } from '@/components/portfolio/PortfolioProvider';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { AddHoldingModal } from '@/components/portfolio/AddHoldingModal';
import { useToast } from '@/components/Toast';
import { getTopCoins, TokenPrice } from '@/lib/market-data';

interface HoldingWithPrice extends Holding {
  currentPrice: number;
  change24h: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
  image?: string;
}

export default function PortfolioPage() {
  const { holdings, transactions, clearPortfolio, exportPortfolio, importPortfolio, isLoaded } = usePortfolio();
  const { addToast } = useToast();

  const [holdingsWithPrices, setHoldingsWithPrices] = useState<HoldingWithPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Fetch prices for holdings
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) {
      setHoldingsWithPrices([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const allCoins = await getTopCoins(250);
      const coinMap = new Map(allCoins.map(c => [c.id, c]));

      let totalValue = 0;
      const enrichedHoldings: HoldingWithPrice[] = holdings.map(holding => {
        const coin = coinMap.get(holding.coinId);
        const currentPrice = coin?.current_price || 0;
        const change24h = coin?.price_change_percentage_24h || 0;
        const value = holding.amount * currentPrice;
        const profitLoss = value - holding.totalCost;
        const profitLossPercent = holding.totalCost > 0 ? (profitLoss / holding.totalCost) * 100 : 0;

        totalValue += value;

        return {
          ...holding,
          currentPrice,
          change24h,
          value,
          profitLoss,
          profitLossPercent,
          allocation: 0, // Will calculate after total
          image: coin?.image,
        };
      });

      // Calculate allocation percentages
      enrichedHoldings.forEach(h => {
        h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
      });

      setHoldingsWithPrices(enrichedHoldings);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError('Failed to load price data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [holdings]);

  useEffect(() => {
    if (isLoaded) {
      fetchPrices();
    }
  }, [isLoaded, fetchPrices]);

  // Refresh prices periodically
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, fetchPrices]);

  // Calculate summary data
  const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdingsWithPrices.reduce((sum, h) => sum + h.totalCost, 0);
  const change24h = holdingsWithPrices.length > 0
    ? holdingsWithPrices.reduce((sum, h) => sum + (h.change24h * h.allocation / 100), 0)
    : 0;

  const sortedByChange = [...holdingsWithPrices].sort((a, b) => b.change24h - a.change24h);
  const bestPerformer = sortedByChange[0];
  const worstPerformer = sortedByChange[sortedByChange.length - 1];

  const handleExport = () => {
    const data = exportPortfolio();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Portfolio exported' });
  };

  const handleImport = () => {
    const result = importPortfolio(importText);
    if (result.success) {
      addToast({ type: 'success', title: 'Portfolio imported successfully' });
      setShowImportModal(false);
      setImportText('');
    } else {
      addToast({ type: 'error', title: 'Import failed', message: result.error });
    }
  };

  const handleClearPortfolio = () => {
    if (confirm('Are you sure you want to clear your entire portfolio? This cannot be undone.')) {
      clearPortfolio();
      addToast({ type: 'success', title: 'Portfolio cleared' });
    }
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Wallet className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (holdings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Wallet className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <PieChart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start tracking your portfolio
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Add your first transaction to start tracking your crypto holdings and performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Transaction
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import Portfolio
              </button>
            </div>
          </div>
        </div>

        {showAddModal && <AddHoldingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
        
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Portfolio</h3>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste your portfolio JSON here..."
                className="w-full h-48 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {holdings.length} asset{holdings.length !== 1 ? 's' : ''} • {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrices}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={fetchPrices} className="ml-auto text-sm font-medium underline">
              Retry
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="mb-8">
          <PortfolioSummary
            totalValue={totalValue}
            totalCost={totalCost}
            change24h={change24h}
            bestPerformer={bestPerformer ? { name: bestPerformer.coinName, change: bestPerformer.change24h } : undefined}
            worstPerformer={worstPerformer ? { name: worstPerformer.coinName, change: worstPerformer.change24h } : undefined}
            isLoading={isLoading}
          />
        </div>

        {/* Holdings Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Holdings</h2>
          <HoldingsTable
            holdings={holdingsWithPrices}
            onAddTransaction={(coinId) => {
              const holding = holdings.find(h => h.coinId === coinId);
              // You could open the modal with prefilled coin here
              setShowAddModal(true);
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            Data refreshes every minute
          </p>
          <button
            onClick={handleClearPortfolio}
            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline"
          >
            <Trash2 className="w-4 h-4" />
            Clear portfolio
          </button>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && <AddHoldingModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />}
        
        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Portfolio</h3>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste your portfolio JSON here..."
                className="w-full h-48 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
