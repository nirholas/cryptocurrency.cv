/** Unified trending token from any source */
export interface TrendingToken {
  /** Token name */
  name: string
  /** Token symbol/ticker */
  symbol: string
  /** Contract address (if available) */
  contractAddress?: string
  /** Chain identifier */
  chain: string
  /** Market cap in USD */
  marketCap?: number
  /** Price in USD */
  priceUsd?: number
  /** 24h price change percentage */
  priceChange24h?: number
  /** 24h volume */
  volume24h?: number
  /** Liquidity in USD */
  liquidity?: number
  /** Token logo URL */
  logoUrl?: string
  /** Time the token was created/launched */
  createdAt?: string
  /** Data source */
  source: "coingecko" | "dexscreener" | "pumpfun" | "birdeye"
  /** Rank within the source's trending list */
  rank: number
  /** Link to the token on the source platform */
  sourceUrl?: string
}

/** Result from a single trending source */
export interface TrendingSourceResult {
  source: TrendingToken["source"]
  tokens: TrendingToken[]
  error?: string
  fetchedAt: string
}

/** Combined trending data from all sources */
export interface TrendingData {
  coingecko: TrendingSourceResult
  dexscreener: TrendingSourceResult
  pumpfun: TrendingSourceResult
  birdeye: TrendingSourceResult
  fetchedAt: string
}
