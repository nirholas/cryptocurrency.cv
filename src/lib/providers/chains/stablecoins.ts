/**
 * Stablecoin Provider Chains — Centralized chain exports for stablecoin data
 *
 * Chains:
 * - `stablecoinFlowsChain` — Stablecoin flows from DefiLlama, Glassnode, Artemis, Dune
 *
 * @module providers/chains/stablecoins
 */

export {
  stablecoinFlowsChain,
  createStablecoinFlowsChain,
} from '../adapters/stablecoin-flows';

export type { StablecoinFlow, StablecoinMarketStats } from '../adapters/stablecoin-flows';
