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
  // Ignore resolution for linting
  void resolution;
  
  const marks: UDFMark[] = [];
  const normalized = normalizeSymbol(symbol);
  const baseSymbol = normalized.replace('/USD', '').toLowerCase();
  
  try {
    // Fetch news related to the symbol from our API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/news?q=${baseSymbol}&limit=10`,
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const articles = data.articles || [];
      
      for (const article of articles) {
        const articleTime = Math.floor(new Date(article.publishedAt || article.date).getTime() / 1000);
        
        if (articleTime >= from && articleTime <= to) {
          // Determine color based on sentiment
          let color: 'red' | 'green' | 'blue' | 'yellow' = 'blue';
          if (article.sentiment === 'positive' || article.sentiment > 0.3) color = 'green';
          else if (article.sentiment === 'negative' || article.sentiment < -0.3) color = 'red';
          else if (article.title?.toLowerCase().includes('regulation') || 
                   article.title?.toLowerCase().includes('sec')) color = 'yellow';
          
          marks.push({
            id: `mark_${articleTime}_${article.id || Math.random().toString(36)}`,
            time: articleTime,
            color,
            text: article.title || 'News Update',
            label: (article.title || 'N').charAt(0).toUpperCase(),
            labelFontColor: 'white',
            minSize: 20,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch news marks:', error);
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
  const normalized = normalizeSymbol(symbol);
  const baseSymbol = normalized.replace('/USD', '').toUpperCase();
  
  try {
    // Fetch from Binance API for real-time quotes
    const binanceSymbol = `${baseSymbol}USDT`;
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      { next: { revalidate: 5 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const lastPrice = parseFloat(data.lastPrice);
      const open = parseFloat(data.openPrice);
      const prevClose = parseFloat(data.prevClosePrice);
      const change = lastPrice - prevClose;
      
      return {
        lastPrice: round(lastPrice, 2),
        bid: round(parseFloat(data.bidPrice), 2),
        ask: round(parseFloat(data.askPrice), 2),
        open: round(open, 2),
        high: round(parseFloat(data.highPrice), 2),
        low: round(parseFloat(data.lowPrice), 2),
        prevClose: round(prevClose, 2),
        change: round(change, 2),
        changePercent: round(parseFloat(data.priceChangePercent), 2),
        volume: parseFloat(data.volume),
      };
    }
  } catch (error) {
    console.error('Failed to fetch quote from Binance:', error);
  }
  
  // Fallback to CoinGecko for less common pairs
  try {
    const geckoId = symbolToGeckoId(baseSymbol);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const coinData = data[geckoId];
      if (coinData) {
        const lastPrice = coinData.usd;
        const change24h = coinData.usd_24h_change || 0;
        const prevClose = lastPrice / (1 + change24h / 100);
        
        return {
          lastPrice: round(lastPrice, 2),
          bid: round(lastPrice * 0.9999, 2),
          ask: round(lastPrice * 1.0001, 2),
          open: round(prevClose, 2),
          high: round(lastPrice * 1.02, 2),
          low: round(lastPrice * 0.98, 2),
          prevClose: round(prevClose, 2),
          change: round(lastPrice - prevClose, 2),
          changePercent: round(change24h, 2),
          volume: coinData.usd_24h_vol || 0,
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch quote from CoinGecko:', error);
  }
  
  // Return empty quote if no data available
  return {
    lastPrice: 0,
    bid: 0,
    ask: 0,
    open: 0,
    high: 0,
    low: 0,
    prevClose: 0,
    change: 0,
    changePercent: 0,
    volume: 0,
  };
}

function symbolToGeckoId(symbol: string): string {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'ATOM': 'cosmos',
    'UNI': 'uniswap',
    'LTC': 'litecoin',
  };
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}

async function fetchHistoricalBars(
  symbol: string,
  from: number,
  to: number,
  resolution: string,
  countback?: number
): Promise<UDFBar[]> {
  const normalized = normalizeSymbol(symbol);
  const baseSymbol = normalized.replace('/USD', '').toUpperCase();
  const binanceSymbol = `${baseSymbol}USDT`;
  
  // Map TradingView resolution to Binance interval
  const intervalMap: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '120': '2h',
    '240': '4h',
    '360': '6h',
    '720': '12h',
    'D': '1d',
    'W': '1w',
    'M': '1M',
  };
  const interval = intervalMap[resolution] || '1d';
  const limit = countback || Math.min(1000, Math.ceil((to - from) / resolutionToMs(resolution) * 1000));
  
  try {
    // Fetch from Binance Klines API
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.map((kline: [number, string, string, string, string, string]) => ({
        t: Math.floor(kline[0] / 1000), // Convert ms to seconds
        o: round(parseFloat(kline[1]), 2),
        h: round(parseFloat(kline[2]), 2),
        l: round(parseFloat(kline[3]), 2),
        c: round(parseFloat(kline[4]), 2),
        v: parseFloat(kline[5]),
      }));
    }
  } catch (error) {
    console.error('Failed to fetch klines from Binance:', error);
  }
  
  // Return empty array if no data available
  return [];
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
