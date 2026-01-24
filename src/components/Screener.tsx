'use client';

import { useState, useMemo } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { ExportButton, exportMarketData } from './ExportData';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  ath: number;
  ath_change_percentage: number;
  circulating_supply: number;
  total_supply: number | null;
}

interface Filters {
  minMarketCap: string;
  maxMarketCap: string;
  minVolume: string;
  maxVolume: string;
  minChange24h: string;
  maxChange24h: string;
  minPrice: string;
  maxPrice: string;
  minAthDistance: string;
  maxAthDistance: string;
}

type SortField =
  | 'market_cap_rank'
  | 'current_price'
  | 'market_cap'
  | 'total_volume'
  | 'price_change_percentage_24h'
  | 'ath_change_percentage';
type SortDirection = 'asc' | 'desc';

const PRESET_FILTERS = [
  { name: 'Large Caps', filters: { minMarketCap: '10000000000', maxMarketCap: '' } },
  { name: 'Mid Caps', filters: { minMarketCap: '1000000000', maxMarketCap: '10000000000' } },
  { name: 'Small Caps', filters: { minMarketCap: '100000000', maxMarketCap: '1000000000' } },
  { name: 'Micro Caps', filters: { minMarketCap: '', maxMarketCap: '100000000' } },
  { name: 'Hot Today (+10%)', filters: { minChange24h: '10', maxChange24h: '' } },
  { name: 'Dipping (-10%)', filters: { minChange24h: '', maxChange24h: '-10' } },
  { name: 'Near ATH', filters: { minAthDistance: '-10', maxAthDistance: '0' } },
  { name: 'Far From ATH (-50%+)', filters: { minAthDistance: '', maxAthDistance: '-50' } },
  { name: 'High Volume', filters: { minVolume: '1000000000', maxVolume: '' } },
];

const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.0001) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
};

const formatPercent = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return '-';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
};

