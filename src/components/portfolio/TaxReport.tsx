'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Calculator
} from 'lucide-react';
import { usePortfolio, Transaction } from '@/components/portfolio/PortfolioProvider';

interface TaxableEvent {
  id: string;
  date: string;
  type: 'sell' | 'trade';
  asset: string;
  amount: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  holdingPeriod: 'short' | 'long';
  isWash?: boolean;
}

interface TaxSummary {
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  taxableEvents: number;
}

const TAX_YEAR_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
];

const COST_BASIS_METHODS = [
  { value: 'fifo', label: 'FIFO (First In, First Out)', description: 'Oldest purchases are sold first' },
  { value: 'lifo', label: 'LIFO (Last In, First Out)', description: 'Newest purchases are sold first' },
  { value: 'hifo', label: 'HIFO (Highest In, First Out)', description: 'Highest cost purchases are sold first - minimizes gains' },
  { value: 'average', label: 'Average Cost', description: 'Uses average cost of all purchases' },
];

export function TaxReport() {
  const { transactions } = usePortfolio();
  const [taxYear, setTaxYear] = useState('2025');
  const [costBasisMethod, setCostBasisMethod] = useState('fifo');
  const [showMethodInfo, setShowMethodInfo] = useState(false);

  // Calculate taxable events based on transactions
  const { taxableEvents, summary } = useMemo(() => {
    const events: TaxableEvent[] = [];
    const buys: Record<string, { date: string; amount: number; price: number }[]> = {};

    // Sort transactions by date
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter by tax year
    const yearStart = new Date(`${taxYear}-01-01`).getTime();
    const yearEnd = new Date(`${Number(taxYear) + 1}-01-01`).getTime();

    sortedTx.forEach((tx) => {
      const txDate = new Date(tx.date).getTime();
      const coinKey = tx.coinId;

      if (tx.type === 'buy') {
        // Track buys for cost basis calculation
        if (!buys[coinKey]) buys[coinKey] = [];
        buys[coinKey].push({
          date: tx.date,
          amount: tx.amount,
          price: tx.pricePerCoin,
        });

        // Sort based on method
        if (costBasisMethod === 'lifo') {
          buys[coinKey].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else if (costBasisMethod === 'hifo') {
          buys[coinKey].sort((a, b) => b.price - a.price);
        }
        // FIFO is default order
      } else if (tx.type === 'sell' && txDate >= yearStart && txDate < yearEnd) {
        // Calculate gain/loss
        let remainingToSell = tx.amount;
        let totalCostBasis = 0;
        let earliestBuyDate: string | null = null;

        const coinBuys = buys[coinKey] || [];

        if (costBasisMethod === 'average') {
          // Average cost method
          const totalAmount = coinBuys.reduce((sum, b) => sum + b.amount, 0);
          const totalCost = coinBuys.reduce((sum, b) => sum + b.amount * b.price, 0);
          const avgPrice = totalAmount > 0 ? totalCost / totalAmount : 0;
          totalCostBasis = tx.amount * avgPrice;
          earliestBuyDate = coinBuys[0]?.date || tx.date;
        } else {
          // FIFO, LIFO, or HIFO
          for (let i = 0; i < coinBuys.length && remainingToSell > 0; i++) {
            const buy = coinBuys[i];
            const sellFromThis = Math.min(buy.amount, remainingToSell);
            totalCostBasis += sellFromThis * buy.price;
            remainingToSell -= sellFromThis;
            buy.amount -= sellFromThis;

            if (!earliestBuyDate) earliestBuyDate = buy.date;
          }
          // Remove depleted buys
          buys[coinKey] = coinBuys.filter((b) => b.amount > 0);
        }

        const proceeds = tx.amount * tx.pricePerCoin;
        const gainLoss = proceeds - totalCostBasis;

        // Determine holding period (short = < 1 year, long = >= 1 year)
        const buyDate = new Date(earliestBuyDate || tx.date).getTime();
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        const holdingPeriod: 'short' | 'long' = txDate - buyDate >= oneYear ? 'long' : 'short';

        events.push({
          id: tx.id,
          date: tx.date,
          type: 'sell',
          asset: tx.coinName,
          amount: tx.amount,
          proceeds,
          costBasis: totalCostBasis,
          gainLoss,
          holdingPeriod,
        });
      }
    });

    // Calculate summary
    const summary: TaxSummary = {
      shortTermGains: 0,
      shortTermLosses: 0,
      longTermGains: 0,
      longTermLosses: 0,
      netShortTerm: 0,
      netLongTerm: 0,
      totalGains: 0,
      totalLosses: 0,
      netGainLoss: 0,
      taxableEvents: events.length,
    };

    events.forEach((e) => {
      if (e.holdingPeriod === 'short') {
        if (e.gainLoss >= 0) {
          summary.shortTermGains += e.gainLoss;
        } else {
          summary.shortTermLosses += Math.abs(e.gainLoss);
        }
      } else {
        if (e.gainLoss >= 0) {
          summary.longTermGains += e.gainLoss;
        } else {
          summary.longTermLosses += Math.abs(e.gainLoss);
        }
      }
    });

    summary.netShortTerm = summary.shortTermGains - summary.shortTermLosses;
    summary.netLongTerm = summary.longTermGains - summary.longTermLosses;
    summary.totalGains = summary.shortTermGains + summary.longTermGains;
    summary.totalLosses = summary.shortTermLosses + summary.longTermLosses;
    summary.netGainLoss = summary.netShortTerm + summary.netLongTerm;

    return { taxableEvents: events, summary };
  }, [transactions, taxYear, costBasisMethod]);

  const exportCSV = () => {
    const headers = ['Date', 'Asset', 'Amount', 'Proceeds', 'Cost Basis', 'Gain/Loss', 'Holding Period'];
    const rows = taxableEvents.map((e) => [
      e.date,
      e.asset,
      e.amount.toFixed(8),
      e.proceeds.toFixed(2),
      e.costBasis.toFixed(2),
      e.gainLoss.toFixed(2),
      e.holdingPeriod,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-tax-report-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return value < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Report Generator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tax Year */}
          <div>
            <label htmlFor="tax-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tax Year
            </label>
            <select
              id="tax-year"
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {TAX_YEAR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Basis Method */}
          <div className="md:col-span-2">
            <label htmlFor="cost-basis-method" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cost Basis Method
              <button
                onClick={() => setShowMethodInfo(!showMethodInfo)}
                className="text-blue-500 hover:text-blue-600"
              >
                <Info className="w-4 h-4" />
              </button>
            </label>
            <select
              id="cost-basis-method"
              value={costBasisMethod}
              onChange={(e) => setCostBasisMethod(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {COST_BASIS_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {showMethodInfo && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                {COST_BASIS_METHODS.find((m) => m.value === costBasisMethod)?.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm">Short-Term Gains</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.netShortTerm)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Held &lt; 1 year (ordinary income rates)</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm">Long-Term Gains</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.netLongTerm)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Held ≥ 1 year (preferential rates)</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Net Gain/Loss</span>
          </div>
          <p className={`text-2xl font-bold ${summary.netGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(summary.netGainLoss)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary.taxableEvents} taxable events</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm">Total Losses</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalLosses)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Can offset gains (up to $3,000/yr excess)</p>
        </div>
      </div>

      {/* Taxable Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Taxable Events</h3>
          </div>
          <button
            onClick={exportCSV}
            disabled={taxableEvents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {taxableEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No taxable events found for {taxYear}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add sell transactions to see your tax report
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asset</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proceeds</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cost Basis</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gain/Loss</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {taxableEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {event.asset}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {event.amount.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(event.proceeds)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {formatCurrency(event.costBasis)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${
                      event.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(event.gainLoss)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.holdingPeriod === 'long'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}>
                        {event.holdingPeriod === 'long' ? 'Long' : 'Short'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Disclaimer
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          This report is for informational purposes only and should not be considered tax advice. 
          Cryptocurrency tax laws vary by jurisdiction and are subject to change. Please consult 
          with a qualified tax professional for advice specific to your situation. This tool does 
          not account for all possible taxable events such as staking rewards, airdrops, or DeFi 
          transactions.
        </p>
      </div>
    </div>
  );
}
