// Multi-source coin detail aggregation
// Used by the coin detail page to show market data, links, news

export interface CoinMarketData {
  price: number | null
  priceNative: string | null
  priceChange1h: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  priceChange14d: number | null
  priceChange30d: number | null
  high24h: number | null
  low24h: number | null
  marketCap: number | null
  marketCapRank: number | null
  marketCapChange24h: number | null
  marketCapChangePercent24h: number | null
  volume24h: number | null
  liquidity: number | null
  liquidityBase: number | null
  liquidityQuote: number | null
  fdv: number | null
  ath: number | null
  athDate: string | null
  atl: number | null
  atlDate: string | null
  holders: number | null
  totalSupply: number | null
  circulatingSupply: number | null
  watchlistUsers: number | null
  sentimentUp: number | null
  sentimentDown: number | null
}

export interface PumpFunData {
  mint: string
  name: string
  symbol: string
  description: string
  imageUri: string
  bannerUri: string | null
  twitter: string | null
  website: string | null
  creator: string
  createdTimestamp: number
  marketCap: number
  usdMarketCap: number
  athMarketCap: number
  athMarketCapTimestamp: number
  replyCount: number
  complete: boolean
  bondingCurve: string
  poolAddress: string | null
  program: string
  nsfw: boolean
}

export interface CoinNews {
  title: string
  url: string
  source: string
  publishedAt: string
  sentiment: string | null
}

export interface HeliusTokenMeta {
  name: string
  symbol: string
  uri: string
  image: string | null
  description: string | null
}

export interface DexInfo {
  dexName: string
  pairAddress: string
  pairUrl: string
  baseToken: { name: string; symbol: string; address: string }
  quoteToken: { name: string; symbol: string; address: string }
  pairCreatedAt: string | null
}

export interface CoinGeckoExtra {
  imageUrl: string | null
  description: string | null
  categories: string[]
  genesisDate: string | null
  coingeckoId: string | null
  homepage: string | null
  twitterHandle: string | null
  telegramChannel: string | null
}

export interface CoinDetailData {
  pumpfun: PumpFunData | null
  dexscreener: import("./types").DexScreenerPair | null
  dexInfo: DexInfo | null
  coingeckoExtra: CoinGeckoExtra | null
  market: CoinMarketData
  news: CoinNews[]
  heliusMeta: HeliusTokenMeta | null
}

