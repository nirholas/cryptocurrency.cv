'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Bell,
  Star,
  SlidersHorizontal,
  Wifi,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge, Card, CardContent, Skeleton } from '@/components/ui';
import type { PumpAlert, MarketOverview, PumpScreenerData, RiskLevel } from '@/lib/pump-detection';

// ─── Types ────────────────────────────────────────────────────────
type Tab = 'live' | 'watchlist' | 'historical' | 'overview' | 'alerts';
type SortKey = 'symbol' | 'priceChange' | 'volumeChange' | 'timeFrame' | 'risk' | 'confidence';
type SortDir = 'asc' | 'desc';

interface Filters {
  search: string;
  minPriceChange: number;
  minVolumeChange: number;
  timeFrame: string;
  riskLevel: string;
  exchange: string;
  favoritesOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  minPriceChange: 3,
  minVolumeChange: 200,
  timeFrame: 'All',
  riskLevel: 'All',
  exchange: 'All',
  favoritesOnly: false,
};

const TIME_FRAME_OPTIONS = ['All', '1m', '5m', '15m', '30m', '1h', '4h'];
const RISK_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Very high'];
const EXCHANGE_OPTIONS = ['All', 'Binance', 'Coinbase', 'Bybit', 'OKX', 'Kraken'];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  'Very high': 'bg-red-600/20 text-red-300 border-red-600/30',
};

// ─── Helpers ──────────────────────────────────────────────────────
function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPercentage(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fearGreedColor(value: number): string {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-400';
  if (value <= 55) return 'text-yellow-400';
  if (value <= 75) return 'text-green-400';
  return 'text-emerald-400';
}

function getConfidenceDot(n: number): string {
  if (n >= 90) return 'bg-green-500';
  if (n >= 70) return 'bg-yellow-500';
  if (n >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

// ─── Sub-components ───────────────────────────────────────────────

function MarketOverviewPanel({ data }: { data: MarketOverview }) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-text-primary text-lg font-bold">Market Overview</h2>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <Wifi className="h-3 w-3" /> Just now
          </span>
        </div>
        <p className="text-text-secondary mb-4 text-xs">
          Real-time cryptocurrency market statistics
        </p>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-secondary text-xs">Total Market Cap</p>
            <p className="text-text-primary text-xl font-bold">
              {formatLargeNumber(data.totalMarketCap)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">24h Volume</p>
            <p className="text-text-primary text-xl font-bold">
              {formatLargeNumber(data.volume24h)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">BTC Dominance</p>
            <p className="text-text-primary text-xl font-bold">{data.btcDominance.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Fear &amp; Greed</p>
            <p className={cn('text-xl font-bold', fearGreedColor(data.fearGreedValue))}>
              {data.fearGreedValue} ({data.fearGreedLabel})
            </p>
          </div>
        </div>

        <div className="border-border/50 space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" /> Pumping Coins
            </span>
            <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
              {data.pumpingCoins}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-red-400" /> Dumping Coins
            </span>
            <Badge className="border-red-500/30 bg-red-500/20 text-red-400">
              {data.dumpingCoins}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-orange-400" /> Unusual Activity
            </span>
            <Badge className="border-orange-500/30 bg-orange-500/20 text-orange-400">
              {data.unusualActivity}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-text-secondary text-xs whitespace-nowrap">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border text-text-primary focus:ring-accent h-8 rounded-md border bg-(--color-surface) px-2 text-xs focus:ring-2 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberFilterSelect({
  label,
  value,
  options,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-text-secondary text-xs whitespace-nowrap">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-border text-text-primary focus:ring-accent h-8 rounded-md border bg-(--color-surface) px-2 text-xs focus:ring-2 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      className="text-text-secondary hover:text-text-primary cursor-pointer px-3 py-3 text-left text-xs font-medium select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <span className="inline-flex h-3 w-3 flex-col opacity-30">
            <ChevronUp className="-mb-0.5 h-2 w-2" />
            <ChevronDown className="-mt-0.5 h-2 w-2" />
          </span>
        )}
      </span>
    </th>
  );
}

function AlertRow({
  alert,
  onToggleFavorite,
}: {
  alert: PumpAlert;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <tr className="border-border/30 hover:bg-surface-secondary/50 border-t transition-colors">
      <td className="px-3 py-3">
        <button
          onClick={() => onToggleFavorite(alert.id)}
          className="text-text-secondary transition-colors hover:text-yellow-400"
          aria-label={alert.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('h-4 w-4', alert.isFavorite && 'fill-yellow-400 text-yellow-400')} />
        </button>
      </td>
      <td className="px-3 py-3">
        <div>
          <span className="text-text-primary font-medium">{alert.pair}</span>
          <p className="text-text-secondary text-xs">{alert.exchange}</p>
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            'text-sm font-medium',
            alert.priceChange >= 0 ? 'text-green-400' : 'text-red-400',
          )}
        >
          {alert.priceChange >= 0 ? (
            <TrendingUp className="mr-1 inline h-3 w-3" />
          ) : (
            <TrendingDown className="mr-1 inline h-3 w-3" />
          )}
          {formatPercentage(alert.priceChange)}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="text-text-primary text-sm">+{alert.volumeChange.toFixed(0)}%</span>
      </td>
      <td className="px-3 py-3">
        <span className="text-text-secondary text-sm">{alert.timeFrame}</span>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
            RISK_COLORS[alert.risk],
          )}
        >
          {alert.risk}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', getConfidenceDot(alert.confidence))} />
          <span className="text-text-primary text-sm">{alert.confidence}</span>
        </div>
      </td>
    </tr>
  );
}

function PumpTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function PumpScreenerClient() {
  const [data, setData] = useState<PumpScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'confidence',
    dir: 'desc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/market/pumps');
      if (!res.ok) return;
      const json: PumpScreenerData = await res.json();
      setData(json);
    } catch {
      // non-critical — keep stale data
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData().then(() => setLoading(false));
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
    setPage(1);
  }, []);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPriceChange !== DEFAULT_FILTERS.minPriceChange) count++;
    if (filters.minVolumeChange !== DEFAULT_FILTERS.minVolumeChange) count++;
    if (filters.timeFrame !== 'All') count++;
    if (filters.riskLevel !== 'All') count++;
    if (filters.exchange !== 'All') count++;
    return count;
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Filtered + sorted alerts
  const processedAlerts = useMemo(() => {
    if (!data) return [];

    let alerts = data.alerts.map((a) => ({
      ...a,
      isFavorite: favorites.has(a.id),
    }));

    // Tab filtering
    if (activeTab === 'watchlist') {
      alerts = alerts.filter((a) => favorites.has(a.id));
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.symbol.toLowerCase().includes(q) ||
          a.pair.toLowerCase().includes(q) ||
          a.exchange.toLowerCase().includes(q),
      );
    }

    // Filters
    if (filters.favoritesOnly) alerts = alerts.filter((a) => favorites.has(a.id));
    alerts = alerts.filter((a) => Math.abs(a.priceChange) >= filters.minPriceChange);
    alerts = alerts.filter((a) => a.volumeChange >= filters.minVolumeChange);
    if (filters.timeFrame !== 'All')
      alerts = alerts.filter((a) => a.timeFrame === filters.timeFrame);
    if (filters.riskLevel !== 'All') alerts = alerts.filter((a) => a.risk === filters.riskLevel);
    if (filters.exchange !== 'All') alerts = alerts.filter((a) => a.exchange === filters.exchange);

    // Sort
    alerts.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });

    return alerts;
  }, [data, filters, favorites, sort, activeTab]);

  const totalPages = Math.max(1, Math.ceil(processedAlerts.length / pageSize));
  const paginatedAlerts = processedAlerts.slice((page - 1) * pageSize, page * pageSize);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'live', label: 'Live Scanner', count: processedAlerts.length },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'historical', label: 'Historical' },
    { key: 'overview', label: 'Market Overview' },
    { key: 'alerts', label: 'Alerts' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48 w-full" />
            <PumpTableSkeleton />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-text-primary font-serif text-3xl font-bold md:text-4xl">
              Pump Screener
            </h1>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Updated Just now
            </span>
          </div>
          <p className="text-text-secondary mt-1">
            Detect and analyze cryptocurrency pump patterns in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <Button variant="primary" className="gap-2">
            <Bell className="h-4 w-4" /> Set Alerts
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-border/50">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-base font-bold">Advanced Search &amp; Filters</h2>
            <div className="text-text-secondary flex items-center gap-3 text-xs">
              <span>
                {processedAlerts.length} / {data?.totalAlerts ?? 0} alerts
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-accent flex items-center gap-1 hover:underline"
                >
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="text-text-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by symbol, exchange, or pattern type..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="border-border text-text-primary placeholder:text-text-secondary/50 focus:ring-accent h-10 w-full rounded-md border bg-(--color-surface) pr-3 pl-10 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Quick toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={filters.favoritesOnly ? 'primary' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => updateFilter('favoritesOnly', !filters.favoritesOnly)}
            >
              <Star className="h-3.5 w-3.5" /> Favorites Only
            </Button>
            <Button
              variant={showAdvanced ? 'primary' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Advanced Filters
            </Button>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-4">
            <NumberFilterSelect
              label="Min Price Change"
              value={filters.minPriceChange}
              options={[1, 2, 3, 5, 10, 15, 20]}
              suffix="%"
              onChange={(v) => updateFilter('minPriceChange', v)}
            />
            <NumberFilterSelect
              label="Min Volume Change"
              value={filters.minVolumeChange}
              options={[50, 100, 200, 500, 1000]}
              suffix="%"
              onChange={(v) => updateFilter('minVolumeChange', v)}
            />
            <FilterSelect
              label="Timeframe"
              value={filters.timeFrame}
              options={TIME_FRAME_OPTIONS}
              onChange={(v) => updateFilter('timeFrame', v)}
            />
            <FilterSelect
              label="Risk Level"
              value={filters.riskLevel}
              options={RISK_OPTIONS}
              onChange={(v) => updateFilter('riskLevel', v)}
            />
            <FilterSelect
              label="Exchange"
              value={filters.exchange}
              options={EXCHANGE_OPTIONS}
              onChange={(v) => updateFilter('exchange', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-border/50 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              setPage(1);
            }}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === t.key
                ? 'border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary border-transparent',
            )}
          >
            {t.key === 'live' && <Activity className="h-4 w-4" />}
            {t.key === 'watchlist' && <Star className="h-4 w-4" />}
            {t.key === 'historical' && <Clock className="h-4 w-4" />}
            {t.key === 'overview' && <BarChart3 className="h-4 w-4" />}
            {t.key === 'alerts' && <Bell className="h-4 w-4" />}
            {t.label}
            {t.count !== undefined && (
              <Badge className="bg-accent/20 text-accent px-1.5 py-0 text-xs">{t.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && data && <MarketOverviewPanel data={data.marketOverview} />}

      {(activeTab === 'live' || activeTab === 'watchlist') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pump Alerts Table */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardContent className="pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-text-primary text-lg font-bold">Pump Alerts</h2>
                    <Badge className="flex items-center gap-1 border-green-500/30 bg-green-500/20 text-xs text-green-400">
                      <Wifi className="h-3 w-3" /> Live
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs">
                      {processedAlerts.length} potential pumps detected &middot; Page {page} of{' '}
                      {totalPages}
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="border-border text-text-primary focus:ring-accent h-8 rounded-md border bg-(--color-surface) px-2 text-xs focus:ring-2 focus:outline-none"
                    >
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {paginatedAlerts.length === 0 ? (
                  <div className="text-text-secondary py-16 text-center">
                    <Activity className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="text-base">No pump alerts match your filters</p>
                    <p className="mt-1 text-sm">Try adjusting your search or filter criteria</p>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="-mx-5 overflow-x-auto">
                      <table className="w-full min-w-160">
                        <thead>
                          <tr className="border-border/50 border-b">
                            <th className="w-10 px-3 py-3" />
                            <SortHeader
                              label="Symbol"
                              sortKey="symbol"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                            <SortHeader
                              label="Price Change"
                              sortKey="priceChange"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                            <SortHeader
                              label="Volume Change"
                              sortKey="volumeChange"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                            <SortHeader
                              label="Time Frame"
                              sortKey="timeFrame"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                            <SortHeader
                              label="Risk"
                              sortKey="risk"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                            <SortHeader
                              label="Conf."
                              sortKey="confidence"
                              currentSort={sort.key}
                              currentDir={sort.dir}
                              onSort={handleSort}
                            />
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAlerts.map((alert) => (
                            <AlertRow
                              key={alert.id}
                              alert={alert}
                              onToggleFavorite={toggleFavorite}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="border-border/30 mt-4 flex items-center justify-between border-t pt-4">
                        <p className="text-text-secondary text-xs">
                          Showing {(page - 1) * pageSize + 1}–
                          {Math.min(page * pageSize, processedAlerts.length)} of{' '}
                          {processedAlerts.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                            const p = start + i;
                            if (p > totalPages) return null;
                            return (
                              <Button
                                key={p}
                                variant={p === page ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="w-8 px-0"
                              >
                                {p}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Market Overview */}
          {data && <MarketOverviewPanel data={data.marketOverview} />}
        </div>
      )}

      {activeTab === 'historical' && (
        <Card className="border-border/50">
          <CardContent className="pt-5">
            <div className="text-text-secondary py-16 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-base font-medium">Historical Pump Data</p>
              <p className="mt-1 text-sm">Historical analysis of pump events coming soon.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <Card className="border-border/50">
          <CardContent className="pt-5">
            <div className="text-text-secondary py-16 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-base font-medium">Custom Pump Alerts</p>
              <p className="mt-1 text-sm">
                Set up custom alerts for specific coins or patterns. Coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
