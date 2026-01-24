/**
 * TradingView Integration Service
 * 
 * Enterprise-grade TradingView integration for cryptocurrency charting and analysis.
 * Provides Pine Script generation, indicator data, alerts, and widget embedding.
 * 
 * Features:
 * - Pine Script code generation for custom indicators
 * - Chart widget configuration and embedding
 * - Technical analysis data for TradingView overlays
 * - Alert conditions and webhook integration
 * - Drawing tools data export (trend lines, channels, etc.)
 * - Multi-timeframe analysis support
 * - Custom indicator library
 * - Screener integration
 * 
 * @module tradingview
 */

import { getTopCoins, getHistoricalPrices, type TokenPrice } from './market-data';
import { db } from './database';

// =============================================================================
// TYPES
// =============================================================================

export type Timeframe = 
  | '1' | '3' | '5' | '15' | '30' | '45'  // Minutes
  | '60' | '120' | '180' | '240'           // Hours
  | 'D' | 'W' | 'M';                       // Day/Week/Month

export type ChartType = 
  | 'bars' | 'candles' | 'hollowCandles'
  | 'heikinAshi' | 'line' | 'area'
  | 'baseline' | 'columns' | 'lineWithMarkers';

export interface TradingViewWidget {
  type: WidgetType;
  config: WidgetConfig;
  embedCode: string;
}

export type WidgetType = 
  | 'chart'
  | 'ticker'
  | 'screener'
  | 'hotlists'
  | 'marketOverview'
  | 'cryptoMarketCap'
  | 'timeline'
  | 'technicalAnalysis'
  | 'fundamentalData'
  | 'mini-chart'
  | 'symbol-overview';

export interface WidgetConfig {
  width?: string | number;
  height?: string | number;
  symbol?: string;
  symbols?: string[];
  interval?: Timeframe;
  timezone?: string;
  theme?: 'light' | 'dark';
  locale?: string;
  autosize?: boolean;
  hideSideToolbar?: boolean;
  hideTopToolbar?: boolean;
  allowSymbolChange?: boolean;
  showIntervalTabs?: boolean;
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  studies?: string[];
  container?: string;
  colorTheme?: 'light' | 'dark';
  gridColor?: string;
  trendLineColor?: string;
  backgroundColor?: string;
  fontColor?: string;
}

export interface PineScriptIndicator {
  id: string;
  name: string;
  description: string;
  version: number;
  code: string;
  inputs: PineScriptInput[];
  plots: PineScriptPlot[];
  overlay: boolean;
  tags: string[];
  created: string;
  updated: string;
}

export interface PineScriptInput {
  name: string;
  type: 'int' | 'float' | 'bool' | 'string' | 'source' | 'color';
  defaultValue: unknown;
  minValue?: number;
  maxValue?: number;
  options?: string[];
  tooltip?: string;
}

export interface PineScriptPlot {
  name: string;
  type: 'line' | 'histogram' | 'circles' | 'columns' | 'area' | 'areabr' | 'stepline';
  color?: string;
  lineWidth?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface TradingViewAlert {
  id: string;
  name: string;
  symbol: string;
  condition: AlertCondition;
  message: string;
  webhook?: WebhookConfig;
  frequency: 'once' | 'every_bar' | 'every_bar_close' | 'per_minute';
  enabled: boolean;
  triggered: number;
  lastTriggered?: string;
  created: string;
}

export interface AlertCondition {
  type: AlertConditionType;
  indicator?: string;
  value?: number;
  value2?: number;
  timeframe?: Timeframe;
}

export type AlertConditionType =
  | 'crossing' | 'crossing_up' | 'crossing_down'
  | 'greater_than' | 'less_than'
  | 'entering_channel' | 'exiting_channel'
  | 'inside_channel' | 'outside_channel'
  | 'moving_up' | 'moving_down'
  | 'moving_up_percent' | 'moving_down_percent';

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

export interface DrawingData {
  id: string;
  type: DrawingType;
  symbol: string;
  timeframe: Timeframe;
  points: DrawingPoint[];
  style: DrawingStyle;
  visible: boolean;
  created: string;
}

export type DrawingType = 
  | 'trendline' | 'horizontal_line' | 'vertical_line'
  | 'channel' | 'pitchfork' | 'fib_retracement'
  | 'fib_extension' | 'gann_fan' | 'rectangle'
  | 'ellipse' | 'triangle' | 'arrow' | 'text';

export interface DrawingPoint {
  time: number;  // Unix timestamp
  price: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  fill?: boolean;
  fillColor?: string;
  showLabel?: boolean;
  labelText?: string;
}

export interface TechnicalAnalysisData {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  summary: {
    recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    buy: number;
    sell: number;
    neutral: number;
  };
  oscillators: IndicatorSignal[];
  movingAverages: IndicatorSignal[];
  pivotPoints: PivotPoints;
}

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
}