// ── PumpFun ──
async function fetchPumpFunData(mintAddress: string): Promise<PumpFunData | null> {
  try {
    const res = await fetch(`https://frontend-api-v3.pump.fun/coins/${mintAddress}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.mint) return null
    return {
      mint: data.mint,
      name: data.name,
      symbol: data.symbol,
      description: data.description || "",
      imageUri: data.image_uri || "",
      bannerUri: data.banner_uri || null,
      twitter: data.twitter || null,
      website: data.website || null,
      creator: data.creator,
      createdTimestamp: data.created_timestamp,
      marketCap: data.market_cap,
      usdMarketCap: data.usd_market_cap,
      athMarketCap: data.ath_market_cap,
      athMarketCapTimestamp: data.ath_market_cap_timestamp,
      replyCount: data.reply_count,
      complete: data.complete,
      bondingCurve: data.bonding_curve,
      poolAddress: data.pool_address || data.pump_swap_pool || null,
      program: data.program,
      nsfw: data.nsfw,
    }
  } catch {
    return null
  }
}

// ── DexScreener ──
async function fetchDexScreenerData(
  tokenAddress: string,
): Promise<import("./types").DexScreenerPair | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.pairs || data.pairs.length === 0) return null
    const sorted = data.pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
    )
    return sorted[0]
  } catch {
    return null
  }
}

// ── CoinGecko (free tier) ──
interface CoinGeckoResult {
  market: Partial<CoinMarketData>
  extra: CoinGeckoExtra
}

async function fetchCoinGeckoData(
  tokenAddress: string,
  chain: string = "solana",
): Promise<CoinGeckoResult | null> {
  const apiKey = process.env.COINGECKO_API_KEY
  try {
    const platform = chain === "base" ? "base" : chain === "bnb" ? "binance-smart-chain" : "solana"
    const headers: Record<string, string> = {}
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platform}/contract/${tokenAddress}`,
      { headers, next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const md = data.market_data
    return {
      market: {
        price: md?.current_price?.usd ?? null,
        priceChange1h: md?.price_change_percentage_1h_in_currency?.usd ?? null,
        priceChange24h: md?.price_change_percentage_24h ?? null,
        priceChange7d: md?.price_change_percentage_7d ?? null,
        priceChange14d: md?.price_change_percentage_14d ?? null,
        priceChange30d: md?.price_change_percentage_30d ?? null,
        high24h: md?.high_24h?.usd ?? null,
        low24h: md?.low_24h?.usd ?? null,
        marketCap: md?.market_cap?.usd ?? null,
        marketCapRank: data.market_cap_rank ?? null,
        marketCapChange24h: md?.market_cap_change_24h ?? null,
        marketCapChangePercent24h: md?.market_cap_change_percentage_24h ?? null,
        volume24h: md?.total_volume?.usd ?? null,
        liquidity: null,
        fdv: md?.fully_diluted_valuation?.usd ?? null,
        ath: md?.ath?.usd ?? null,
        athDate: md?.ath_date?.usd ?? null,
        atl: md?.atl?.usd ?? null,
        atlDate: md?.atl_date?.usd ?? null,
        holders: null,
        totalSupply: md?.total_supply ?? null,
        circulatingSupply: md?.circulating_supply ?? null,
        watchlistUsers: data.watchlist_portfolio_users ?? null,
        sentimentUp: data.sentiment_votes_up_percentage ?? null,
        sentimentDown: data.sentiment_votes_down_percentage ?? null,
      },
      extra: {
        imageUrl: data.image?.large ?? null,
        description: data.description?.en ?? null,
        categories: (data.categories ?? []).filter(Boolean),
        genesisDate: data.genesis_date ?? null,
        coingeckoId: data.id ?? null,
        homepage: data.links?.homepage?.[0] || null,
        twitterHandle: data.links?.twitter_screen_name || null,
        telegramChannel: data.links?.telegram_channel_identifier || null,
      },
    }
  } catch {
    return null
  }
}

// ── CryptoPanic News ──
async function fetchCryptoNews(symbol: string): Promise<CoinNews[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(
      `https://cryptopanic.com/api/free/v1/posts/?auth_token=${apiKey}&currencies=${symbol}&kind=news&public=true`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).slice(0, 5).map((item: Record<string, unknown>) => ({
      title: item.title as string,
      url: item.url as string,
      source: (item.source as Record<string, string>)?.title || "Unknown",
      publishedAt: item.published_at as string,
      sentiment:
        (item.votes as Record<string, number>)?.positive >
        (item.votes as Record<string, number>)?.negative
          ? "positive"
          : (item.votes as Record<string, number>)?.negative >
              (item.votes as Record<string, number>)?.positive
            ? "negative"
            : "neutral",
    }))
  } catch {
    return []
  }
}

// ── Helius Token Metadata ──
async function fetchHeliusMetadata(mintAddress: string): Promise<HeliusTokenMeta | null> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
        includeOffChain: true,
      }),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const token = data[0]
    if (!token) return null
    const offChain = token.offChainMetadata?.metadata
    const onChain = token.onChainMetadata?.metadata?.data
    return {
      name: offChain?.name || onChain?.name || "",
      symbol: offChain?.symbol || onChain?.symbol || "",
      uri: onChain?.uri || "",
      image: offChain?.image || null,
      description: offChain?.description || null,
    }
  } catch {
    return null
  }
}

// ── Helius Token Holder Count ──
async function fetchHeliusHolderCount(mintAddress: string): Promise<number | null> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-holders",
        method: "getTokenAccounts",
        params: { mint: mintAddress, limit: 1, page: 1 },
      }),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.total || null
  } catch {
    return null
  }
}

