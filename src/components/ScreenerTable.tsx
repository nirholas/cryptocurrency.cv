/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  image?: string;
}

interface ScreenerTableProps {
  coins: CoinData[];
  className?: string;
}

type SortKey =
  | 'market_cap_rank'
  | 'name'
  | 'current_price'
  | 'price_change_percentage_24h'
  | 'price_change_percentage_1h_in_currency'
  | 'price_change_percentage_7d_in_currency'
  | 'market_cap'
  | 'total_volume'
  | 'circulating_supply';

type SortDir = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface Filters {
  search: string;
  minPrice: string;
  maxPrice: string;
  minMcap: string;
  maxMcap: string;
  minVolume: string;
  maxVolume: string;
  minChange: string;
  maxChange: string;
}

type ColumnId = 'rank' | 'name' | 'price' | '1h' | '24h' | '7d' | 'mcap' | 'volume' | 'supply';

interface ColumnDef {
  id: ColumnId;
  label: string;
  sortKey: SortKey;
  defaultVisible: boolean;
}

const COLUMNS: ColumnDef[] = [
  { id: 'rank', label: '#', sortKey: 'market_cap_rank', defaultVisible: true },
  { id: 'name', label: 'Name', sortKey: 'name', defaultVisible: true },
  { id: 'price', label: 'Price', sortKey: 'current_price', defaultVisible: true },
  {
    id: '1h',
    label: '1h %',
    sortKey: 'price_change_percentage_1h_in_currency',
    defaultVisible: true,
  },
  { id: '24h', label: '24h %', sortKey: 'price_change_percentage_24h', defaultVisible: true },
  {
    id: '7d',
    label: '7d %',
    sortKey: 'price_change_percentage_7d_in_currency',
    defaultVisible: true,
  },
  { id: 'mcap', label: 'Market Cap', sortKey: 'market_cap', defaultVisible: true },
  { id: 'volume', label: 'Volume (24h)', sortKey: 'total_volume', defaultVisible: true },
  {
    id: 'supply',
    label: 'Circulating Supply',
    sortKey: 'circulating_supply',
    defaultVisible: false,
  },
];

const PER_PAGE_OPTIONS = [25, 50, 100] as const;