export interface PivotPoints {
  type: 'classic' | 'fibonacci' | 'camarilla' | 'woodie' | 'demark';
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface ScreenerFilter {
  column: string;
  operator: 'greater' | 'less' | 'equal' | 'not_equal' | 'in_range' | 'crosses' | 'above' | 'below';
  value: number | [number, number];
}

export interface ScreenerResult {
  symbol: string;
  exchange: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  indicators: Record<string, number>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INDICATORS_COLLECTION = 'tv_indicators';
const ALERTS_COLLECTION = 'tv_alerts';
const DRAWINGS_COLLECTION = 'tv_drawings';

const CRYPTO_EXCHANGES = [
  'BINANCE', 'COINBASE', 'KRAKEN', 'BITSTAMP', 
  'BITFINEX', 'GEMINI', 'KUCOIN', 'HUOBI', 'OKX'
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return `tv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function symbolToTradingView(symbol: string, exchange: string = 'BINANCE'): string {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${exchange}:${normalized}USDT`;
}

// =============================================================================
// WIDGET GENERATION
// =============================================================================

/**
 * Generate TradingView chart widget embed code
 */
export function generateChartWidget(config: Partial<WidgetConfig> = {}): TradingViewWidget {
  const fullConfig: WidgetConfig = {
    width: '100%',
    height: 500,
    symbol: 'BINANCE:BTCUSDT',
    interval: 'D',
    timezone: 'Etc/UTC',
    theme: 'dark',
    locale: 'en',
    autosize: true,
    hideSideToolbar: false,
    hideTopToolbar: false,
    allowSymbolChange: true,
    showIntervalTabs: true,
    details: true,
    hotlist: true,
    calendar: true,
    studies: [],
    ...config,
  };

  const widgetId = `tradingview_${Date.now()}`;
  
  const embedCode = `
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container" id="${widgetId}">
  <div id="${widgetId}_chart"></div>
</div>
<script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
<script type="text/javascript">
new TradingView.widget({
  "width": ${typeof fullConfig.width === 'string' ? `"${fullConfig.width}"` : fullConfig.width},
  "height": ${fullConfig.height},
  "symbol": "${fullConfig.symbol}",
  "interval": "${fullConfig.interval}",
  "timezone": "${fullConfig.timezone}",
  "theme": "${fullConfig.theme}",
  "style": "1",
  "locale": "${fullConfig.locale}",
  "toolbar_bg": "#f1f3f6",
  "enable_publishing": false,
  "allow_symbol_change": ${fullConfig.allowSymbolChange},
  "container_id": "${widgetId}_chart",
  "studies": ${JSON.stringify(fullConfig.studies)}
});
</script>
<!-- TradingView Widget END -->
`.trim();

  return {
    type: 'chart',
    config: fullConfig,
    embedCode,
  };
}

/**
 * Generate ticker tape widget
 */
export function generateTickerWidget(symbols: string[], config: Partial<WidgetConfig> = {}): TradingViewWidget {
  const symbolsConfig = symbols.map(s => ({
    proName: symbolToTradingView(s),
    title: s.toUpperCase(),
  }));

  const embedCode = `
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
</div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
{
  "symbols": ${JSON.stringify(symbolsConfig)},
  "showSymbolLogo": true,
  "colorTheme": "${config.theme || 'dark'}",
  "isTransparent": false,
  "displayMode": "adaptive",
  "locale": "${config.locale || 'en'}"
}
</script>
<!-- TradingView Widget END -->
`.trim();

  return {
    type: 'ticker',
    config: { ...config, symbols },
    embedCode,
  };
}

/**
 * Generate technical analysis widget
 */
export function generateTechnicalAnalysisWidget(
  symbol: string, 
  config: Partial<WidgetConfig> = {}
): TradingViewWidget {
  const tvSymbol = symbolToTradingView(symbol);
  
  const embedCode = `
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
</div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" async>
{
  "interval": "${config.interval || '1D'}",
  "width": ${config.width || '"100%"'},
  "isTransparent": false,
  "height": ${config.height || 400},
  "symbol": "${tvSymbol}",
  "showIntervalTabs": true,
  "locale": "${config.locale || 'en'}",
  "colorTheme": "${config.theme || 'dark'}"
}
</script>
<!-- TradingView Widget END -->
`.trim();

  return {
    type: 'technicalAnalysis',
    config: { ...config, symbol: tvSymbol },
    embedCode,
  };
}

/**
 * Generate crypto market cap widget
 */
export function generateCryptoMarketWidget(config: Partial<WidgetConfig> = {}): TradingViewWidget {
  const embedCode = `
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
</div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-screener.js" async>
{
  "width": ${config.width || '"100%"'},
  "height": ${config.height || 500},
  "defaultColumn": "overview",
  "screener_type": "crypto_mkt",
  "displayCurrency": "USD",
  "colorTheme": "${config.theme || 'dark'}",
  "locale": "${config.locale || 'en'}"
}
</script>
<!-- TradingView Widget END -->
`.trim();

  return {
    type: 'cryptoMarketCap',
    config,
    embedCode,
  };
}

/**
 * Generate mini chart widget
 */
export function generateMiniChartWidget(symbol: string, config: Partial<WidgetConfig> = {}): TradingViewWidget {
  const tvSymbol = symbolToTradingView(symbol);
  
  const embedCode = `
<!-- TradingView Widget BEGIN -->
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
</div>
<script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
{
  "symbol": "${tvSymbol}",
  "width": ${config.width || '"100%"'},
  "height": ${config.height || 220},
  "locale": "${config.locale || 'en'}",
  "dateRange": "12M",
  "colorTheme": "${config.theme || 'dark'}",
  "isTransparent": false,
  "autosize": true,
  "largeChartUrl": ""
}
</script>
<!-- TradingView Widget END -->
`.trim();

  return {
    type: 'mini-chart',
    config: { ...config, symbol: tvSymbol },
    embedCode,
  };
}

// =============================================================================
// PINE SCRIPT GENERATION
// =============================================================================

/**
 * Generate Pine Script for custom indicator
 */
export function generatePineScript(indicator: Omit<PineScriptIndicator, 'id' | 'created' | 'updated' | 'code'>): string {
  const inputDefs = indicator.inputs.map(input => {
    const typeMap: Record<string, string> = {
      int: 'int',
      float: 'float',
      bool: 'bool',
      string: 'string',
      source: 'source',
      color: 'color',
    };
    
    let def = `${input.name} = input.${typeMap[input.type] || 'int'}(`;
    def += `defval = ${formatPineValue(input.defaultValue, input.type)}`;
    
    if (input.minValue !== undefined) def += `, minval = ${input.minValue}`;
    if (input.maxValue !== undefined) def += `, maxval = ${input.maxValue}`;
    if (input.options) def += `, options = [${input.options.map(o => `"${o}"`).join(', ')}]`;
    if (input.tooltip) def += `, tooltip = "${input.tooltip}"`;
    
    def += ')';
    return def;
  }).join('\n');
  
  const plotDefs = indicator.plots.map(plot => {
    const styleMap: Record<string, string> = {
      solid: 'plot.style_line',
      dashed: 'plot.style_linebr',
      dotted: 'plot.style_circles',
    };
    
    return `plot(${plot.name}_value, title = "${plot.name}", color = ${plot.color || 'color.blue'}, linewidth = ${plot.lineWidth || 2}, style = ${styleMap[plot.style || 'solid'] || 'plot.style_line'})`;
  }).join('\n');
  
  const script = `
//@version=5
indicator("${indicator.name}", overlay = ${indicator.overlay})

// Description: ${indicator.description}

// === INPUTS ===
${inputDefs}

// === CALCULATIONS ===
// Add your indicator logic here

// === PLOTTING ===
${plotDefs}
`.trim();

  return script;
}

function formatPineValue(value: unknown, type: string): string {
  if (type === 'string' || type === 'source') return `"${value}"`;
  if (type === 'color') return `color.${value || 'blue'}`;
  if (type === 'bool') return value ? 'true' : 'false';
  return String(value);
}

/**
 * Generate Moving Average Crossover indicator
 */
export function generateMACrossoverIndicator(
  fastPeriod: number = 9,
  slowPeriod: number = 21
): PineScriptIndicator {
  const code = `
//@version=5
indicator("MA Crossover Signal", overlay = true)

// Inputs
fastLength = input.int(defval = ${fastPeriod}, title = "Fast MA Length", minval = 1)
slowLength = input.int(defval = ${slowPeriod}, title = "Slow MA Length", minval = 1)
maType = input.string(defval = "EMA", title = "MA Type", options = ["SMA", "EMA", "WMA"])

// Calculate MAs
fastMA = switch maType
    "SMA" => ta.sma(close, fastLength)
    "EMA" => ta.ema(close, fastLength)
    "WMA" => ta.wma(close, fastLength)

slowMA = switch maType
    "SMA" => ta.sma(close, slowLength)
    "EMA" => ta.ema(close, slowLength)
    "WMA" => ta.wma(close, slowLength)

// Detect crossovers
bullish = ta.crossover(fastMA, slowMA)
bearish = ta.crossunder(fastMA, slowMA)

// Plot
plot(fastMA, color = color.green, linewidth = 2, title = "Fast MA")
plot(slowMA, color = color.red, linewidth = 2, title = "Slow MA")

// Signals
plotshape(bullish, style = shape.triangleup, location = location.belowbar, color = color.green, size = size.small, title = "Buy Signal")
plotshape(bearish, style = shape.triangledown, location = location.abovebar, color = color.red, size = size.small, title = "Sell Signal")

// Alerts
alertcondition(bullish, title = "Bullish Crossover", message = "MA Bullish Crossover on {{ticker}}")
alertcondition(bearish, title = "Bearish Crossover", message = "MA Bearish Crossover on {{ticker}}")
`.trim();

  return {
    id: generateId(),
    name: 'MA Crossover Signal',
    description: 'Moving Average crossover strategy with customizable MA types and periods',
    version: 5,
    code,
    inputs: [
      { name: 'fastLength', type: 'int', defaultValue: fastPeriod, minValue: 1, tooltip: 'Fast MA period' },
      { name: 'slowLength', type: 'int', defaultValue: slowPeriod, minValue: 1, tooltip: 'Slow MA period' },
      { name: 'maType', type: 'string', defaultValue: 'EMA', options: ['SMA', 'EMA', 'WMA'] },
    ],
    plots: [
      { name: 'fastMA', type: 'line', color: 'color.green', lineWidth: 2 },
      { name: 'slowMA', type: 'line', color: 'color.red', lineWidth: 2 },
    ],
    overlay: true,
    tags: ['trend', 'crossover', 'moving-average'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * Generate RSI Divergence indicator
 */
export function generateRSIDivergenceIndicator(): PineScriptIndicator {
  const code = `
//@version=5
indicator("RSI Divergence Detector", overlay = false)

// Inputs
rsiLength = input.int(defval = 14, title = "RSI Length", minval = 1)
lookback = input.int(defval = 5, title = "Divergence Lookback", minval = 2, maxval = 50)
showLabels = input.bool(defval = true, title = "Show Divergence Labels")

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Find pivots
ph = ta.pivothigh(rsi, lookback, lookback)
pl = ta.pivotlow(rsi, lookback, lookback)

// Price pivots
priceHigh = ta.pivothigh(high, lookback, lookback)
priceLow = ta.pivotlow(low, lookback, lookback)

// Detect divergences
bullishDiv = not na(pl) and pl > pl[lookback] and low[lookback] < low[2*lookback] ? 1 : 0
bearishDiv = not na(ph) and ph < ph[lookback] and high[lookback] > high[2*lookback] ? 1 : 0

// Plot RSI
plot(rsi, color = color.blue, linewidth = 2, title = "RSI")
hline(70, "Overbought", color = color.red, linestyle = hline.style_dashed)
hline(30, "Oversold", color = color.green, linestyle = hline.style_dashed)

// Plot divergence signals
bgcolor(bullishDiv ? color.new(color.green, 90) : na, title = "Bullish Divergence")
bgcolor(bearishDiv ? color.new(color.red, 90) : na, title = "Bearish Divergence")

// Alerts
alertcondition(bullishDiv, title = "Bullish RSI Divergence", message = "Bullish RSI divergence on {{ticker}}")
alertcondition(bearishDiv, title = "Bearish RSI Divergence", message = "Bearish RSI divergence on {{ticker}}")
`.trim();

  return {
    id: generateId(),
    name: 'RSI Divergence Detector',
    description: 'Detects bullish and bearish RSI divergences for potential reversals',
    version: 5,
    code,
    inputs: [
      { name: 'rsiLength', type: 'int', defaultValue: 14, minValue: 1 },
      { name: 'lookback', type: 'int', defaultValue: 5, minValue: 2, maxValue: 50 },
      { name: 'showLabels', type: 'bool', defaultValue: true },
    ],
    plots: [
      { name: 'rsi', type: 'line', color: 'color.blue', lineWidth: 2 },
    ],
    overlay: false,
    tags: ['oscillator', 'divergence', 'reversal', 'rsi'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * Generate Volume Profile indicator
 */
export function generateVolumeProfileIndicator(): PineScriptIndicator {
  const code = `
//@version=5
indicator("Volume Profile", overlay = true)

// Inputs
lookback = input.int(defval = 100, title = "Lookback Period", minval = 10)
rows = input.int(defval = 24, title = "Number of Rows", minval = 5, maxval = 100)
valueAreaPercent = input.float(defval = 70.0, title = "Value Area %", minval = 50, maxval = 100)

// Calculate price range
highestPrice = ta.highest(high, lookback)
lowestPrice = ta.lowest(low, lookback)
priceRange = highestPrice - lowestPrice
rowHeight = priceRange / rows

// Volume accumulation per price level (simplified)
var float[] volumeAtPrice = array.new_float(rows, 0.0)

if barstate.islast
    for i = 0 to lookback - 1
        priceLevel = math.floor((close[i] - lowestPrice) / rowHeight)
        if priceLevel >= 0 and priceLevel < rows
            array.set(volumeAtPrice, priceLevel, array.get(volumeAtPrice, priceLevel) + volume[i])

// Find POC (Point of Control)
var float maxVol = 0.0
var int pocLevel = 0

if barstate.islast
    for i = 0 to rows - 1
        if array.get(volumeAtPrice, i) > maxVol
            maxVol := array.get(volumeAtPrice, i)
            pocLevel := i

pocPrice = lowestPrice + (pocLevel + 0.5) * rowHeight

// Plot POC line
plot(pocPrice, color = color.yellow, linewidth = 2, style = plot.style_linebr, title = "POC")

// Value Area bounds (simplified calculation)
vaHigh = pocPrice + rowHeight * 3
vaLow = pocPrice - rowHeight * 3

p1 = plot(vaHigh, color = color.new(color.blue, 50), title = "VA High")
p2 = plot(vaLow, color = color.new(color.blue, 50), title = "VA Low")
fill(p1, p2, color = color.new(color.blue, 90), title = "Value Area")
`.trim();

  return {
    id: generateId(),
    name: 'Volume Profile',
    description: 'Volume profile with Point of Control and Value Area',
    version: 5,
    code,
    inputs: [
      { name: 'lookback', type: 'int', defaultValue: 100, minValue: 10 },
      { name: 'rows', type: 'int', defaultValue: 24, minValue: 5, maxValue: 100 },
      { name: 'valueAreaPercent', type: 'float', defaultValue: 70.0, minValue: 50, maxValue: 100 },
    ],
    plots: [
      { name: 'pocPrice', type: 'line', color: 'color.yellow', lineWidth: 2 },
    ],
    overlay: true,
    tags: ['volume', 'profile', 'poc', 'value-area'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * Generate Crypto Fear & Greed indicator (custom)
 */
export function generateFearGreedIndicator(): PineScriptIndicator {
  const code = `
//@version=5
indicator("Crypto Fear & Greed Proxy", overlay = false)

// This indicator approximates market sentiment based on price action metrics
// Inputs
lookback = input.int(defval = 30, title = "Lookback Period", minval = 7)
volatilityWeight = input.float(defval = 25.0, title = "Volatility Weight %")
momentumWeight = input.float(defval = 25.0, title = "Momentum Weight %")
volumeWeight = input.float(defval = 25.0, title = "Volume Weight %")
trendWeight = input.float(defval = 25.0, title = "Trend Weight %")

// Calculate components
// 1. Volatility (inverted - low vol = greed)
volatility = ta.atr(14) / close * 100
volScore = 100 - math.min(volatility * 10, 100)

// 2. Momentum (RSI-based)
momentum = ta.rsi(close, 14)
momScore = momentum

// 3. Volume trend
avgVol = ta.sma(volume, lookback)
volTrend = volume / avgVol * 50
volTrendScore = math.min(volTrend, 100)

// 4. Price trend (distance from MA)
sma50 = ta.sma(close, 50)
trendDist = (close - sma50) / sma50 * 100
trendScore = 50 + math.min(math.max(trendDist * 5, -50), 50)

// Weighted composite
fearGreed = (volScore * volatilityWeight + momScore * momentumWeight + 
             volTrendScore * volumeWeight + trendScore * trendWeight) / 100

// Color coding
fgColor = fearGreed >= 75 ? color.green :
          fearGreed >= 55 ? color.lime :
          fearGreed >= 45 ? color.yellow :
          fearGreed >= 25 ? color.orange :
          color.red

// Plot
plot(fearGreed, color = fgColor, linewidth = 3, title = "Fear & Greed Index")
hline(75, "Extreme Greed", color = color.green, linestyle = hline.style_dashed)
hline(55, "Greed", color = color.lime, linestyle = hline.style_dotted)
hline(45, "Neutral", color = color.gray, linestyle = hline.style_solid)
hline(25, "Fear", color = color.orange, linestyle = hline.style_dotted)
hline(0, "Extreme Fear", color = color.red, linestyle = hline.style_dashed)

// Background zones
bgcolor(fearGreed >= 75 ? color.new(color.green, 90) : na)
bgcolor(fearGreed <= 25 ? color.new(color.red, 90) : na)

// Alerts
alertcondition(ta.crossover(fearGreed, 75), title = "Extreme Greed", message = "Market entering Extreme Greed zone")
alertcondition(ta.crossunder(fearGreed, 25), title = "Extreme Fear", message = "Market entering Extreme Fear zone")
`.trim();

  return {
    id: generateId(),
    name: 'Crypto Fear & Greed Proxy',
    description: 'Approximates market sentiment using volatility, momentum, volume, and trend',
    version: 5,
    code,
    inputs: [
      { name: 'lookback', type: 'int', defaultValue: 30, minValue: 7 },
      { name: 'volatilityWeight', type: 'float', defaultValue: 25.0 },
      { name: 'momentumWeight', type: 'float', defaultValue: 25.0 },
      { name: 'volumeWeight', type: 'float', defaultValue: 25.0 },
      { name: 'trendWeight', type: 'float', defaultValue: 25.0 },
    ],
    plots: [
      { name: 'fearGreed', type: 'line', lineWidth: 3 },
    ],
    overlay: false,
    tags: ['sentiment', 'fear-greed', 'market-psychology'],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

// =============================================================================
// ALERT MANAGEMENT
// =============================================================================

/**
 * Create a TradingView-style alert
 */
export async function createAlert(alert: Omit<TradingViewAlert, 'id' | 'triggered' | 'created'>): Promise<TradingViewAlert> {
  const fullAlert: TradingViewAlert = {
    ...alert,
    id: generateId(),
    triggered: 0,
    created: new Date().toISOString(),
  };
  
  await db.saveDocument(ALERTS_COLLECTION, fullAlert.id, fullAlert);
  return fullAlert;
}

/**
 * Get alert by ID
 */
export async function getAlert(id: string): Promise<TradingViewAlert | null> {
  const doc = await db.getDocument<TradingViewAlert>(ALERTS_COLLECTION, id);
  return doc?.data || null;
}

/**
 * List all alerts
 */
export async function listAlerts(options: {
  symbol?: string;
  enabled?: boolean;
  limit?: number;
} = {}): Promise<TradingViewAlert[]> {
  const docs = await db.listDocuments<TradingViewAlert>(ALERTS_COLLECTION, { 
    limit: options.limit || 100 
  });
  
  let alerts = docs.map(d => d.data);
  
  if (options.symbol) {
    alerts = alerts.filter(a => a.symbol === options.symbol);
  }
  
  if (options.enabled !== undefined) {
    alerts = alerts.filter(a => a.enabled === options.enabled);
  }
  
  return alerts;
}

/**
 * Update alert
 */
export async function updateAlert(
  id: string, 
  updates: Partial<Omit<TradingViewAlert, 'id' | 'created'>>
): Promise<TradingViewAlert | null> {
  const existing = await getAlert(id);
  if (!existing) return null;
  
  const updated = { ...existing, ...updates };
  await db.saveDocument(ALERTS_COLLECTION, id, updated);
  return updated;
}

/**
 * Delete alert
 */
export async function deleteAlert(id: string): Promise<boolean> {
  await db.deleteDocument(ALERTS_COLLECTION, id);
  return true;
}

/**
 * Trigger alert (for webhook simulation)
 */
export async function triggerAlert(id: string): Promise<void> {
  const alert = await getAlert(id);
  if (!alert) return;
  
  await updateAlert(id, {
    triggered: alert.triggered + 1,
    lastTriggered: new Date().toISOString(),
  });
  
  // Call webhook if configured
  if (alert.webhook) {
    try {
      await fetch(alert.webhook.url, {
        method: alert.webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...alert.webhook.headers,
        },
        body: alert.webhook.bodyTemplate 
          ? alert.webhook.bodyTemplate.replace('{{message}}', alert.message)
          : JSON.stringify({ message: alert.message, symbol: alert.symbol }),
      });
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
    }
  }
}

// =============================================================================
// INDICATOR STORAGE
// =============================================================================

/**
 * Save custom indicator
 */
export async function saveIndicator(indicator: PineScriptIndicator): Promise<PineScriptIndicator> {
  indicator.updated = new Date().toISOString();
  await db.saveDocument(INDICATORS_COLLECTION, indicator.id, indicator);
  return indicator;
}

/**
 * Get indicator by ID
 */
export async function getIndicator(id: string): Promise<PineScriptIndicator | null> {
  const doc = await db.getDocument<PineScriptIndicator>(INDICATORS_COLLECTION, id);
  return doc?.data || null;
}

/**
 * List saved indicators
 */
export async function listIndicators(options: {
  tags?: string[];
  overlay?: boolean;
  limit?: number;
} = {}): Promise<PineScriptIndicator[]> {
  const docs = await db.listDocuments<PineScriptIndicator>(INDICATORS_COLLECTION, { 
    limit: options.limit || 100 
  });
  
  let indicators = docs.map(d => d.data);
  
  if (options.tags && options.tags.length > 0) {
    indicators = indicators.filter(i => 
      options.tags!.some(tag => i.tags.includes(tag))
    );
  }
  
  if (options.overlay !== undefined) {
    indicators = indicators.filter(i => i.overlay === options.overlay);
  }
  
  return indicators;
}

// =============================================================================
// TECHNICAL ANALYSIS DATA
// =============================================================================

/**
 * Calculate technical analysis summary (simulated TradingView style)
 */
export async function getTechnicalAnalysis(
  symbol: string,
  timeframe: Timeframe = 'D'
): Promise<TechnicalAnalysisData> {
  // Get historical data
  const days = timeframe === 'D' ? 100 : timeframe === 'W' ? 700 : 200;
  const historicalData = await getHistoricalPrices(symbol.toLowerCase(), days);
  
  if (!historicalData || historicalData.prices.length < 20) {
    return createEmptyTechnicalAnalysis(symbol, timeframe);
  }
  
  const prices = historicalData.prices.map(p => p[1]);
  const latestPrice = prices[prices.length - 1];
  
  // Calculate indicators
  const oscillators: IndicatorSignal[] = [
    { name: 'RSI(14)', value: calculateRSI(prices, 14), signal: 'neutral' },
    { name: 'STOCH(9,6)', value: calculateStochastic(prices), signal: 'neutral' },
    { name: 'CCI(20)', value: calculateCCI(prices), signal: 'neutral' },
    { name: 'MACD(12,26)', value: calculateMACD(prices), signal: 'neutral' },
    { name: 'MOM(10)', value: calculateMomentum(prices, 10), signal: 'neutral' },
    { name: 'Williams %R', value: calculateWilliamsR(prices), signal: 'neutral' },
  ];
  
  // Determine signals
  oscillators.forEach(osc => {
    if (osc.name.includes('RSI')) {
      osc.signal = osc.value > 70 ? 'sell' : osc.value < 30 ? 'buy' : 'neutral';
    } else if (osc.name.includes('STOCH')) {
      osc.signal = osc.value > 80 ? 'sell' : osc.value < 20 ? 'buy' : 'neutral';
    } else if (osc.name.includes('CCI')) {
      osc.signal = osc.value > 100 ? 'sell' : osc.value < -100 ? 'buy' : 'neutral';
    } else if (osc.name.includes('MACD')) {
      osc.signal = osc.value > 0 ? 'buy' : osc.value < 0 ? 'sell' : 'neutral';
    }
  });
  
  // Calculate MAs
  const movingAverages: IndicatorSignal[] = [
    { name: 'EMA(10)', value: calculateEMA(prices, 10), signal: 'neutral' },
    { name: 'SMA(10)', value: calculateSMA(prices, 10), signal: 'neutral' },
    { name: 'EMA(20)', value: calculateEMA(prices, 20), signal: 'neutral' },
    { name: 'SMA(20)', value: calculateSMA(prices, 20), signal: 'neutral' },
    { name: 'EMA(50)', value: calculateEMA(prices, 50), signal: 'neutral' },
    { name: 'SMA(50)', value: calculateSMA(prices, 50), signal: 'neutral' },
    { name: 'EMA(100)', value: calculateEMA(prices, Math.min(100, prices.length - 1)), signal: 'neutral' },
    { name: 'SMA(200)', value: calculateSMA(prices, Math.min(200, prices.length - 1)), signal: 'neutral' },
  ];
  
  movingAverages.forEach(ma => {
    ma.signal = latestPrice > ma.value ? 'buy' : latestPrice < ma.value ? 'sell' : 'neutral';
  });
  
  // Calculate summary
  const buyCount = [...oscillators, ...movingAverages].filter(i => i.signal === 'buy').length;
  const sellCount = [...oscillators, ...movingAverages].filter(i => i.signal === 'sell').length;
  const neutralCount = [...oscillators, ...movingAverages].filter(i => i.signal === 'neutral').length;
  
  let recommendation: TechnicalAnalysisData['summary']['recommendation'];
  const diff = buyCount - sellCount;
  const total = buyCount + sellCount + neutralCount;
  
  if (diff > total * 0.3) recommendation = 'strong_buy';
  else if (diff > total * 0.1) recommendation = 'buy';
  else if (diff < -total * 0.3) recommendation = 'strong_sell';
  else if (diff < -total * 0.1) recommendation = 'sell';
  else recommendation = 'neutral';
  
  // Calculate pivot points
  const pivotPoints = calculatePivotPoints(prices);
  
  return {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    summary: {
      recommendation,
      buy: buyCount,
      sell: sellCount,
      neutral: neutralCount,
    },
    oscillators,
    movingAverages,
    pivotPoints,
  };
}

function createEmptyTechnicalAnalysis(symbol: string, timeframe: Timeframe): TechnicalAnalysisData {
  return {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    summary: { recommendation: 'neutral', buy: 0, sell: 0, neutral: 0 },
    oscillators: [],
    movingAverages: [],
    pivotPoints: { type: 'classic', pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 },
  };
}

// Technical indicator calculations
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return calculateSMA(prices, prices.length);
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateStochastic(prices: number[], period: number = 14): number {
  if (prices.length < period) return 50;
  
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const close = slice[slice.length - 1];
  
  if (high === low) return 50;
  return ((close - low) / (high - low)) * 100;
}

function calculateCCI(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;
  
  const slice = prices.slice(-period);
  const tp = slice[slice.length - 1]; // Typical price approximation
  const sma = calculateSMA(slice, period);
  const meanDev = slice.reduce((sum, p) => sum + Math.abs(p - sma), 0) / period;
  
  if (meanDev === 0) return 0;
  return (tp - sma) / (0.015 * meanDev);
}

function calculateMACD(prices: number[]): number {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
}

function calculateMomentum(prices: number[], period: number = 10): number {
  if (prices.length <= period) return 0;
  return prices[prices.length - 1] - prices[prices.length - 1 - period];
}

function calculateWilliamsR(prices: number[], period: number = 14): number {
  if (prices.length < period) return -50;
  
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const close = slice[slice.length - 1];
  
  if (high === low) return -50;
  return ((high - close) / (high - low)) * -100;
}

function calculatePivotPoints(prices: number[]): PivotPoints {
  if (prices.length < 2) {
    return { type: 'classic', pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  }
  
  // Use recent data for high/low/close
  const recentPrices = prices.slice(-24);
  const high = Math.max(...recentPrices);
  const low = Math.min(...recentPrices);
  const close = recentPrices[recentPrices.length - 1];
  
  const pivot = (high + low + close) / 3;
  
  return {
    type: 'classic',
    pivot,
    r1: 2 * pivot - low,
    r2: pivot + (high - low),
    r3: high + 2 * (pivot - low),
    s1: 2 * pivot - high,
    s2: pivot - (high - low),
    s3: low - 2 * (high - pivot),
  };
}

// =============================================================================
// UDF (UNIVERSAL DATA FEED) PROTOCOL FUNCTIONS
// =============================================================================

/**
 * UDF Config - Server configuration
 */
export function getConfig() {
  return {
    supports_search: true,
    supports_group_request: false,
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [
      { value: '', name: 'All Exchanges', desc: '' },
      { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' },
      { value: 'COINBASE', name: 'Coinbase', desc: 'Coinbase Exchange' },
      { value: 'KRAKEN', name: 'Kraken', desc: 'Kraken Exchange' },
    ],
    symbols_types: [
      { name: 'All types', value: '' },
      { name: 'Crypto', value: 'crypto' },
    ],
    supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
    currency_codes: ['USD', 'BTC', 'ETH'],
  };
}

/**
 * UDF Server time
 */
export function getServerTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * UDF Symbol resolution
 */
export function resolveSymbol(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  
  const symbolInfo: Record<string, unknown> = {
    name: normalizedSymbol,
    ticker: normalizedSymbol,
    description: `${normalizedSymbol} Cryptocurrency`,
    type: 'crypto',
    session: '24x7',
    timezone: 'Etc/UTC',
    exchange: 'CRYPTO',
    minmov: 1,
    pricescale: normalizedSymbol.includes('BTC') ? 100 : 10000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
    volume_precision: 8,
    data_status: 'streaming',
  };
  
  return symbolInfo;
}

/**
 * UDF Symbol search
 */
export function searchSymbols(
  query: string,
  _type?: string,
  _exchange?: string,
  limit: number = 30
) {
  const symbols = [
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 
    'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'DOTUSD', 'MATICUSD',
    'LINKUSD', 'LTCUSD', 'UNIUSD', 'ATOMUSD', 'NEARUSD',
  ];
  
  const q = query.toUpperCase();
  const filtered = symbols
    .filter(s => s.includes(q))
    .slice(0, limit)
    .map(symbol => ({
      symbol,
      full_name: symbol,
      description: `${symbol.replace('USD', '')} / USD`,
      exchange: 'CRYPTO',
      type: 'crypto',
    }));
  
  return filtered;
}

/**
 * UDF Historical data
 */
export async function getHistory(
  symbol: string,
  from: number,
  to: number,
  resolution: string,
  _countback?: number
): Promise<{
  s: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
  nextTime?: number;
}> {
  try {
    // Get interval for API
    const intervalMap: Record<string, string> = {
      '1': '1m', '5': '5m', '15': '15m', '30': '30m',
      '60': '1h', '240': '4h', 'D': '1d', 'W': '1w', 'M': '1M',
    };
    const interval = intervalMap[resolution] || '1d';
    
    // Fetch from Binance
    const baseSymbol = symbol.replace('USD', 'USDT');
    const url = `https://api.binance.com/api/v3/klines?symbol=${baseSymbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return { s: 'no_data' };
    }
    
    const data = await response.json() as number[][];
    
    if (!data || data.length === 0) {
      return { s: 'no_data' };
    }
    
    const t: number[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const v: number[] = [];
    
    for (const candle of data) {
      t.push(Math.floor(candle[0] / 1000));
      o.push(parseFloat(String(candle[1])));
      h.push(parseFloat(String(candle[2])));
      l.push(parseFloat(String(candle[3])));
      c.push(parseFloat(String(candle[4])));
      v.push(parseFloat(String(candle[5])));
    }
    
    return { s: 'ok', t, o, h, l, c, v };
  } catch {
    return { s: 'error' };
  }
}

/**
 * UDF Real-time quotes
 */
export async function getQuotes(symbols: string[]): Promise<{
  s: string;
  d?: Array<{
    s: string;
    n: string;
    v: { ch: number; chp: number; lp: number; volume: number };
  }>;
}> {
  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const baseSymbol = symbol.replace('USD', 'USDT');
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${baseSymbol}`);
        if (!response.ok) return null;
        const data = await response.json() as { priceChange: string; priceChangePercent: string; lastPrice: string; volume: string };
        
        return {
          s: 'ok',
          n: symbol,
          v: {
            ch: parseFloat(data.priceChange),
            chp: parseFloat(data.priceChangePercent),
            lp: parseFloat(data.lastPrice),
            volume: parseFloat(data.volume),
          },
        };
      })
    );
    
    return {
      s: 'ok',
      d: results.filter((r): r is NonNullable<typeof r> => r !== null),
    };
  } catch {
    return { s: 'error' };
  }
}

/**
 * UDF Marks (news events on chart)
 */
export async function getMarks(
  _symbol: string,
  from: number,
  to: number,
  _resolution?: string
): Promise<{
  id: number[];
  time: number[];
  color: string[];
  text: string[];
  label: string[];
  labelFontColor: string[];
  minSize: number[];
}> {
  // Fetch real news marks from our API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/news?limit=10`,
      { next: { revalidate: 300 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const articles = data.articles || [];
      
      const marks = {
        id: [] as number[],
        time: [] as number[],
        color: [] as string[],
        text: [] as string[],
        label: [] as string[],
        labelFontColor: [] as string[],
        minSize: [] as number[],
      };
      
      articles.forEach((article: { publishedAt?: string; date?: string; title?: string; sentiment?: string | number }, i: number) => {
        const articleTime = Math.floor(new Date(article.publishedAt || article.date || Date.now()).getTime() / 1000);
        if (articleTime >= from && articleTime <= to) {
          let color = 'blue';
          if (article.sentiment === 'positive' || (typeof article.sentiment === 'number' && article.sentiment > 0.3)) color = 'green';
          else if (article.sentiment === 'negative' || (typeof article.sentiment === 'number' && article.sentiment < -0.3)) color = 'red';
          
          marks.id.push(i + 1);
          marks.time.push(articleTime);
          marks.color.push(color);
          marks.text.push(article.title || 'News');
          marks.label.push((article.title || 'N').charAt(0).toUpperCase());
          marks.labelFontColor.push('white');
          marks.minSize.push(20);
        }
      });
      
      return marks;
    }
  } catch (error) {
    console.error('Failed to fetch news marks:', error);
  }
  
  // Return empty marks if no data
  return {
    id: [],
    time: [],
    color: [],
    text: [],
    label: [],
    labelFontColor: [],
    minSize: [],
  };
}

/**
 * UDF Timescale marks
 */
export async function getTimescaleMarks(
  _symbol: string,
  _from: number,
  _to: number,
  _resolution?: string
): Promise<Array<{
  id: string;
  time: number;
  color: string;
  label: string;
  tooltip: string;
}>> {
  // Return empty array - timescale marks should come from real events
  return [];
}

/**
 * Generate widget configuration for embedding
 */
export function generateWidgetConfig(options: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    width: options.width || 800,
    height: options.height || 600,
    symbol: options.symbol || 'BTCUSD',
    interval: options.interval,
    theme: options.theme || 'dark',
    locale: options.locale || 'en',
    timezone: options.timezone || 'Etc/UTC',
    autosize: options.autosize ?? true,
    hideTopToolbar: options.hideTopToolbar ?? false,
    hideSideToolbar: options.hideSideToolbar ?? false,
    allowSymbolChange: options.allowSymbolChange ?? true,
    studies: options.studies || [],
    container: options.container || 'tradingview-widget',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const tradingView = {
  // Widgets
  generateChartWidget,
  generateTickerWidget,
  generateTechnicalAnalysisWidget,
  generateCryptoMarketWidget,
  generateMiniChartWidget,
  
  // Pine Script
  generatePineScript,
  generateMACrossoverIndicator,
  generateRSIDivergenceIndicator,
  generateVolumeProfileIndicator,
  generateFearGreedIndicator,
  
  // Alerts
  createAlert,
  getAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
  triggerAlert,
  
  // Indicators
  saveIndicator,
  getIndicator,
  listIndicators,
  
  // Technical Analysis
  getTechnicalAnalysis,
  
  // UDF Protocol
  getConfig,
  getServerTime,
  resolveSymbol,
  searchSymbols,
  getHistory,
  getQuotes,
  getMarks,
  getTimescaleMarks,
  generateWidgetConfig,
};

export default tradingView;
