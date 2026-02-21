'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePortfolio, Transaction } from './PortfolioProvider';

type TaxMethod = 'fifo' | 'lifo' | 'hifo' | 'average';
type TaxYear = '2024' | '2025' | '2026';

interface TaxLot {
  id: string;
  coinId: string;
  coinSymbol: string;
  purchaseDate: string;
  amount: number;
  remainingAmount: number;
  pricePerCoin: number;
  totalCost: number;
}

interface TaxableEvent {
  id: string;
  date: string;
  type: 'sale' | 'trade' | 'income' | 'gift';
  asset: string;
  coinId: string;
  amount: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  shortTerm: boolean;
  holdingPeriod: number; // days
  lots: TaxLotDisposal[];
}

interface TaxLotDisposal {
  lotId: string;
  purchaseDate: string;
  saleDate: string;
  amount: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  holdingDays: number;
}

interface TaxSummary {
  year: string;
  method: TaxMethod;
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalGainLoss: number;
  totalProceeds: number;
  totalCostBasis: number;
  transactionCount: number;
  lotDisposals: number;
  washSalesDisallowed: number;
  estimatedTaxShortTerm: number;
  estimatedTaxLongTerm: number;
}

interface Form8949Data {
  partI: TaxableEvent[]; // Short-term
  partII: TaxableEvent[]; // Long-term
}

const TAX_RATES = {
  shortTerm: {
    low: 0.10,
    mid: 0.22,
    high: 0.32,
    top: 0.37,
  },
  longTerm: {
    low: 0.0,
    mid: 0.15,
    high: 0.20,
  },
};

/**
 * Enterprise Tax Report Generator
 * 
 * Generates IRS-compliant tax reports for cryptocurrency transactions.
 * Supports FIFO, LIFO, HIFO, and Average Cost basis methods.
 * Tracks lot-by-lot disposals for Form 8949 reporting.
 * Identifies potential wash sales (30-day rule).
 */
