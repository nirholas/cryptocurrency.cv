/**
 * TradingView Integration
 * 
 * Provides TradingView-compatible data feeds:
 * - UDF (Universal Data Feed) compliant endpoints
 * - Charting library integration
 * - Real-time streaming support
 * - Symbol resolution
 * - Historical data
 * 
 * Compatible with TradingView Charting Library
 */

// =============================================================================
// Types - UDF Protocol
// =============================================================================

export interface UDFConfigResponse {
  supports_search: boolean;
  supports_group_request: boolean;
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_time: boolean;
  exchanges: UDFExchange[];
  symbols_types: UDFSymbolType[];
  supported_resolutions: string[];
  currency_codes?: string[];
}

export interface UDFExchange {
  value: string;
  name: string;
  desc: string;
}

export interface UDFSymbolType {
  name: string;
  value: string;
}

export interface UDFSymbolInfo {
  name: string;
  ticker: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: 'streaming' | 'endofday' | 'pulsed' | 'delayed_streaming';
  currency_code?: string;
  original_currency_code?: string;
  format?: 'price' | 'volume';
}

export interface UDFBar {
  t: number; // timestamp (Unix)
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface UDFHistoryResponse {
  s: 'ok' | 'error' | 'no_data';
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  nextTime?: number;
  errmsg?: string;
}

export interface UDFSearchResult {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export interface UDFQuoteResponse {
  s: 'ok' | 'error';
  d: UDFQuoteData[];
  errmsg?: string;
}

export interface UDFQuoteData {
  s: 'ok' | 'error';
  n: string; // symbol name
  v: {
    ch: number;     // change
    chp: number;    // change percent
    short_name: string;
    exchange: string;
    description: string;
    lp: number;     // last price
    ask: number;
    bid: number;
    spread: number;
    open_price: number;
    high_price: number;
    low_price: number;
    prev_close_price: number;
    volume: number;
  };
}

export interface UDFMark {
  id: string;
  time: number;
  color: 'red' | 'green' | 'blue' | 'yellow';
  text: string;
  label: string;
  labelFontColor: string;
  minSize: number;
}

export interface UDFTimescaleMark {
  id: string;
  time: number;
  color: 'red' | 'green' | 'blue' | 'yellow';
  label: string;
  tooltip: string[];
}

// =============================================================================
// Configuration
// =============================================================================

const SUPPORTED_RESOLUTIONS = [
  '1', '5', '15', '30', '60', '120', '240', '360', '720',
  'D', 'W', 'M'
];

const EXCHANGES: UDFExchange[] = [
  { value: 'AGGREGATED', name: 'Aggregated', desc: 'Multi-exchange aggregated data' },
  { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' },
  { value: 'COINBASE', name: 'Coinbase', desc: 'Coinbase Exchange' },
  { value: 'KRAKEN', name: 'Kraken', desc: 'Kraken Exchange' },
];

const SYMBOL_TYPES: UDFSymbolType[] = [
  { name: 'Crypto', value: 'crypto' },
  { name: 'Index', value: 'index' },
  { name: 'DeFi', value: 'defi' },
];

const CRYPTO_SYMBOLS: Record<string, UDFSymbolInfo> = {
  'BTC/USD': createSymbolInfo('BTC/USD', 'Bitcoin', 'AGGREGATED', 100),
  'ETH/USD': createSymbolInfo('ETH/USD', 'Ethereum', 'AGGREGATED', 100),
  'SOL/USD': createSymbolInfo('SOL/USD', 'Solana', 'AGGREGATED', 100),
  'BNB/USD': createSymbolInfo('BNB/USD', 'BNB', 'AGGREGATED', 100),
  'XRP/USD': createSymbolInfo('XRP/USD', 'XRP', 'AGGREGATED', 10000),
  'ADA/USD': createSymbolInfo('ADA/USD', 'Cardano', 'AGGREGATED', 10000),
  'DOGE/USD': createSymbolInfo('DOGE/USD', 'Dogecoin', 'AGGREGATED', 100000),
  'AVAX/USD': createSymbolInfo('AVAX/USD', 'Avalanche', 'AGGREGATED', 100),
  'DOT/USD': createSymbolInfo('DOT/USD', 'Polkadot', 'AGGREGATED', 1000),
  'LINK/USD': createSymbolInfo('LINK/USD', 'Chainlink', 'AGGREGATED', 1000),
};

function createSymbolInfo(
  symbol: string,
  description: string,
  exchange: string,
  pricescale: number
): UDFSymbolInfo {
  return {
    name: symbol,
    ticker: symbol,
    description,
    type: 'crypto',
    session: '24x7',
    timezone: 'Etc/UTC',
    exchange,
    minmov: 1,
    pricescale,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    volume_precision: 8,
    data_status: 'streaming',
    currency_code: 'USD',
    format: 'price',
  };
}

// =============================================================================
// UDF Endpoints
// =============================================================================

/**
 * Get server configuration
 * UDF Endpoint: /config
 */
export function getConfig(): UDFConfigResponse {
  return {
    supports_search: true,
    supports_group_request: false,
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: EXCHANGES,
    symbols_types: SYMBOL_TYPES,
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    currency_codes: ['USD', 'EUR', 'GBP', 'BTC', 'ETH'],
  };
}

/**
 * Get current server time
 * UDF Endpoint: /time
 */
export function getServerTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Resolve symbol
 * UDF Endpoint: /symbols?symbol=...
 */
export function resolveSymbol(symbolName: string): UDFSymbolInfo | null {
  // Normalize symbol
  const normalized = normalizeSymbol(symbolName);
  
  // Check direct match
  if (CRYPTO_SYMBOLS[normalized]) {
    return CRYPTO_SYMBOLS[normalized];
  }
  
  // Try with USD suffix
  const withUSD = `${normalized}/USD`;
  if (CRYPTO_SYMBOLS[withUSD]) {
    return CRYPTO_SYMBOLS[withUSD];
  }
  
  // Dynamic symbol creation for unknown symbols
  const parts = normalized.split('/');
  if (parts.length === 2) {
    return createSymbolInfo(normalized, parts[0], 'AGGREGATED', 100);
  }
  
  return null;
}

/**
 * Search symbols
 * UDF Endpoint: /search?query=...&type=...&exchange=...&limit=...
 */
export function searchSymbols(
  query: string,
  type?: string,
  exchange?: string,
  limit: number = 30
): UDFSearchResult[] {
  const results: UDFSearchResult[] = [];
  const normalizedQuery = query.toLowerCase();
  
  for (const [symbol, info] of Object.entries(CRYPTO_SYMBOLS)) {
    if (
      symbol.toLowerCase().includes(normalizedQuery) ||
      info.description.toLowerCase().includes(normalizedQuery)
    ) {
      // Filter by type if specified
      if (type && info.type !== type) continue;
      
      // Filter by exchange if specified
      if (exchange && info.exchange !== exchange) continue;
      
      results.push({
        symbol: info.name,
        full_name: `${info.exchange}:${info.name}`,
        description: info.description,
        exchange: info.exchange,
        ticker: info.ticker,
        type: info.type,
      });
      
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

/**
 * Get historical bars
 * UDF Endpoint: /history?symbol=...&from=...&to=...&resolution=...
 */
export async function getHistory(
  symbol: string,
  from: number,
  to: number,
  resolution: string,
  countback?: number
): Promise<UDFHistoryResponse> {
  try {
    const symbolInfo = resolveSymbol(symbol);
    if (!symbolInfo) {
      return { s: 'error', t: [], o: [], h: [], l: [], c: [], v: [], errmsg: 'Unknown symbol' };
    }
    
    // Generate historical data (in production, fetch from data source)
    const bars = await fetchHistoricalBars(symbol, from, to, resolution, countback);
    
    if (bars.length === 0) {
      return { s: 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };
    }
    
    return {
      s: 'ok',
      t: bars.map(b => b.t),
      o: bars.map(b => b.o),
      h: bars.map(b => b.h),
      l: bars.map(b => b.l),
      c: bars.map(b => b.c),
      v: bars.map(b => b.v),
    };
  } catch (error) {
    return {
      s: 'error',
      t: [], o: [], h: [], l: [], c: [], v: [],
      errmsg: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get quotes for symbols
 * UDF Endpoint: /quotes?symbols=...
 */
export async function getQuotes(symbols: string[]): Promise<UDFQuoteResponse> {
  try {
    const data: UDFQuoteData[] = [];
    
    for (const symbol of symbols) {
      const symbolInfo = resolveSymbol(symbol);
      if (!symbolInfo) {
        data.push({ s: 'error', n: symbol, v: {} as UDFQuoteData['v'] });
        continue;
      }
      
      // Fetch current quote (in production, from exchange API)
      const quote = await fetchQuote(symbol);
      
      data.push({
        s: 'ok',
        n: symbol,
        v: {
          ch: quote.change,
          chp: quote.changePercent,
          short_name: symbolInfo.description,
          exchange: symbolInfo.exchange,
          description: symbolInfo.description,
          lp: quote.lastPrice,
          ask: quote.ask,
          bid: quote.bid,
          spread: quote.ask - quote.bid,
          open_price: quote.open,
          high_price: quote.high,
          low_price: quote.low,
          prev_close_price: quote.prevClose,
          volume: quote.volume,
        },
      });
    }
    
    return { s: 'ok', d: data };
  } catch (error) {
    return {
      s: 'error',
      d: [],
      errmsg: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get marks (news events, alerts)
 * UDF Endpoint: /marks?symbol=...&from=...&to=...&resolution=...
 */
export async function getMarks(
  symbol: string,
  from: number,
  to: number,
  resolution: string
): Promise<UDFMark[]> {
  // In production, fetch from news API and convert to marks
  const marks: UDFMark[] = [];
  
  // Example: Add sample news marks
  const sampleNews = [
    { time: from + 3600, text: 'SEC Announcement', color: 'yellow' as const },
    { time: from + 7200, text: 'Major Exchange Listing', color: 'green' as const },
    { time: from + 14400, text: 'Whale Alert: Large Transfer', color: 'blue' as const },
  ];
  
  for (const news of sampleNews) {
    if (news.time >= from && news.time <= to) {
      marks.push({
        id: `mark_${news.time}`,
        time: news.time,
        color: news.color,
        text: news.text,
        label: news.text.charAt(0),
        labelFontColor: 'white',
        minSize: 20,
      });
    }
  }
  
  return marks;
}

/**
 * Get timescale marks (bottom timeline markers)
 * UDF Endpoint: /timescale_marks?symbol=...&from=...&to=...&resolution=...
 */
export async function getTimescaleMarks(
  symbol: string,
  from: number,
  to: number,
  resolution: string
): Promise<UDFTimescaleMark[]> {
  const marks: UDFTimescaleMark[] = [];
  
  // Add significant events (in production, from events API)
  const events = [
    { time: from + 86400, label: 'H', tooltip: ['Halving Event'], color: 'green' as const },
    { time: from + 172800, label: 'U', tooltip: ['Network Upgrade'], color: 'blue' as const },
  ];
  
  for (const event of events) {
    if (event.time >= from && event.time <= to) {
      marks.push({
        id: `ts_${event.time}`,
        time: event.time,
        color: event.color,
        label: event.label,
        tooltip: event.tooltip,
      });
    }
  }
  
  return marks;
}

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeSymbol(symbol: string): string {
  return symbol
    .toUpperCase()
    .replace('USDT', 'USD')
    .replace('USDC', 'USD')
    .replace('-', '/')
    .replace('_', '/');
}

interface Quote {
  lastPrice: number;
  bid: number;
  ask: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
}

async function fetchQuote(symbol: string): Promise<Quote> {
  // In production, fetch from exchange API
  // For now, generate realistic mock data
  const basePrice = getBasePrice(symbol);
  const volatility = 0.02;
  const randomChange = (Math.random() - 0.5) * volatility;
  
  const lastPrice = basePrice * (1 + randomChange);
  const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
  const high = Math.max(lastPrice, open) * (1 + Math.random() * 0.01);
  const low = Math.min(lastPrice, open) * (1 - Math.random() * 0.01);
  const prevClose = basePrice;
  const change = lastPrice - prevClose;
  const spread = basePrice * 0.0001;
  
  return {
    lastPrice: round(lastPrice, 2),
    bid: round(lastPrice - spread / 2, 2),
    ask: round(lastPrice + spread / 2, 2),
    open: round(open, 2),
    high: round(high, 2),
    low: round(low, 2),
    prevClose: round(prevClose, 2),
    change: round(change, 2),
    changePercent: round((change / prevClose) * 100, 2),
    volume: Math.floor(Math.random() * 1000000000),
  };
}

async function fetchHistoricalBars(
  symbol: string,
  from: number,
  to: number,
  resolution: string,
  countback?: number
): Promise<UDFBar[]> {
  const bars: UDFBar[] = [];
  const intervalMs = resolutionToMs(resolution);
  const basePrice = getBasePrice(symbol);
  
  // Calculate number of bars
  const maxBars = countback || Math.min(5000, Math.ceil((to - from) * 1000 / intervalMs));
  let time = from;
  let price = basePrice;
  
  for (let i = 0; i < maxBars && time <= to; i++) {
    const volatility = 0.005; // 0.5% per bar
    const change = (Math.random() - 0.5) * volatility * 2;
    
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);
    const volume = Math.floor(Math.random() * 10000 + 1000);
    
    bars.push({
      t: time,
      o: round(open, 2),
      h: round(high, 2),
      l: round(low, 2),
      c: round(close, 2),
      v: volume,
    });
    
    price = close;
    time += Math.floor(intervalMs / 1000);
  }
  
  return bars;
}

function resolutionToMs(resolution: string): number {
  const map: Record<string, number> = {
    '1': 60 * 1000,
    '5': 5 * 60 * 1000,
    '15': 15 * 60 * 1000,
    '30': 30 * 60 * 1000,
    '60': 60 * 60 * 1000,
    '120': 2 * 60 * 60 * 1000,
    '240': 4 * 60 * 60 * 1000,
    '360': 6 * 60 * 60 * 1000,
    '720': 12 * 60 * 60 * 1000,
    'D': 24 * 60 * 60 * 1000,
    'W': 7 * 24 * 60 * 60 * 1000,
    'M': 30 * 24 * 60 * 60 * 1000,
  };
  return map[resolution] || map['D'];
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'BTC/USD': 67500,
    'ETH/USD': 3450,
    'SOL/USD': 175,
    'BNB/USD': 580,
    'XRP/USD': 0.52,
    'ADA/USD': 0.45,
    'DOGE/USD': 0.12,
    'AVAX/USD': 35,
    'DOT/USD': 7.5,
    'LINK/USD': 15,
  };
  const normalized = normalizeSymbol(symbol);
  return prices[normalized] || 100;
}

function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// =============================================================================
// Streaming Interface
// =============================================================================

export interface StreamingCallbacks {
  onBars: (bars: UDFBar[]) => void;
  onQuotes: (quotes: UDFQuoteData[]) => void;
  onError: (error: Error) => void;
}

export interface StreamSubscription {
  unsubscribe: () => void;
}

/**
 * Subscribe to real-time bar updates
 */
export function subscribeBars(
  symbol: string,
  resolution: string,
  callback: (bar: UDFBar) => void
): StreamSubscription {
  const intervalMs = resolutionToMs(resolution);
  let lastBar: UDFBar | null = null;
  
  const interval = setInterval(async () => {
    try {
      const bars = await fetchHistoricalBars(
        symbol,
        Math.floor(Date.now() / 1000) - 60,
        Math.floor(Date.now() / 1000),
        resolution,
        1
      );
      
      if (bars.length > 0) {
        const newBar = bars[0];
        if (!lastBar || newBar.t !== lastBar.t) {
          callback(newBar);
          lastBar = newBar;
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    }
  }, Math.min(intervalMs, 5000));
  
  return {
    unsubscribe: () => clearInterval(interval),
  };
}

/**
 * Subscribe to real-time quote updates
 */
export function subscribeQuotes(
  symbols: string[],
  callback: (quote: UDFQuoteData) => void
): StreamSubscription {
  const interval = setInterval(async () => {
    try {
      const response = await getQuotes(symbols);
      for (const quote of response.d) {
        if (quote.s === 'ok') {
          callback(quote);
        }
      }
    } catch (error) {
      console.error('Quote streaming error:', error);
    }
  }, 1000);
  
  return {
    unsubscribe: () => clearInterval(interval),
  };
}

// =============================================================================
// TradingView Widget Configuration
// =============================================================================

export interface WidgetConfig {
  symbol: string;
  interval: string;
  timezone: string;
  theme: 'light' | 'dark';
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  hide_top_toolbar: boolean;
  hide_legend: boolean;
  save_image: boolean;
  container_id: string;
  datafeed: string;
  library_path: string;
  fullscreen: boolean;
  autosize: boolean;
  studies_overrides: Record<string, unknown>;
  disabled_features: string[];
  enabled_features: string[];
}

/**
 * Generate TradingView widget configuration
 */
export function generateWidgetConfig(options: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    symbol: options.symbol || 'BTC/USD',
    interval: options.interval || 'D',
    timezone: options.timezone || 'Etc/UTC',
    theme: options.theme || 'dark',
    style: options.style || '1',
    locale: options.locale || 'en',
    toolbar_bg: options.toolbar_bg || '#f1f3f6',
    enable_publishing: options.enable_publishing ?? false,
    hide_top_toolbar: options.hide_top_toolbar ?? false,
    hide_legend: options.hide_legend ?? false,
    save_image: options.save_image ?? true,
    container_id: options.container_id || 'tradingview_chart',
    datafeed: options.datafeed || '/api/tradingview',
    library_path: options.library_path || '/charting_library/',
    fullscreen: options.fullscreen ?? false,
    autosize: options.autosize ?? true,
    studies_overrides: options.studies_overrides || {},
    disabled_features: options.disabled_features || [
      'use_localstorage_for_settings',
    ],
    enabled_features: options.enabled_features || [
      'study_templates',
    ],
  };
}
