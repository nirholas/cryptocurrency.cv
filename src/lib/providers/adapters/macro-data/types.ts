/**
 * Macro & Traditional Finance Data Types
 *
 * Shared types for the macro-data adapter chain. These extend the existing
 * `macro/types.ts` with additional fields (FedWatch, correlations with ticker
 * granularity, 52-week ranges) that are specific to this chain.
 *
 * @module providers/adapters/macro-data/types
 */

// =============================================================================
// INDICATORS
// =============================================================================

/**
 * A single macro/tradfi indicator with 52-week context.
 *
 * @example
 * ```ts
 * const dff: MacroIndicator = {
 *   name: 'Federal Funds Rate',
 *   ticker: 'DFF',
 *   value: 5.33,
 *   change24h: 0,
 *   changePercent24h: 0,
 *   high52w: 5.33,
 *   low52w: 5.08,
 *   timestamp: '2026-02-25T00:00:00Z',
 * };
 * ```
 */
export interface MacroIndicator {
  /** Human-readable name */
  name: string;
  /** Ticker / series ID (e.g. 'DFF', 'SPY', '^GSPC') */
  ticker: string;
  /** Latest value */
  value: number;
  /** Absolute change over the last 24 h (or last observation) */
  change24h: number;
  /** Percentage change over the last 24 h */
  changePercent24h: number;
  /** 52-week high */
  high52w: number;
  /** 52-week low */
  low52w: number;
  /** ISO-8601 timestamp of the observation */
  timestamp: string;
}

// =============================================================================
// CORRELATIONS
// =============================================================================

/**
 * Rolling correlation between a crypto asset and a macro indicator.
 */
export interface CryptoMacroCorrelation {
  /** Pair label, e.g. "BTC-SP500" */
  pair: string;
  /** 30-day Pearson correlation (-1 … 1) */
  correlation30d: number;
  /** 90-day Pearson correlation (-1 … 1) */
  correlation90d: number;
  /** Simplified directional label */
  direction: 'positive' | 'negative' | 'neutral';
}

// =============================================================================
// FED WATCH
// =============================================================================

/**
 * CME FedWatch–style rate probability snapshot.
 */
export interface FedWatchData {
  /** ISO-8601 date of the next FOMC meeting */
  nextMeeting: string;
  /** Current effective federal funds rate (%) */
  currentRate: number;
  /** Probabilities for each target rate at the next meeting */
  probabilities: Array<{ rate: number; probability: number }>;
}

// =============================================================================
// AGGREGATED OVERVIEW
// =============================================================================

/**
 * Full macro overview payload returned by the macro-data provider chain.
 */
export interface MacroOverview {
  /** All fetched macro indicators */
  indicators: MacroIndicator[];
  /** BTC ↔ macro correlations (populated downstream) */
  correlations: CryptoMacroCorrelation[];
  /** FedWatch data if available */
  fedWatch: FedWatchData | null;
  /** ISO-8601 fetch timestamp */
  timestamp: string;
}
