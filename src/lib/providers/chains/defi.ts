/**
 * DeFi Provider Chains — Centralized chain exports for DeFi data
 *
 * Chains:
 * - `defiTvlChain` — TVL from DefiLlama + L2Beat
 * - `defiYieldsChain` — Yields from DefiLlama + Aave + Lido
 * - `tvlChain` — Dedicated TVL chain (DefiLlama primary)
 * - `defiYieldsStandaloneChain` — Standalone yields (DefiLlama)
 *
 * @module providers/chains/defi
 */

export {
  defiTvlChain,
  defiYieldsChain,
  createDefiTvlChain,
  createDefiYieldsChain,
} from '../adapters/defi';

export {
  tvlChain,
  createTVLChain,
} from '../adapters/tvl';

export {
  defiYieldsChain as defiYieldsStandaloneChain,
  createDefiYieldsChain as createDefiYieldsStandaloneChain,
} from '../adapters/defi-yields';

export type { ProtocolTvl, YieldPool } from '../adapters/defi';
