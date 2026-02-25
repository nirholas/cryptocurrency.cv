/**
 * NFT & Gaming Provider Chains — Centralized chain exports
 *
 * Chains:
 * - `nftMarketChain` — NFT data from OpenSea, Reservoir, SimpleHash
 * - `gamingDataChain` — Gaming data from DappRadar, PlayToEarn, Footprint
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
export type { GamingOverview, GameData } from '../adapters/gaming-data';
