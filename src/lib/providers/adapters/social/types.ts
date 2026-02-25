/**
 * Social Types — Shared types for social metrics adapters
 *
 * @module providers/adapters/social/types
 */

/** Social metrics for a crypto asset */
export interface SocialMetric {
  /** Asset symbol */
  symbol: string;
  /** Asset name */
  name: string;
  /** Overall social score (0-100) */
  socialScore: number;
  /** Social volume (number of mentions) */
  socialVolume: number;
  /** Social dominance (% of crypto conversation) */
  socialDominance: number;
  /** Sentiment score (-1 to 1, negative = bearish, positive = bullish) */
  sentiment: number;
  /** Galaxy score (LunarCrush proprietary, 0-100) */
  galaxyScore?: number;
  /** Alt rank (LunarCrush: 1 = highest social activity relative to market cap) */
  altRank?: number;
  /** Number of social contributors */
  contributors?: number;
  /** Reddit activity */
  reddit?: { subscribers: number; activeUsers: number; posts24h: number };
  /** Twitter/X mentions */
  twitterMentions?: number;
  /** Data source */
  source: string;
  /** Data timestamp */
  timestamp: string;
}