function formatPrice(n: number): string {
  if (n >= 1)
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(8)}`;
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatSupply(n: number, symbol: string): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
  return `${n.toLocaleString()} ${symbol.toUpperCase()}`;
}

function parseNum(s: string): number | null {
  if (!s.trim()) return null;
  const v = Number(s.replace(/[,$]/g, ''));
  return isNaN(v) ? null : v;
}

function ChangeCell({ value }: { value: number | undefined }) {
  if (value == null) return <span className="text-text-secondary">—</span>;
  return (
    <span
      className={cn('font-medium tabular-nums', value >= 0 ? 'text-green-500' : 'text-red-500')}
    >
      {value >= 0 ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

export default function ScreenerTable({ coins, className }: ScreenerTableProps) {
  const [sort, setSort] = useState<SortState>({
    key: 'market_cap_rank',
    dir: 'asc',
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    minPrice: '',
    maxPrice: '',
    minMcap: '',
    maxMcap: '',
    minVolume: '',
    maxVolume: '',
    minChange: '',
    maxChange: '',
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [visibleCols, setVisibleCols] = useState<Set<ColumnId>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    );
    setPage(1);
  }, []);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const toggleColumn = useCallback((id: ColumnId) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 2) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let data = [...coins];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
      );
    }

    // Numeric range filters
    const minPrice = parseNum(filters.minPrice);
    const maxPrice = parseNum(filters.maxPrice);
    const minMcap = parseNum(filters.minMcap);
    const maxMcap = parseNum(filters.maxMcap);
    const minVol = parseNum(filters.minVolume);
    const maxVol = parseNum(filters.maxVolume);
    const minChg = parseNum(filters.minChange);
    const maxChg = parseNum(filters.maxChange);

    if (minPrice != null) data = data.filter((c) => c.current_price >= minPrice);
    if (maxPrice != null) data = data.filter((c) => c.current_price <= maxPrice);
    if (minMcap != null) data = data.filter((c) => c.market_cap >= minMcap);
    if (maxMcap != null) data = data.filter((c) => c.market_cap <= maxMcap);
    if (minVol != null) data = data.filter((c) => c.total_volume >= minVol);
    if (maxVol != null) data = data.filter((c) => c.total_volume <= maxVol);
    if (minChg != null) data = data.filter((c) => c.price_change_percentage_24h >= minChg);
    if (maxChg != null) data = data.filter((c) => c.price_change_percentage_24h <= maxChg);

    return data;
  }, [coins, filters]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    const { key, dir } = sort;
    data.sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      if (key === 'name') {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else {
        av = (a[key as keyof CoinData] as number) ?? 0;
        bv = (b[key as keyof CoinData] as number) ?? 0;
      }

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageData = sorted.slice((page - 1) * perPage, page * perPage);

  const exportCsv = useCallback(() => {
    const headers = COLUMNS.filter((c) => visibleCols.has(c.id)).map((c) => c.label);
    const rows = sorted.map((coin) => {
      const row: string[] = [];
      if (visibleCols.has('rank')) row.push(String(coin.market_cap_rank));
      if (visibleCols.has('name')) row.push(`${coin.name} (${coin.symbol.toUpperCase()})`);
      if (visibleCols.has('price')) row.push(String(coin.current_price));
      if (visibleCols.has('1h'))
        row.push(String(coin.price_change_percentage_1h_in_currency ?? ''));
      if (visibleCols.has('24h')) row.push(String(coin.price_change_percentage_24h));
      if (visibleCols.has('7d'))
        row.push(String(coin.price_change_percentage_7d_in_currency ?? ''));
      if (visibleCols.has('mcap')) row.push(String(coin.market_cap));
      if (visibleCols.has('volume')) row.push(String(coin.total_volume));
      if (visibleCols.has('supply')) row.push(String(coin.circulating_supply));
      return row.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crypto-screener.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, visibleCols]);

  const activeCols = COLUMNS.filter((c) => visibleCols.has(c.id));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search coins..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="border-border text-text-primary placeholder:text-text-secondary focus:ring-accent h-9 w-56 rounded-md border bg-(--color-surface) px-3 text-sm focus:ring-2 focus:outline-none"
        />
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowColumns(!showColumns)}>
          Columns
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
        <span className="text-text-secondary ml-auto text-xs">{filtered.length} coins</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="border-border grid grid-cols-2 gap-3 rounded-lg border bg-(--color-surface) p-4 sm:grid-cols-4">
          {(
            [
              ['minPrice', 'Min Price'],
              ['maxPrice', 'Max Price'],
              ['minMcap', 'Min Market Cap'],
              ['maxMcap', 'Max Market Cap'],
              ['minVolume', 'Min Volume'],
              ['maxVolume', 'Max Volume'],
              ['minChange', 'Min 24h %'],
              ['maxChange', 'Max 24h %'],
            ] as [keyof Filters, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-text-secondary mb-1 block text-xs">{label}</label>
              <input
                type="text"
                value={filters[key]}
                onChange={(e) => updateFilter(key, e.target.value)}
                placeholder="Any"
                className="border-border text-text-primary focus:ring-accent h-8 w-full rounded-md border bg-(--color-surface) px-2 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Column visibility */}
      {showColumns && (
        <div className="border-border flex flex-wrap gap-2 rounded-lg border bg-(--color-surface) p-3">
          {COLUMNS.map((col) => (
            <label key={col.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={visibleCols.has(col.id)}
                onChange={() => toggleColumn(col.id)}
                className="rounded"
              />
              <span className="text-text-secondary">{col.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border-border -webkit-overflow-scrolling-touch overflow-x-auto rounded-lg border">
        <table className="w-full min-w-150 text-sm">
          <thead>
            <tr className="border-border border-b bg-(--color-surface)">
              {activeCols.map((col) => (
                <th
                  key={col.id}
                  className="text-text-secondary hover:text-text-primary cursor-pointer px-3 py-2.5 text-left font-medium whitespace-nowrap select-none"
                  onClick={() => handleSort(col.sortKey)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sort.key === col.sortKey && (
                      <span className="text-accent">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length} className="text-text-secondary py-10 text-center">
                  No coins match your filters
                </td>
              </tr>
            ) : (
              pageData.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-border border-b transition-colors hover:bg-(--color-surface)"
                >
                  {visibleCols.has('rank') && (
                    <td className="text-text-secondary px-3 py-2.5 tabular-nums">
                      {coin.market_cap_rank}
                    </td>
                  )}
                  {visibleCols.has('name') && (
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {coin.image && (
                          <img
                            src={coin.image}
                            alt=""
                            width={20}
                            height={20}
                            className="rounded-full"
                            loading="lazy"
                          />
                        )}
                        <span className="text-text-primary font-medium">{coin.name}</span>
                        <span className="text-text-secondary text-xs uppercase">{coin.symbol}</span>
                      </div>
                    </td>
                  )}
                  {visibleCols.has('price') && (
                    <td className="text-text-primary px-3 py-2.5 font-medium whitespace-nowrap tabular-nums">
                      {formatPrice(coin.current_price)}
                    </td>
                  )}
                  {visibleCols.has('1h') && (
                    <td className="px-3 py-2.5">
                      <ChangeCell value={coin.price_change_percentage_1h_in_currency} />
                    </td>
                  )}
                  {visibleCols.has('24h') && (
                    <td className="px-3 py-2.5">
                      <ChangeCell value={coin.price_change_percentage_24h} />
                    </td>
                  )}
                  {visibleCols.has('7d') && (
                    <td className="px-3 py-2.5">
                      <ChangeCell value={coin.price_change_percentage_7d_in_currency} />
                    </td>
                  )}
                  {visibleCols.has('mcap') && (
                    <td className="text-text-primary px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {formatCompact(coin.market_cap)}
                    </td>
                  )}
                  {visibleCols.has('volume') && (
                    <td className="text-text-primary px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {formatCompact(coin.total_volume)}
                    </td>
                  )}
                  {visibleCols.has('supply') && (
                    <td className="text-text-primary px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {formatSupply(coin.circulating_supply, coin.symbol)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-text-secondary flex items-center gap-2 text-sm">
          <span>Rows:</span>
          {PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => {
                setPerPage(n);
                setPage(1);
              }}
              className={cn(
                'rounded px-2 py-0.5 text-sm',
                perPage === n ? 'bg-accent text-white' : 'hover:text-text-primary',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </Button>
          <span className="text-text-secondary text-sm tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
