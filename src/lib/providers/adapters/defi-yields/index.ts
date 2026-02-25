/**
 * DeFi Yields Chain — Standalone yield data provider chain
 *
 * This re-exports from the main defi chain for backward compatibility.
 * Use `defiYieldsChain` from `@/lib/providers/adapters/defi` for the
 * canonical import.
 *
 * @module providers/adapters/defi-yields
 */

export {
  defiYieldsChain,
  createDefiYieldsChain,
  type DefiYieldsChainOptions,
} from '../defi';

export type { YieldPool } from '../defi/types';
