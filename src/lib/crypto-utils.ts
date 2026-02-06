/**
 * Cryptocurrency Utility Functions
 * 
 * Common utilities for cryptocurrency data manipulation,
 * formatting, calculations, and analysis.
 * 
 * @module lib/crypto-utils
 */

// ═══════════════════════════════════════════════════════════════
// NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format a number as currency with appropriate precision
 * @param value - The number to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  if (value === 0) return '$0.00';
  
  // For very small values (like some altcoins)
  if (Math.abs(value) < 0.01) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumSignificantDigits: 2,
      maximumSignificantDigits: 4,
    }).format(value);
  }
  
  // For large values, use compact notation
  if (Math.abs(value) >= 1_000_000_000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(value);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';
  
  const tiers = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' },
  ];
  
  for (const tier of tiers) {
    if (Math.abs(value) >= tier.threshold) {
      const scaled = value / tier.threshold;
      return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${tier.suffix}`;
    }
  }
  
  return value.toFixed(2);
}

/**
 * Format percentage with sign and color hint
 */
export function formatPercentage(
  value: number,
  options: { showSign?: boolean; decimals?: number } = {}
): { text: string; isPositive: boolean; isNeutral: boolean } {
  const { showSign = true, decimals = 2 } = options;
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  let text = Math.abs(value).toFixed(decimals) + '%';
  if (showSign && !isNeutral) {
    text = (isPositive ? '+' : '-') + text;
  } else if (!isPositive && !isNeutral) {
    text = '-' + text;
  }
  
  return { text, isPositive, isNeutral };
}

/**
 * Format market cap with human-readable suffix
 */
export function formatMarketCap(value: number): string {
  return '$' + formatCompactNumber(value);
}

/**
 * Format supply numbers (circulating, total, max)
 */
export function formatSupply(value: number | null, symbol?: string): string {
  if (value === null || value === undefined) return '∞';
  const formatted = formatCompactNumber(value);
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted;
}

// ═══════════════════════════════════════════════════════════════
// PRICE ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate price change between two values
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): { change: number; percentage: number } {
  const change = currentPrice - previousPrice;
  const percentage = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
  return { change, percentage };
}

/**
 * Calculate distance from ATH (All-Time High)
 */
export function calculateATHDistance(
  currentPrice: number,
  athPrice: number
): { distance: number; percentage: number } {
  const distance = athPrice - currentPrice;
  const percentage = athPrice !== 0 ? (distance / athPrice) * 100 : 0;
  return { distance, percentage };
}

/**
 * Determine price trend based on multiple timeframes
 */
export function determinePriceTrend(changes: {
  '1h'?: number;
  '24h'?: number;
  '7d'?: number;
  '30d'?: number;
}): 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish' {
  const values = Object.values(changes).filter((v): v is number => v !== undefined);
  if (values.length === 0) return 'neutral';
  
  const avgChange = values.reduce((a, b) => a + b, 0) / values.length;
  const allPositive = values.every(v => v > 0);
  const allNegative = values.every(v => v < 0);
  
  if (allPositive && avgChange > 10) return 'strong_bullish';
  if (allPositive || avgChange > 5) return 'bullish';
  if (allNegative && avgChange < -10) return 'strong_bearish';
  if (allNegative || avgChange < -5) return 'bearish';
  return 'neutral';
}

/**
 * Calculate volatility score (0-100)
 */
export function calculateVolatilityScore(priceChanges: number[]): number {
  if (priceChanges.length === 0) return 0;
  
  const mean = priceChanges.reduce((a, b) => a + Math.abs(b), 0) / priceChanges.length;
  const variance = priceChanges.reduce((sum, val) => 
    sum + Math.pow(Math.abs(val) - mean, 2), 0) / priceChanges.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-100 scale (assuming max reasonable stdDev of 50%)
  return Math.min(100, (stdDev / 50) * 100);
}

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export interface PortfolioAsset {
  symbol: string;
  amount: number;
  currentPrice: number;
  costBasis?: number;
}

/**
 * Calculate portfolio allocation percentages
 */
export function calculateAllocations(
  assets: PortfolioAsset[]
): Array<PortfolioAsset & { value: number; allocation: number }> {
  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.amount * asset.currentPrice,
    0
  );
  
  return assets.map(asset => ({
    ...asset,
    value: asset.amount * asset.currentPrice,
    allocation: totalValue > 0 ? (asset.amount * asset.currentPrice / totalValue) * 100 : 0,
  }));
}

/**
 * Calculate portfolio diversity score (0-100)
 * Higher score = more diversified
 */
export function calculateDiversityScore(allocations: number[]): number {
  if (allocations.length <= 1) return 0;
  
  // Use Herfindahl-Hirschman Index (inverted)
  const hhi = allocations.reduce((sum, alloc) => sum + Math.pow(alloc / 100, 2), 0);
  const maxHHI = 1; // 100% in one asset
  const minHHI = 1 / allocations.length; // Equal distribution
  
  // Normalize: 0 = concentrated, 100 = diversified
  return Math.round((1 - (hhi - minHHI) / (maxHHI - minHHI)) * 100);
}

/**
 * Calculate unrealized P&L
 */
export function calculateUnrealizedPnL(
  amount: number,
  currentPrice: number,
  costBasis: number
): { pnl: number; percentage: number } {
  const currentValue = amount * currentPrice;
  const costValue = amount * costBasis;
  const pnl = currentValue - costValue;
  const percentage = costValue !== 0 ? (pnl / costValue) * 100 : 0;
  return { pnl, percentage };
}

// ═══════════════════════════════════════════════════════════════
// MARKET METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate market dominance
 */
export function calculateDominance(
  marketCap: number,
  totalMarketCap: number
): number {
  if (totalMarketCap === 0) return 0;
  return (marketCap / totalMarketCap) * 100;
}

/**
 * Classify Fear & Greed Index value
 */
export function classifyFearGreedIndex(value: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (value <= 20) return { label: 'Extreme Fear', color: '#ea3943', emoji: '😱' };
  if (value <= 40) return { label: 'Fear', color: '#ea8c00', emoji: '😨' };
  if (value <= 60) return { label: 'Neutral', color: '#c5b738', emoji: '😐' };
  if (value <= 80) return { label: 'Greed', color: '#93d900', emoji: '😀' };
  return { label: 'Extreme Greed', color: '#16c784', emoji: '🤑' };
}

/**
 * Calculate 24h volume to market cap ratio
 * Higher ratio can indicate more trading activity/liquidity
 */
export function calculateVolumeToMarketCapRatio(
  volume24h: number,
  marketCap: number
): { ratio: number; classification: 'low' | 'normal' | 'high' | 'very_high' } {
  if (marketCap === 0) return { ratio: 0, classification: 'low' };
  
  const ratio = (volume24h / marketCap) * 100;
  
  let classification: 'low' | 'normal' | 'high' | 'very_high';
  if (ratio < 1) classification = 'low';
  else if (ratio < 5) classification = 'normal';
  else if (ratio < 15) classification = 'high';
  else classification = 'very_high';
  
  return { ratio, classification };
}

// ═══════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format timestamp as relative time (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date: Date | string | number): string {
  const now = Date.now();
  const then = typeof date === 'number' ? date : new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Get market session info (based on major exchanges)
 */
export function getMarketSession(): {
  session: 'asia' | 'europe' | 'us' | 'overlap';
  isActive: boolean;
  nextSession: string;
} {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  // Approximate market hours (simplified)
  // Asia: 00:00-09:00 UTC
  // Europe: 07:00-16:00 UTC
  // US: 13:00-22:00 UTC
  
  if (utcHour >= 0 && utcHour < 7) {
    return { session: 'asia', isActive: true, nextSession: 'Europe opens soon' };
  }
  if (utcHour >= 7 && utcHour < 13) {
    return { session: 'europe', isActive: true, nextSession: 'US opens soon' };
  }
  if (utcHour >= 13 && utcHour < 22) {
    return { session: 'us', isActive: true, nextSession: 'Asia opens soon' };
  }
  return { session: 'asia', isActive: true, nextSession: 'New day begins' };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION & PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Validate cryptocurrency address format (basic validation)
 */
export function validateCryptoAddress(
  address: string,
  chain: 'bitcoin' | 'ethereum' | 'solana'
): boolean {
  const patterns: Record<string, RegExp> = {
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  };
  
  return patterns[chain]?.test(address) ?? false;
}

/**
 * Parse coin ID from various formats
 */
export function parseCoinId(input: string): string {
  // Remove common prefixes/suffixes
  let id = input.toLowerCase().trim();
  
  // Handle common variations
  const mappings: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'dot': 'polkadot',
    'avax': 'avalanche-2',
    'matic': 'matic-network',
    'link': 'chainlink',
    'uni': 'uniswap',
    'atom': 'cosmos',
    'xrp': 'ripple',
    'doge': 'dogecoin',
    'shib': 'shiba-inu',
    'ltc': 'litecoin',
    'xlm': 'stellar',
    'bnb': 'binancecoin',
    'usdt': 'tether',
    'usdc': 'usd-coin',
  };
  
  return mappings[id] || id;
}

/**
 * Extract coin mentions from text
 */
export function extractCoinMentions(text: string): string[] {
  const patterns = [
    /\$([A-Z]{2,10})\b/g,  // $BTC, $ETH
    /\b(Bitcoin|Ethereum|Solana|Cardano|Polkadot|Dogecoin|Ripple|Litecoin)\b/gi,
  ];
  
  const mentions = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      mentions.add(match[1].toLowerCase());
    }
  }
  
  return Array.from(mentions);
}

// ═══════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get color for price change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return '#16c784'; // Green
  if (change < 0) return '#ea3943'; // Red
  return '#a1a1aa'; // Gray
}

/**
 * Generate gradient for price chart
 */
export function getChartGradient(isPositive: boolean): {
  start: string;
  end: string;
} {
  if (isPositive) {
    return { start: 'rgba(22, 199, 132, 0.5)', end: 'rgba(22, 199, 132, 0)' };
  }
  return { start: 'rgba(234, 57, 67, 0.5)', end: 'rgba(234, 57, 67, 0)' };
}

/**
 * Get sentiment color
 */
export function getSentimentColor(
  sentiment: 'bullish' | 'bearish' | 'neutral'
): string {
  const colors = {
    bullish: '#16c784',
    bearish: '#ea3943',
    neutral: '#737373',
  };
  return colors[sentiment];
}