export function TaxReportGenerator() {
  const { transactions } = usePortfolio();
  const [taxYear, setTaxYear] = useState<TaxYear>('2025');
  const [costMethod, setCostMethod] = useState<TaxMethod>('fifo');
  const [showLotDetails, setShowLotDetails] = useState(false);
  const [estimatedTaxBracket, setEstimatedTaxBracket] = useState<'low' | 'mid' | 'high' | 'top'>('mid');

  /**
   * Build tax lots from buy transactions
   * Each buy creates a new lot that can be disposed of later
   */
  const buildTaxLots = useCallback((txs: Transaction[]): Map<string, TaxLot[]> => {
    const lotsByCoin = new Map<string, TaxLot[]>();
    
    txs
      .filter(tx => tx.type === 'buy' || tx.type === 'transfer_in')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(tx => {
        const lots = lotsByCoin.get(tx.coinId) || [];
        lots.push({
          id: tx.id,
          coinId: tx.coinId,
          coinSymbol: tx.coinSymbol,
          purchaseDate: tx.date,
          amount: tx.amount,
          remainingAmount: tx.amount,
          pricePerCoin: tx.pricePerCoin,
          totalCost: tx.totalValue,
        });
        lotsByCoin.set(tx.coinId, lots);
      });
    
    return lotsByCoin;
  }, []);

  /**
   * Sort lots based on cost basis method
   */
  const sortLotsByMethod = useCallback((lots: TaxLot[], method: TaxMethod): TaxLot[] => {
    const sortedLots = [...lots];
    
    switch (method) {
      case 'fifo':
        // First In, First Out - oldest lots first
        return sortedLots.sort((a, b) => 
          new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
        );
      case 'lifo':
        // Last In, First Out - newest lots first
        return sortedLots.sort((a, b) => 
          new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );
      case 'hifo':
        // Highest In, First Out - highest cost lots first (minimizes gains)
        return sortedLots.sort((a, b) => b.pricePerCoin - a.pricePerCoin);
      case 'average':
        // For average cost, order doesn't matter but we'll use FIFO order
        return sortedLots.sort((a, b) => 
          new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
        );
      default:
        return sortedLots;
    }
  }, []);

  /**
   * Calculate average cost basis for a coin
   */
  const calculateAverageCost = useCallback((lots: TaxLot[]): number => {
    const totalCost = lots.reduce((sum, lot) => sum + (lot.remainingAmount * lot.pricePerCoin), 0);
    const totalAmount = lots.reduce((sum, lot) => sum + lot.remainingAmount, 0);
    return totalAmount > 0 ? totalCost / totalAmount : 0;
  }, []);

  /**
   * Calculate holding period in days
   */
  const calculateHoldingDays = useCallback((purchaseDate: string, saleDate: string): number => {
    const purchase = new Date(purchaseDate);
    const sale = new Date(saleDate);
    return Math.floor((sale.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  /**
   * Check for potential wash sales
   * A wash sale occurs if you buy substantially identical stock/crypto
   * within 30 days before or after selling at a loss
   */
  const identifyWashSales = useCallback((
    saleTx: Transaction,
    allTxs: Transaction[],
    gainLoss: number
  ): boolean => {
    if (gainLoss >= 0) return false; // Only losses can trigger wash sales
    
    const saleDate = new Date(saleTx.date);
    const thirtyDaysBefore = new Date(saleDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAfter = new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Check if there's a buy of the same coin within 30 days
    return allTxs.some(tx => {
      if (tx.coinId !== saleTx.coinId) return false;
      if (tx.type !== 'buy' && tx.type !== 'transfer_in') return false;
      if (tx.id === saleTx.id) return false;
      
      const txDate = new Date(tx.date);
      return txDate >= thirtyDaysBefore && txDate <= thirtyDaysAfter;
    });
  }, []);

  /**
   * Generate the complete tax report
   */
  const { report, form8949 } = useMemo(() => {
    // Clone lots for manipulation
    const lotsByCoin = buildTaxLots(transactions);
    
    // Filter sales for the tax year
    const yearStart = new Date(`${taxYear}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${parseInt(taxYear) + 1}-01-01T00:00:00Z`);
    
    const salesInYear = transactions
      .filter(tx => tx.type === 'sell' || tx.type === 'transfer_out')
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= yearStart && txDate < yearEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const taxableEvents: TaxableEvent[] = [];
    let totalWashSales = 0;

    // Process each sale
    salesInYear.forEach(saleTx => {
      const coinLots = lotsByCoin.get(saleTx.coinId) || [];
      const sortedLots = sortLotsByMethod(
        coinLots.filter(lot => lot.remainingAmount > 0),
        costMethod
      );

      let remainingToSell = saleTx.amount;
      let totalCostBasis = 0;
      const lotDisposals: TaxLotDisposal[] = [];
      let earliestPurchaseDate = saleTx.date;
      let totalHoldingDays = 0;
      let disposalCount = 0;

      if (costMethod === 'average') {
        // Average cost method - use weighted average
        const avgCost = calculateAverageCost(sortedLots);
        totalCostBasis = remainingToSell * avgCost;
        
        // For holding period, use earliest lot as reference
        if (sortedLots.length > 0) {
          earliestPurchaseDate = sortedLots[0].purchaseDate;
        }
        
        // Reduce lots proportionally
        let sellRemaining = remainingToSell;
        for (const lot of sortedLots) {
          if (sellRemaining <= 0) break;
          const sellFromLot = Math.min(lot.remainingAmount, sellRemaining);
          
          lotDisposals.push({
            lotId: lot.id,
            purchaseDate: lot.purchaseDate,
            saleDate: saleTx.date,
            amount: sellFromLot,
            costBasis: sellFromLot * avgCost,
            proceeds: sellFromLot * saleTx.pricePerCoin,
            gainLoss: (sellFromLot * saleTx.pricePerCoin) - (sellFromLot * avgCost),
            holdingDays: calculateHoldingDays(lot.purchaseDate, saleTx.date),
          });
          
          lot.remainingAmount -= sellFromLot;
          sellRemaining -= sellFromLot;
          disposalCount++;
        }
        remainingToSell = 0;
      } else {
        // Specific identification (FIFO/LIFO/HIFO)
        for (const lot of sortedLots) {
          if (remainingToSell <= 0) break;
          if (lot.remainingAmount <= 0) continue;

          const sellFromLot = Math.min(lot.remainingAmount, remainingToSell);
          const lotCostBasis = sellFromLot * lot.pricePerCoin;
          const lotProceeds = sellFromLot * saleTx.pricePerCoin;
          const holdingDays = calculateHoldingDays(lot.purchaseDate, saleTx.date);

          lotDisposals.push({
            lotId: lot.id,
            purchaseDate: lot.purchaseDate,
            saleDate: saleTx.date,
            amount: sellFromLot,
            costBasis: lotCostBasis,
            proceeds: lotProceeds,
            gainLoss: lotProceeds - lotCostBasis,
            holdingDays,
          });

          totalCostBasis += lotCostBasis;
          totalHoldingDays += holdingDays * sellFromLot;
          lot.remainingAmount -= sellFromLot;
          remainingToSell -= sellFromLot;
          disposalCount++;

          if (new Date(lot.purchaseDate) < new Date(earliestPurchaseDate)) {
            earliestPurchaseDate = lot.purchaseDate;
          }
        }
      }

      // If we couldn't find enough lots, the remaining is treated as zero cost basis
      // (could be from transfers, airdrops, or data gaps)
      if (remainingToSell > 0) {
        totalCostBasis += 0; // Zero cost basis for unmatched
        lotDisposals.push({
          lotId: 'unmatched',
          purchaseDate: 'Unknown',
          saleDate: saleTx.date,
          amount: remainingToSell,
          costBasis: 0,
          proceeds: remainingToSell * saleTx.pricePerCoin,
          gainLoss: remainingToSell * saleTx.pricePerCoin,
          holdingDays: 0,
        });
      }

      const proceeds = saleTx.amount * saleTx.pricePerCoin;
      const gainLoss = proceeds - totalCostBasis;
      const avgHoldingDays = disposalCount > 0 
        ? Math.round(totalHoldingDays / saleTx.amount)
        : calculateHoldingDays(earliestPurchaseDate, saleTx.date);
      const isShortTerm = avgHoldingDays < 365;

      // Check for wash sales
      const isWashSale = identifyWashSales(saleTx, transactions, gainLoss);
      if (isWashSale && gainLoss < 0) {
        totalWashSales += Math.abs(gainLoss);
      }

      taxableEvents.push({
        id: saleTx.id,
        date: saleTx.date,
        type: 'sale',
        asset: saleTx.coinSymbol.toUpperCase(),
        coinId: saleTx.coinId,
        amount: saleTx.amount,
        costBasis: totalCostBasis,
        proceeds,
        gainLoss,
        shortTerm: isShortTerm,
        holdingPeriod: avgHoldingDays,
        lots: lotDisposals,
      });
    });

    // Calculate summary
    const shortTermEvents = taxableEvents.filter(e => e.shortTerm);
    const longTermEvents = taxableEvents.filter(e => !e.shortTerm);

    const shortTermGains = shortTermEvents
      .filter(e => e.gainLoss > 0)
      .reduce((sum, e) => sum + e.gainLoss, 0);
    const shortTermLosses = shortTermEvents
      .filter(e => e.gainLoss < 0)
      .reduce((sum, e) => sum + Math.abs(e.gainLoss), 0);
    const longTermGains = longTermEvents
      .filter(e => e.gainLoss > 0)
      .reduce((sum, e) => sum + e.gainLoss, 0);
    const longTermLosses = longTermEvents
      .filter(e => e.gainLoss < 0)
      .reduce((sum, e) => sum + Math.abs(e.gainLoss), 0);

    const netShortTerm = shortTermGains - shortTermLosses;
    const netLongTerm = longTermGains - longTermLosses;

    // Estimate taxes
    const stRate = TAX_RATES.shortTerm[estimatedTaxBracket];
    const ltRate = TAX_RATES.longTerm[estimatedTaxBracket === 'top' ? 'high' : estimatedTaxBracket === 'high' ? 'high' : estimatedTaxBracket];
    
    const summary: TaxSummary = {
      year: taxYear,
      method: costMethod,
      shortTermGains,
      shortTermLosses,
      longTermGains,
      longTermLosses,
      netShortTerm,
      netLongTerm,
      totalGainLoss: netShortTerm + netLongTerm,
      totalProceeds: taxableEvents.reduce((sum, e) => sum + e.proceeds, 0),
      totalCostBasis: taxableEvents.reduce((sum, e) => sum + e.costBasis, 0),
      transactionCount: taxableEvents.length,
      lotDisposals: taxableEvents.reduce((sum, e) => sum + e.lots.length, 0),
      washSalesDisallowed: totalWashSales,
      estimatedTaxShortTerm: Math.max(0, netShortTerm) * stRate,
      estimatedTaxLongTerm: Math.max(0, netLongTerm) * ltRate,
    };

    // Prepare Form 8949 data
    const form8949Data: Form8949Data = {
      partI: shortTermEvents,
      partII: longTermEvents,
    };

    return {
      report: { summary, events: taxableEvents },
      form8949: form8949Data,
    };
  }, [transactions, taxYear, costMethod, buildTaxLots, sortLotsByMethod, calculateAverageCost, calculateHoldingDays, identifyWashSales, estimatedTaxBracket]);

  /**
   * Export as CSV (IRS Schedule D format)
   */
  const exportCSV = useCallback(() => {
    if (!report) return;

    const headers = [
      'Description of Property',
      'Date Acquired',
      'Date Sold',
      'Proceeds',
      'Cost Basis',
      'Adjustment Code',
      'Adjustment Amount',
      'Gain or Loss',
    ];
    
    const rows = report.events.flatMap(e => 
      e.lots.map(lot => [
        `${e.amount.toFixed(8)} ${e.asset}`,
        lot.purchaseDate === 'Unknown' ? 'VARIOUS' : new Date(lot.purchaseDate).toLocaleDateString('en-US'),
        new Date(lot.saleDate).toLocaleDateString('en-US'),
        lot.proceeds.toFixed(2),
        lot.costBasis.toFixed(2),
        '', // Adjustment code (W for wash sales, etc.)
        '', // Adjustment amount
        lot.gainLoss.toFixed(2),
      ])
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-8949-${taxYear}-${costMethod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, taxYear, costMethod]);

  /**
   * Export detailed JSON report
   */
  const exportJSON = useCallback(() => {
    if (!report) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      taxYear,
      costBasisMethod: costMethod,
      summary: report.summary,
      taxableEvents: report.events,
      form8949: form8949,
      disclaimer: 'This report is for informational purposes only. Consult a tax professional.',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${taxYear}-${costMethod}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, form8949, taxYear, costMethod]);

  const formatCurrency = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '-' : ''}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === 'Unknown') return 'Various';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const hasTransactions = transactions.length > 0;
  const hasTaxableEvents = report.events.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tax Report Generator
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              IRS Form 8949 / Schedule D compliant crypto tax reporting
            </p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tax-year-gen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Year</label>
            <select
              id="tax-year-gen"
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value as TaxYear)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div>
            <label htmlFor="cost-method-gen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Basis Method</label>
            <select
              id="cost-method-gen"
              value={costMethod}
              onChange={(e) => setCostMethod(e.target.value as TaxMethod)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="fifo">FIFO (First In, First Out)</option>
              <option value="lifo">LIFO (Last In, First Out)</option>
              <option value="hifo">HIFO (Highest In, First Out)</option>
              <option value="average">Average Cost</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showLotDetails} onChange={(e) => setShowLotDetails(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show lot details</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Short-Term Net</p>
            <p className={`text-2xl font-bold mt-1 ${report.summary.netShortTerm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.summary.netShortTerm)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Long-Term Net</p>
            <p className={`text-2xl font-bold mt-1 ${report.summary.netLongTerm >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(report.summary.netLongTerm)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Gain/Loss</p>
            <p className={`text-2xl font-bold mt-1 ${report.summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.summary.totalGainLoss)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Est. Tax Liability</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">
              {formatCurrency(report.summary.estimatedTaxShortTerm + report.summary.estimatedTaxLongTerm)}
            </p>
          </div>
        </div>
      </div>

      {/* Events Table */}
      {hasTaxableEvents ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Asset</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Proceeds</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost Basis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Gain/Loss</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {report.events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatDate(event.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{event.asset}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 font-mono">{event.amount.toFixed(6)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(event.proceeds)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(event.costBasis)}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${event.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(event.gainLoss)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${event.shortTerm ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {event.shortTerm ? 'Short' : 'Long'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">No Taxable Events for {taxYear}</p>
          <p className="text-gray-500 mt-1">{hasTransactions ? 'No sell transactions found for this tax year.' : 'Add transactions to generate tax reports.'}</p>
        </div>
      )}

      {/* Export Actions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t flex gap-3 justify-end">
        <button onClick={exportCSV} disabled={!hasTaxableEvents} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
          Export CSV
        </button>
        <button onClick={exportJSON} disabled={!hasTaxableEvents} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          Export Full Report
        </button>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
        ⚠️ This report is for informational purposes only and should not be considered tax advice. Consult with a qualified tax professional for your specific situation.
      </div>
    </div>
  );
}

export default TaxReportGenerator;
