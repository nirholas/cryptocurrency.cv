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
 * NFT & Gaming Provider Chains — Centralized chain exports
 *
 * Chains:
 * - `nftMarketChain` — NFT data from OpenSea, Reservoir, SimpleHash
 * - `gamingDataChain` — Gaming data from Footprint (keyed) and DefiLlama
 *
 * @module providers/chains/nft-gaming
 */

export {
  nftMarketChain,
  nftMarketConsensusChain,
  createNFTMarketChain,
} from '../adapters/nft-market';

export {
  gamingDataChain,
  gamingDataConsensusChain,
  createGamingDataChain,
} from '../adapters/gaming-data';

export type { NFTMarketOverview, NFTCollectionSummary } from '../adapters/nft-market';
export type { GamingOverview, GameData, GamingRanking } from '../adapters/gaming-data';
