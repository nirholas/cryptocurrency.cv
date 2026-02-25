/**
 * Blockchain Gaming Data Types
 * @module providers/adapters/gaming-data/types
 */

export interface GameData {
  name: string;
  slug: string;
  chain: string;
  dau: number;              // daily active users
  transactions24h: number;
  volume24h: number;        // USD
  category: string;         // 'game' | 'metaverse' | 'gambling'
  balance: number;          // smart contract balance USD
  timestamp: string;
}

export interface GamingOverview {
  totalDau: number;
  totalVolume24h: number;
  topGames: GameData[];
  byChain: Record<string, number>;
  timestamp: string;
}
