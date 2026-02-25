/**
 * On-Chain Provider Chains — Centralized chain exports for on-chain data
 *
 * Chains:
 * - `onChainChain` — On-chain metrics from Blockchain.info, Etherscan, Mempool.space
 * - `whaleAlertChain` — Whale transaction alerts
 * - `gasChain` — Gas prices from Etherscan, Blocknative, Owlracle
 *
 * @module providers/chains/onchain
 */

export {
  onChainChain,
  whaleAlertChain,
  createOnChainChain,
  createWhaleAlertChain,
} from '../adapters/on-chain';

export {
  gasChain,
  gasConsensusChain,
  createGasChain,
} from '../adapters/gas';

export type { OnChainMetric, WhaleAlert, NetworkStats } from '../adapters/on-chain';
export type { GasPrice } from '../adapters/gas';
