export interface PumpFunCoin {
  mint: string
  name: string
  symbol: string
  description: string
  image_uri: string
  metadata_uri: string
  twitter: string
  website: string
  creator: string
  created_timestamp: number
  complete: boolean
  market_cap: number
  usd_market_cap: number
  ath_market_cap: number
  ath_market_cap_timestamp: number
  total_supply: number
  reply_count: number
  last_trade_timestamp: number
  king_of_the_hill_timestamp: number
  nsfw: boolean
  is_banned: boolean
  banner_uri: string
  pump_swap_pool: string
  pool_address: string
  program: string
  bonding_curve: string
  associated_bonding_curve: string
  virtual_sol_reserves: number
  virtual_token_reserves: number
  real_sol_reserves: number
  real_token_reserves: number
  inverted: boolean
  show_name: boolean
  is_currently_live: boolean
  updated_at: number
}

export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    h24: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    m5: { buys: number; sells: number }
  }
  volume: { h24: number; h6: number; h1: number; m5: number }
  priceChange: { h24: number; h6: number; h1: number; m5: number }
  liquidity: { usd: number; base: number; quote: number }
  fdv: number
  marketCap: number
  info?: {
    imageUrl?: string
    websites?: { url: string }[]
    socials?: { type: string; url: string }[]
  }
}

export interface HeliusAsset {
  id: string
  content: {
    metadata: {
      name: string
      symbol: string
      description: string
    }
    links?: {
      image?: string
    }
    files?: { uri: string; mime: string }[]
  }
  token_info?: {
    supply: number
    decimals: number
    price_info?: {
      price_per_token: number
      total_price: number
    }
  }
  authorities?: { address: string }[]
}

export interface CoinEnrichmentResult {
  name?: string
  ticker?: string
  chain?: string
  marketCap?: number
  athMarketCap?: number
  volume24h?: number
  priceUsd?: number
  priceChange24h?: number
  holders?: number
  liquidity?: number
  totalSupply?: string
  logoUrl?: string
  bannerUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  telegramUrl?: string
  description?: string
  pumpfunData?: PumpFunCoin
  dexscreenerData?: DexScreenerPair
  heliusData?: HeliusAsset
}
