/**
 * HomePricesTable - Full-featured cryptocurrency price table for the homepage
 * Supports customizable columns: price, price change, market cap, volume, supply, charts, and more
 * Column preferences are persisted to localStorage
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number;
  // Price
  current_price: number;
  current_price_btc: number | null;
  current_price_eth: number | null;
  ath: number;
  atl: number;
  high_24h: number | null;
  low_24h: number | null;
  ath_change_percentage: number;
  atl_change_percentage: number;
  // Price Change
  price_change_percentage_1h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_30d: number | null;
  price_change_percentage_200d: number | null; // ~YTD proxy
  price_change_percentage_1y: number | null;
  // Market Cap
  market_cap: number;
  fully_diluted_valuation: number | null;
  // Volume
  total_volume: number;
  // Supply
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  // Charts (sparkline prices)
  sparkline_7d: number[];
  // Derived
  dominance_pct: number | null;
}

type SortField = keyof CoinData | 'none';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

type ColumnId =
  // Price
  | 'price' | 'price_btc' | 'price_eth'
  | 'ath' | 'atl' | 'high_24h' | 'low_24h' | 'from_ath' | 'from_atl'
  // Price Change
  | 'change_1h' | 'change_24h' | 'change_7d' | 'change_30d'
  | 'change_200d' | 'change_1y'
  | 'change_1h_btc' | 'change_24h_btc' | 'change_1h_eth' | 'change_24h_eth'
  // Market Cap
  | 'market_cap' | 'fdv'
  // Volume
  | 'volume_24h' | 'volume_mcap'
  // Supply
  | 'circulating_supply' | 'total_supply' | 'max_supply'
  // Charts
  | 'chart_7d' | 'chart_24h'
  // Others
  | 'dominance';

type ColumnGroup = 'Price' | 'Price Change' | 'Market Cap' | 'Volume' | 'Supply' | 'Charts' | 'Others';

interface ColumnDef {
  id: ColumnId;
  label: string;
  group: ColumnGroup;
  defaultVisible: boolean;
  sortField?: keyof CoinData;
  align?: 'left' | 'right' | 'center';
  minWidth?: string;
}

const COLUMN_DEFS: ColumnDef[] = [
  // Price
  { id: 'price',         label: 'Price',         group: 'Price',        defaultVisible: true,  sortField: 'current_price',               align: 'right', minWidth: '110px' },
  { id: 'price_btc',     label: 'Price in BTC',  group: 'Price',        defaultVisible: false, sortField: 'current_price_btc',           align: 'right', minWidth: '130px' },
  { id: 'price_eth',     label: 'Price in ETH',  group: 'Price',        defaultVisible: false, sortField: 'current_price_eth',           align: 'right', minWidth: '130px' },
  { id: 'ath',           label: 'ATH',            group: 'Price',        defaultVisible: false, sortField: 'ath',                         align: 'right', minWidth: '110px' },
  { id: 'atl',           label: 'ATL',            group: 'Price',        defaultVisible: false, sortField: 'atl',                         align: 'right', minWidth: '110px' },
  { id: 'high_24h',      label: '24h High',       group: 'Price',        defaultVisible: false, sortField: 'high_24h',                    align: 'right', minWidth: '110px' },
  { id: 'low_24h',       label: '24h Low',        group: 'Price',        defaultVisible: false, sortField: 'low_24h',                     align: 'right', minWidth: '110px' },
  { id: 'from_ath',      label: 'From ATH',       group: 'Price',        defaultVisible: false, sortField: 'ath_change_percentage',       align: 'right', minWidth: '100px' },
  { id: 'from_atl',      label: 'From ATL',       group: 'Price',        defaultVisible: false, sortField: 'atl_change_percentage',       align: 'right', minWidth: '100px' },
  // Price Change
  { id: 'change_1h',     label: '1h %',           group: 'Price Change', defaultVisible: false, sortField: 'price_change_percentage_1h',  align: 'right', minWidth: '80px' },
  { id: 'change_24h',    label: '24h %',          group: 'Price Change', defaultVisible: true,  sortField: 'price_change_percentage_24h', align: 'right', minWidth: '80px' },
  { id: 'change_7d',     label: '7d %',           group: 'Price Change', defaultVisible: true,  sortField: 'price_change_percentage_7d',  align: 'right', minWidth: '80px' },
  { id: 'change_30d',    label: '30d %',          group: 'Price Change', defaultVisible: false, sortField: 'price_change_percentage_30d', align: 'right', minWidth: '80px' },
  { id: 'change_200d',   label: 'YTD %',          group: 'Price Change', defaultVisible: false, sortField: 'price_change_percentage_200d',align: 'right', minWidth: '80px' },
  { id: 'change_1y',     label: '1y %',           group: 'Price Change', defaultVisible: false, sortField: 'price_change_percentage_1y',  align: 'right', minWidth: '80px' },
  { id: 'change_1h_btc', label: '1h% in BTC',     group: 'Price Change', defaultVisible: false, sortField: undefined,                    align: 'right', minWidth: '110px' },
  { id: 'change_24h_btc',label: '24h% in BTC',    group: 'Price Change', defaultVisible: false, sortField: undefined,                    align: 'right', minWidth: '110px' },
  { id: 'change_1h_eth', label: '1h% in ETH',     group: 'Price Change', defaultVisible: false, sortField: undefined,                    align: 'right', minWidth: '110px' },
  { id: 'change_24h_eth',label: '24h% in ETH',    group: 'Price Change', defaultVisible: false, sortField: undefined,                    align: 'right', minWidth: '110px' },
  // Market Cap
  { id: 'market_cap',    label: 'Market Cap',     group: 'Market Cap',   defaultVisible: true,  sortField: 'market_cap',                 align: 'right', minWidth: '130px' },
  { id: 'fdv',           label: 'Fully Diluted Mcap', group: 'Market Cap', defaultVisible: false, sortField: 'fully_diluted_valuation',  align: 'right', minWidth: '160px' },
  // Volume
  { id: 'volume_24h',    label: 'Volume (24h)',   group: 'Volume',       defaultVisible: true,  sortField: 'total_volume',               align: 'right', minWidth: '130px' },
  { id: 'volume_mcap',   label: 'Volume / Mcap',  group: 'Volume',       defaultVisible: false, sortField: undefined,                    align: 'right', minWidth: '120px' },
  // Supply
  { id: 'circulating_supply', label: 'Circulating Supply', group: 'Supply', defaultVisible: false, sortField: 'circulating_supply', align: 'right', minWidth: '150px' },
  { id: 'total_supply',  label: 'Total Supply',   group: 'Supply',       defaultVisible: false, sortField: 'total_supply',               align: 'right', minWidth: '130px' },
  { id: 'max_supply',    label: 'Max Supply',     group: 'Supply',       defaultVisible: false, sortField: 'max_supply',                 align: 'right', minWidth: '120px' },
  // Charts
  { id: 'chart_7d',      label: '7d Chart',       group: 'Charts',       defaultVisible: true,  sortField: undefined,                    align: 'center', minWidth: '80px' },
  { id: 'chart_24h',     label: '24h Chart',      group: 'Charts',       defaultVisible: false, sortField: undefined,                    align: 'center', minWidth: '80px' },
  // Others
  { id: 'dominance',     label: 'Dominance %',    group: 'Others',       defaultVisible: false, sortField: 'dominance_pct',              align: 'right', minWidth: '110px' },
];

const DEFAULT_VISIBLE: ColumnId[] = COLUMN_DEFS.filter(c => c.defaultVisible).map(c => c.id);

const COLUMN_GROUPS: ColumnGroup[] = ['Price', 'Price Change', 'Market Cap', 'Volume', 'Supply', 'Charts', 'Others'];

const LS_KEY = 'home_prices_columns_v1';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtPrice(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}

function fmtBtc(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n >= 1) return `₿${n.toFixed(4)}`;
  if (n >= 0.0001) return `₿${n.toFixed(6)}`;
  return `₿${n.toExponential(3)}`;
}

function fmtEth(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n >= 1) return `Ξ${n.toFixed(4)}`;
  if (n >= 0.0001) return `Ξ${n.toFixed(6)}`;
  return `Ξ${n.toExponential(3)}`;
}

function fmtLarge(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtSupply(n: number | null | undefined, symbol: string): string {
  if (!n) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T ${symbol.toUpperCase()}`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(2)}K ${symbol.toUpperCase()}`;
  return `${n.toFixed(0)} ${symbol.toUpperCase()}`;
}

function fmtPct(n: number | null | undefined, showPlus = true): string {
  if (n == null) return '—';
  const prefix = showPlus && n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(2)}%`;
}

function fmtPctColor(n: number | null | undefined): string {
  if (n == null) return 'text-gray-400 dark:text-gray-500';
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (n < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-500 dark:text-gray-400';
}

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({ prices, width = 64, height = 24 }: { prices: number[]; width?: number; height?: number }) {
  if (!prices || prices.length < 2) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = width / (prices.length - 1);
  const pts = prices
    .map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 2) - 1).toFixed(1)}`)
    .join(' ');
  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? '#10b981' : '#ef4444';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Column Customizer Modal
// ---------------------------------------------------------------------------

function ColumnCustomizer({
  visible,
  setVisible,
  onClose,
}: {
  visible: Set<ColumnId>;
  setVisible: (v: Set<ColumnId>) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Set<ColumnId>>(new Set(visible));

  function toggle(id: ColumnId) {
    if (id === 'price') return; // always visible
    const next = new Set(draft);
    next.has(id) ? next.delete(id) : next.add(id);
    setDraft(next);
  }

  function apply() {
    setVisible(new Set(draft));
    onClose();
  }

  function reset() {
    setDraft(new Set(DEFAULT_VISIBLE));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Customize Columns</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add, remove and sort metrics just how you need it</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Groups */}
        <div className="p-5 space-y-5">
          {COLUMN_GROUPS.map(group => {
            const cols = COLUMN_DEFS.filter(c => c.group === group);
            return (
              <div key={group}>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{group}</h4>
                <div className="flex flex-wrap gap-2">
                  {cols.map(col => {
                    const active = draft.has(col.id);
                    const locked = col.id === 'price';
                    return (
                      <button
                        key={col.id}
                        onClick={() => toggle(col.id)}
                        disabled={locked}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                        } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {col.label}
                        {active && !locked && (
                          <span className="ml-1 opacity-70">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl">
          <button onClick={reset} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Restart
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={apply} className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HomePricesTable({ limit = 20 }: { limit?: number }) {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ColumnId>>(new Set(DEFAULT_VISIBLE));
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [sortField, setSortField] = useState<SortField>('market_cap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Restore saved columns from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const arr: ColumnId[] = JSON.parse(saved);
        setVisibleCols(new Set(['price', ...arr.filter(id => COLUMN_DEFS.some(c => c.id === id))]));
      }
    } catch {}
  }, []);

  // Persist column selections
  const handleSetVisible = useCallback((v: Set<ColumnId>) => {
    setVisibleCols(v);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...v])); } catch {}
  }, []);

  // Fetch coin data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [coinsRes, btcEthRes] = await Promise.all([
          fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,7d,14d,30d,200d,1y`,
            { next: { revalidate: 60 } }
          ),
          fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
            { next: { revalidate: 60 } }
          ),
        ]);
        if (!coinsRes.ok) throw new Error(`CoinGecko error ${coinsRes.status}`);
        const raw: any[] = await coinsRes.json();
        const btcEth: any = btcEthRes.ok ? await btcEthRes.json() : {};
        const btcUsd: number = btcEth?.bitcoin?.usd || 0;
        const ethUsd: number = btcEth?.ethereum?.usd || 0;

        // Total market cap for dominance
        let totalMcap = 0;

        const data: CoinData[] = raw.map((c: any) => {
          totalMcap += c.market_cap || 0;
          return {
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            image: c.image,
            market_cap_rank: c.market_cap_rank,
            current_price: c.current_price || 0,
            current_price_btc: btcUsd ? (c.current_price || 0) / btcUsd : null,
            current_price_eth: ethUsd ? (c.current_price || 0) / ethUsd : null,
            ath: c.ath || 0,
            atl: c.atl || 0,
            high_24h: c.high_24h ?? null,
            low_24h: c.low_24h ?? null,
            ath_change_percentage: c.ath_change_percentage ?? 0,
            atl_change_percentage: c.atl_change_percentage ?? 0,
            price_change_percentage_1h: c.price_change_percentage_1h_in_currency ?? null,
            price_change_percentage_24h: c.price_change_percentage_24h ?? null,
            price_change_percentage_7d: c.price_change_percentage_7d_in_currency ?? null,
            price_change_percentage_30d: c.price_change_percentage_30d_in_currency ?? null,
            price_change_percentage_200d: c.price_change_percentage_200d_in_currency ?? null,
            price_change_percentage_1y: c.price_change_percentage_1y_in_currency ?? null,
            market_cap: c.market_cap || 0,
            fully_diluted_valuation: c.fully_diluted_valuation ?? null,
            total_volume: c.total_volume || 0,
            circulating_supply: c.circulating_supply || 0,
            total_supply: c.total_supply ?? null,
            max_supply: c.max_supply ?? null,
            sparkline_7d: c.sparkline_in_7d?.price ?? [],
            dominance_pct: null, // filled below
          };
        });

        // Compute dominance
        if (totalMcap > 0) {
          data.forEach(d => { d.dominance_pct = (d.market_cap / totalMcap) * 100; });
        }

        if (!cancelled) { setCoins(data); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || 'Failed to load'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  // Visible column definitions (in display order)
  const activeCols = useMemo(
    () => COLUMN_DEFS.filter(c => visibleCols.has(c.id)),
    [visibleCols]
  );

  // Sorted coins
  const sortedCoins = useMemo(() => {
    if (sortField === 'none') return coins;
    const col = COLUMN_DEFS.find(c => c.sortField === sortField);
    const field = col?.sortField ?? 'market_cap';
    return [...coins].sort((a, b) => {
      const av = (a as any)[field] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const bv = (b as any)[field] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [coins, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function renderCell(col: ColumnDef, coin: CoinData): React.ReactNode {
    switch (col.id) {
      case 'price':       return <span className="font-semibold text-gray-900 dark:text-white">{fmtPrice(coin.current_price)}</span>;
      case 'price_btc':   return <span className="text-gray-700 dark:text-gray-300">{fmtBtc(coin.current_price_btc)}</span>;
      case 'price_eth':   return <span className="text-gray-700 dark:text-gray-300">{fmtEth(coin.current_price_eth)}</span>;
      case 'ath':         return <span className="text-gray-700 dark:text-gray-300">{fmtPrice(coin.ath)}</span>;
      case 'atl':         return <span className="text-gray-700 dark:text-gray-300">{fmtPrice(coin.atl)}</span>;
      case 'high_24h':    return <span className="text-gray-700 dark:text-gray-300">{fmtPrice(coin.high_24h)}</span>;
      case 'low_24h':     return <span className="text-gray-700 dark:text-gray-300">{fmtPrice(coin.low_24h)}</span>;
      case 'from_ath':    return <span className={fmtPctColor(coin.ath_change_percentage)}>{fmtPct(coin.ath_change_percentage)}</span>;
      case 'from_atl':    return <span className={fmtPctColor(coin.atl_change_percentage)}>{fmtPct(coin.atl_change_percentage)}</span>;
      case 'change_1h':   return <span className={fmtPctColor(coin.price_change_percentage_1h)}>{fmtPct(coin.price_change_percentage_1h)}</span>;
      case 'change_24h':  return <span className={fmtPctColor(coin.price_change_percentage_24h)}>{fmtPct(coin.price_change_percentage_24h)}</span>;
      case 'change_7d':   return <span className={fmtPctColor(coin.price_change_percentage_7d)}>{fmtPct(coin.price_change_percentage_7d)}</span>;
      case 'change_30d':  return <span className={fmtPctColor(coin.price_change_percentage_30d)}>{fmtPct(coin.price_change_percentage_30d)}</span>;
      case 'change_200d': return <span className={fmtPctColor(coin.price_change_percentage_200d)}>{fmtPct(coin.price_change_percentage_200d)}</span>;
      case 'change_1y':   return <span className={fmtPctColor(coin.price_change_percentage_1y)}>{fmtPct(coin.price_change_percentage_1y)}</span>;
      case 'change_1h_btc': {
        // Price change of coin relative to BTC on 1h: coin_1h% - btc_1h%
        const btcCoin = coins.find(c => c.id === 'bitcoin');
        const rel = btcCoin ? (coin.price_change_percentage_1h ?? 0) - (btcCoin.price_change_percentage_1h ?? 0) : null;
        return <span className={fmtPctColor(rel)}>{fmtPct(rel)}</span>;
      }
      case 'change_24h_btc': {
        const btcCoin = coins.find(c => c.id === 'bitcoin');
        const rel = btcCoin ? (coin.price_change_percentage_24h ?? 0) - (btcCoin.price_change_percentage_24h ?? 0) : null;
        return <span className={fmtPctColor(rel)}>{fmtPct(rel)}</span>;
      }
      case 'change_1h_eth': {
        const ethCoin = coins.find(c => c.id === 'ethereum');
        const rel = ethCoin ? (coin.price_change_percentage_1h ?? 0) - (ethCoin.price_change_percentage_1h ?? 0) : null;
        return <span className={fmtPctColor(rel)}>{fmtPct(rel)}</span>;
      }
      case 'change_24h_eth': {
        const ethCoin = coins.find(c => c.id === 'ethereum');
        const rel = ethCoin ? (coin.price_change_percentage_24h ?? 0) - (ethCoin.price_change_percentage_24h ?? 0) : null;
        return <span className={fmtPctColor(rel)}>{fmtPct(rel)}</span>;
      }
      case 'market_cap':  return <span className="text-gray-700 dark:text-gray-300">{fmtLarge(coin.market_cap)}</span>;
      case 'fdv':         return <span className="text-gray-700 dark:text-gray-300">{coin.fully_diluted_valuation ? fmtLarge(coin.fully_diluted_valuation) : '—'}</span>;
      case 'volume_24h':  return <span className="text-gray-700 dark:text-gray-300">{fmtLarge(coin.total_volume)}</span>;
      case 'volume_mcap': {
        const ratio = coin.market_cap ? coin.total_volume / coin.market_cap : null;
        return <span className="text-gray-700 dark:text-gray-300">{ratio != null ? ratio.toFixed(3) : '—'}</span>;
      }
      case 'circulating_supply': return <span className="text-gray-700 dark:text-gray-300">{fmtSupply(coin.circulating_supply, coin.symbol)}</span>;
      case 'total_supply':       return <span className="text-gray-700 dark:text-gray-300">{fmtSupply(coin.total_supply, coin.symbol)}</span>;
      case 'max_supply':         return <span className="text-gray-700 dark:text-gray-300">{fmtSupply(coin.max_supply, coin.symbol)}</span>;
      case 'chart_7d': return (
        <span className="flex justify-center">
          <Sparkline prices={coin.sparkline_7d} width={64} height={24} />
        </span>
      );
      case 'chart_24h': {
        // Last 24 data points of 7d sparkline (7d = ~168 hourly points, last 24h = last 24)
        const slice = coin.sparkline_7d.slice(-24);
        return (
          <span className="flex justify-center">
            <Sparkline prices={slice} width={64} height={24} />
          </span>
        );
      }
      case 'dominance': return <span className="text-gray-700 dark:text-gray-300">{coin.dominance_pct != null ? `${coin.dominance_pct.toFixed(2)}%` : '—'}</span>;
      default: return <span className="text-gray-400">—</span>;
    }
  }

  const sortIcon = (field: SortField | undefined) => {
    if (!field) return null;
    if (sortField !== field) return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
    return sortDir === 'desc'
      ? <svg className="w-3 h-3 text-blue-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      : <svg className="w-3 h-3 text-blue-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-slate-700/50">
              <div className="w-6 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
              <div className="w-7 h-7 bg-gray-100 dark:bg-slate-700 rounded-full" />
              <div className="flex-1 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
              <div className="w-24 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
              <div className="w-16 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
              <div className="w-20 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">Unable to load price data. <button onClick={() => window.location.reload()} className="text-blue-600 dark:text-blue-400 underline">Retry</button></p>
      </div>
    );
  }

  return (
    <>
      {showCustomizer && (
        <ColumnCustomizer
          visible={visibleCols}
          setVisible={handleSetVisible}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Showing top {coins.length} by market cap · <span className="text-gray-400 dark:text-slate-500">{visibleCols.size} columns</span>
          </p>
          <button
            onClick={() => setShowCustomizer(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 hover:border-blue-300 dark:hover:border-blue-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Customize
          </button>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/40 dark:bg-slate-800/40">
                {/* Fixed: rank */}
                <th className="sticky left-0 z-10 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-sm text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 w-10">#</th>
                {/* Fixed: name */}
                <th className="sticky left-10 z-10 bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-sm text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[160px]">Name</th>
                {/* Dynamic columns */}
                {activeCols.map(col => (
                  <th
                    key={col.id}
                    className={`text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap ${col.sortField ? 'cursor-pointer hover:text-gray-700 dark:hover:text-slate-200 select-none' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    style={{ minWidth: col.minWidth }}
                    onClick={() => col.sortField && handleSort(col.sortField as SortField)}
                  >
                    {col.label}
                    {sortIcon(col.sortField as SortField | undefined)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {sortedCoins.map((coin, idx) => (
                <tr key={coin.id} className="group hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  {/* Rank */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700/30 transition-colors px-4 py-3 text-xs font-bold text-gray-300 dark:text-slate-600 tabular-nums w-10">
                    {coin.market_cap_rank ?? idx + 1}
                  </td>
                  {/* Name */}
                  <td className="sticky left-10 z-10 bg-white dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700/30 transition-colors px-4 py-3 min-w-[160px]">
                    <Link href={`/coin/${coin.id}`} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
                      {coin.image ? (
                        <Image src={coin.image} alt={coin.name} width={24} height={24} className="rounded-full flex-shrink-0" />
                      ) : (
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 rounded-full flex-shrink-0">
                          {coin.symbol?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{coin.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 uppercase flex-shrink-0">{coin.symbol}</span>
                    </Link>
                  </td>
                  {/* Dynamic cells */}
                  {activeCols.map(col => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 tabular-nums text-sm whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {renderCell(col, coin)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">Data by CoinGecko · Updates every minute</p>
          <Link
            href="/markets"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            Explore all 3000+ coins
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
