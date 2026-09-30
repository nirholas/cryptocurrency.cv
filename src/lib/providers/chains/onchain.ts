/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * On-Chain Provider Chains — Centralized chain exports for on-chain data
 *
 * Chains:
 * - `onChainChain` — On-chain metrics from Blockchain.info, Etherscan, Mempool.space
 * - `whaleAlertChain` — Whale transaction alerts
 * - `gasChain`: Gas prices from Etherscan, eth_feeHistory, Owlracle
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