export function Screener({ coins }: { coins: Coin[] }) {
  const [filters, setFilters] = useState<Filters>({
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
    minChange24h: '',
    maxChange24h: '',
    minPrice: '',
    maxPrice: '',
    minAthDistance: '',
    maxAthDistance: '',
  });
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('market_cap_rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPreset = (preset: (typeof PRESET_FILTERS)[0]) => {
    setFilters((prev) => ({
      ...prev,
      minMarketCap: '',
      maxMarketCap: '',
      minVolume: '',
      maxVolume: '',
      minChange24h: '',
      maxChange24h: '',
      minAthDistance: '',
      maxAthDistance: '',
      ...preset.filters,
    }));
  };

  const clearFilters = () => {
    setFilters({
      minMarketCap: '',
      maxMarketCap: '',
      minVolume: '',
      maxVolume: '',
      minChange24h: '',
      maxChange24h: '',
      minPrice: '',
      maxPrice: '',
      minAthDistance: '',
      maxAthDistance: '',
    });
    setSearch('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'market_cap_rank' ? 'asc' : 'desc');
    }
  };

  const filteredCoins = useMemo(() => {
    return coins
      .filter((coin) => {
        // Search filter
        if (search) {
          const s = search.toLowerCase();
          if (!coin.name.toLowerCase().includes(s) && !coin.symbol.toLowerCase().includes(s)) {
            return false;
          }
        }

        // Market cap filter
        if (filters.minMarketCap && coin.market_cap < parseFloat(filters.minMarketCap))
          return false;
        if (filters.maxMarketCap && coin.market_cap > parseFloat(filters.maxMarketCap))
          return false;

        // Volume filter
        if (filters.minVolume && coin.total_volume < parseFloat(filters.minVolume)) return false;
        if (filters.maxVolume && coin.total_volume > parseFloat(filters.maxVolume)) return false;

        // 24h change filter
        if (
          filters.minChange24h &&
          coin.price_change_percentage_24h < parseFloat(filters.minChange24h)
        )
          return false;
        if (
          filters.maxChange24h &&
          coin.price_change_percentage_24h > parseFloat(filters.maxChange24h)
        )
          return false;

        // Price filter
        if (filters.minPrice && coin.current_price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && coin.current_price > parseFloat(filters.maxPrice)) return false;

        // ATH distance filter
        if (
          filters.minAthDistance &&
          coin.ath_change_percentage < parseFloat(filters.minAthDistance)
        )
          return false;
        if (
          filters.maxAthDistance &&
          coin.ath_change_percentage > parseFloat(filters.maxAthDistance)
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortField] ?? 0;
        const bVal = b[sortField] ?? 0;
        const modifier = sortDirection === 'asc' ? 1 : -1;
        return (aVal - bVal) * modifier;
      });
  }, [coins, filters, search, sortField, sortDirection]);

  const activeFilterCount =
    Object.values(filters).filter((v) => v !== '').length + (search ? 1 : 0);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-black select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ChevronUpDownIcon
          className={`w-4 h-4 ${sortField === field ? 'text-slate-900 dark:text-white' : ''}`}
        />
        {sortField === field &&
          (sortDirection === 'asc' ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : (
            <ArrowDownIcon className="w-3 h-3" />
          ))}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-slate-900 dark:border-white bg-black dark:bg-white text-white dark:text-slate-900'
              : 'border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-black'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white dark:bg-black text-slate-900 dark:text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        )}
        <ExportButton
          label="Export"
          getData={() =>
            exportMarketData(
              filteredCoins.map((c) => ({
                rank: c.market_cap_rank,
                symbol: c.symbol,
                name: c.name,
                price: c.current_price,
                change24h: c.price_change_percentage_24h,
                change7d: c.price_change_percentage_7d_in_currency,
                marketCap: c.market_cap,
                volume: c.total_volume,
                athChange: c.ath_change_percentage,
              }))
            )
          }
        />
      </div>

      {/* Preset Filters */}
      <div className="flex flex-wrap gap-2">
        {PRESET_FILTERS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-black transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-black/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Market Cap */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Market Cap
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minMarketCap}
                  onChange={(e) => setFilters((f) => ({ ...f, minMarketCap: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxMarketCap}
                  onChange={(e) => setFilters((f) => ({ ...f, maxMarketCap: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                24h Volume
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minVolume}
                  onChange={(e) => setFilters((f) => ({ ...f, minVolume: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxVolume}
                  onChange={(e) => setFilters((f) => ({ ...f, maxVolume: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* 24h Change */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                24h Change %
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minChange24h}
                  onChange={(e) => setFilters((f) => ({ ...f, minChange24h: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxChange24h}
                  onChange={(e) => setFilters((f) => ({ ...f, maxChange24h: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Price ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* ATH Distance */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                From ATH %
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAthDistance}
                  onChange={(e) => setFilters((f) => ({ ...f, minAthDistance: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAthDistance}
                  onChange={(e) => setFilters((f) => ({ ...f, maxAthDistance: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredCoins.length} of {coins.length} coins
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-black">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                <StarIcon className="w-4 h-4" />
              </th>
              <SortHeader field="market_cap_rank">#</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Coin
              </th>
              <SortHeader field="current_price">Price</SortHeader>
              <SortHeader field="price_change_percentage_24h">24h</SortHeader>
              <SortHeader field="market_cap">Market Cap</SortHeader>
              <SortHeader field="total_volume">Volume</SortHeader>
              <SortHeader field="ath_change_percentage">From ATH</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-slate-700">
            {filteredCoins.map((coin) => (
              <tr key={coin.id} className="hover:bg-gray-50 dark:hover:bg-black/50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleWatchlist(coin.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <StarIcon
                      className={`w-4 h-4 ${watchlist.has(coin.id) ? 'text-slate-900 dark:text-white fill-current' : ''}`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {coin.market_cap_rank}
                </td>
                <td className="px-4 py-3">
                  <a href={`/coin/${coin.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {coin.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </a>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                  {formatPrice(coin.current_price)}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-mono ${
                    coin.price_change_percentage_24h >= 0
                      ? 'text-slate-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {coin.price_change_percentage_24h >= 0 ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {formatPercent(coin.price_change_percentage_24h)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {formatNumber(coin.market_cap)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {formatNumber(coin.total_volume)}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">
                  {formatPercent(coin.ath_change_percentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCoins.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No coins match your filters. Try adjusting your criteria.
        </div>
      )}
    </div>
  );
}
