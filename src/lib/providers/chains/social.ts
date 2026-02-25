/**
 * Social Provider Chains — Centralized chain exports for social/sentiment data
 *
 * Chains:
 * - `socialChain` — Social metrics from LunarCrush, Santiment, CryptoPanic, Farcaster
 * - `fearGreedChain` — Fear & Greed Index from Alternative.me, CoinStats, Composite
 *
 * @module providers/chains/social
 */

export {
  socialChain,
  socialConsensusChain,
  createSocialChain,
} from '../adapters/social';

export {
  fearGreedChain,
  fearGreedConsensusChain,
  createFearGreedChain,
} from '../adapters/fear-greed';

export type { SocialMetric } from '../adapters/social';
export type { FearGreedIndex } from '../adapters/fear-greed';
