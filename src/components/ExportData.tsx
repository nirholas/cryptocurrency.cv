'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface ExportableData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

function convertToCSV(data: ExportableData): string {
  const escape = (val: string | number): string => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = data.headers.map(escape).join(',');
  const dataRows = data.rows.map((row) => row.map(escape).join(','));

  return [headerRow, ...dataRows].join('\n');
}

function convertToJSON(data: ExportableData): string {
  const objects = data.rows.map((row) => {
    const obj: Record<string, string | number> = {};
    data.headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ExportButtonProps {
  getData: () => ExportableData;
  label?: string;
  className?: string;
}

export function ExportButton({ getData, label = 'Export', className = '' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const data = getData();
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${data.filename}-${timestamp}.csv`, 'text/csv');
      } else {
        const json = convertToJSON(data);
        downloadFile(json, `${data.filename}-${timestamp}.json`, 'application/json');
      }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-black transition-colors disabled:opacity-50 ${className}`}
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        {exporting ? 'Exporting...' : label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-black transition-colors"
            >
              <TableCellsIcon className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-black transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Preset export helpers for common data types
export function exportPortfolio(
  holdings: Array<{
    symbol: string;
    name: string;
    amount: number;
    price: number;
    value: number;
    change24h: number;
  }>
) {
  return {
    headers: ['Symbol', 'Name', 'Amount', 'Price (USD)', 'Value (USD)', '24h Change %'],
    rows: holdings.map((h) => [
      h.symbol.toUpperCase(),
      h.name,
      h.amount,
      h.price.toFixed(2),
      h.value.toFixed(2),
      h.change24h.toFixed(2),
    ]),
    filename: 'portfolio',
  };
}

export function exportWatchlist(
  coins: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume: number;
  }>
) {
  return {
    headers: ['Symbol', 'Name', 'Price (USD)', '24h Change %', 'Market Cap', 'Volume 24h'],
    rows: coins.map((c) => [
      c.symbol.toUpperCase(),
      c.name,
      c.price,
      c.change24h.toFixed(2),
      c.marketCap,
      c.volume,
    ]),
    filename: 'watchlist',
  };
}

export function exportMarketData(
  coins: Array<{
    rank: number;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    change7d?: number;
    marketCap: number;
    volume: number;
    athChange: number;
  }>
) {
  return {
    headers: [
      'Rank',
      'Symbol',
      'Name',
      'Price (USD)',
      '24h %',
      '7d %',
      'Market Cap',
      'Volume 24h',
      'ATH %',
    ],
    rows: coins.map((c) => [
      c.rank,
      c.symbol.toUpperCase(),
      c.name,
      c.price,
      c.change24h?.toFixed(2) ?? '-',
      c.change7d?.toFixed(2) ?? '-',
      c.marketCap,
      c.volume,
      c.athChange?.toFixed(2) ?? '-',
    ]),
    filename: 'market-data',
  };
}