// ── Aggregate all data for a coin ──
export async function fetchCoinDetail(
  tokenAddress: string,
  chain: string = "solana",
  symbol?: string,
): Promise<CoinDetailData> {
  const isSolana = chain === "solana"

  const [pumpfun, dexscreener, coingecko, news, helius, holderCount] = await Promise.all([
    isSolana ? fetchPumpFunData(tokenAddress) : Promise.resolve(null),
    fetchDexScreenerData(tokenAddress),
    fetchCoinGeckoData(tokenAddress, chain),
    symbol ? fetchCryptoNews(symbol) : Promise.resolve([]),
    isSolana ? fetchHeliusMetadata(tokenAddress) : Promise.resolve(null),
    isSolana ? fetchHeliusHolderCount(tokenAddress) : Promise.resolve(null),
  ])

  // Extract DexScreener pair info
  const dexInfo: DexInfo | null = dexscreener
    ? {
        dexName: dexscreener.dexId,
        pairAddress: dexscreener.pairAddress,
        pairUrl: dexscreener.url,
        baseToken: {
          name: dexscreener.baseToken.name,
          symbol: dexscreener.baseToken.symbol,
          address: dexscreener.baseToken.address,
        },
        quoteToken: {
          name: dexscreener.quoteToken.name,
          symbol: dexscreener.quoteToken.symbol,
          address: dexscreener.quoteToken.address,
        },
        pairCreatedAt: (dexscreener as unknown as Record<string, unknown>).pairCreatedAt
          ? String((dexscreener as unknown as Record<string, unknown>).pairCreatedAt)
          : null,
      }
    : null

  const cgMarket = coingecko?.market
  const market: CoinMarketData = {
    price: dexscreener ? parseFloat(dexscreener.priceUsd) : (cgMarket?.price ?? null),
    priceNative: dexscreener?.priceNative ?? null,
    priceChange1h: dexscreener?.priceChange?.h1 ?? cgMarket?.priceChange1h ?? null,
    priceChange24h: dexscreener?.priceChange?.h24 ?? cgMarket?.priceChange24h ?? null,
    priceChange7d: cgMarket?.priceChange7d ?? null,
    priceChange14d: cgMarket?.priceChange14d ?? null,
    priceChange30d: cgMarket?.priceChange30d ?? null,
    high24h: cgMarket?.high24h ?? null,
    low24h: cgMarket?.low24h ?? null,
    marketCap: dexscreener?.marketCap ?? pumpfun?.usdMarketCap ?? cgMarket?.marketCap ?? null,
    marketCapRank: cgMarket?.marketCapRank ?? null,
    marketCapChange24h: cgMarket?.marketCapChange24h ?? null,
    marketCapChangePercent24h: cgMarket?.marketCapChangePercent24h ?? null,
    volume24h: dexscreener?.volume?.h24 ?? cgMarket?.volume24h ?? null,
    liquidity: dexscreener?.liquidity?.usd ?? null,
    liquidityBase: dexscreener?.liquidity?.base ?? null,
    liquidityQuote: dexscreener?.liquidity?.quote ?? null,
    fdv: dexscreener?.fdv ?? cgMarket?.fdv ?? null,
    ath: pumpfun?.athMarketCap ?? cgMarket?.ath ?? null,
    athDate: pumpfun?.athMarketCapTimestamp
      ? new Date(pumpfun.athMarketCapTimestamp).toISOString()
      : (cgMarket?.athDate ?? null),
    atl: cgMarket?.atl ?? null,
    atlDate: cgMarket?.atlDate ?? null,
    holders: holderCount ?? cgMarket?.holders ?? null,
    totalSupply: cgMarket?.totalSupply ?? null,
    circulatingSupply: cgMarket?.circulatingSupply ?? null,
    watchlistUsers: cgMarket?.watchlistUsers ?? null,
    sentimentUp: cgMarket?.sentimentUp ?? null,
    sentimentDown: cgMarket?.sentimentDown ?? null,
  }

  return {
    pumpfun,
    dexscreener,
    dexInfo,
    coingeckoExtra: coingecko?.extra ?? null,
    market,
    news,
    heliusMeta: helius,
  }
}

// ── Formatting helpers ──
export function formatUSD(value: number | null): string {
  if (value === null) return "N/A"
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(8)}`
}

export function formatNumber(value: number | null): string {
  if (value === null) return "N/A"
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toLocaleString()
}

export function formatPercent(value: number | null): string {
  if (value === null) return "N/A"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function getChainExplorerUrl(chain: string, address: string): string {
  switch (chain) {
    case "solana":
      return `https://solscan.io/token/${address}`
    case "base":
      return `https://basescan.org/token/${address}`
    case "bnb":
      return `https://bscscan.com/token/${address}`
    default:
      return `https://solscan.io/token/${address}`
  }
}

export function getDexScreenerChartUrl(chain: string, pairAddress: string): string {
  const chainId = chain === "base" ? "base" : chain === "bnb" ? "bsc" : "solana"
  return `https://dexscreener.com/${chainId}/${pairAddress}`
}
