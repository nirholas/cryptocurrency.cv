import type { TrendingSourceResult, TrendingToken } from "./trending-types"

/**
 * Birdeye trending tokens
 * Requires BIRDEYE_API_KEY env variable.
 * Returns trending Solana tokens by default.
 */

const BIRDEYE_API = "https://public-api.birdeye.so"

interface BirdeyeTrendingToken {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  liquidity?: number
  price?: number
  priceChange24hPercent?: number
  volume24hUSD?: number
  mc?: number
  v24hChangePercent?: number
  rank?: number
}

interface BirdeyeTrendingResponse {
  data: {
    tokens: BirdeyeTrendingToken[]
  }
  success: boolean
}

export async function getBirdeyeTrending(chain: string = "solana"): Promise<TrendingSourceResult> {
  const now = new Date().toISOString()
  const apiKey = process.env.BIRDEYE_API_KEY
  if (!apiKey) {
    return {
      source: "birdeye",
      tokens: [],
      error: "BIRDEYE_API_KEY not configured",
      fetchedAt: now,
    }
  }

  try {
    const res = await fetch(
      `${BIRDEYE_API}/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=10`,
      {
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": chain,
          accept: "application/json",
        },
        next: { revalidate: 120 },
      },
    )

    if (!res.ok) {
      return { source: "birdeye", tokens: [], error: `HTTP ${res.status}`, fetchedAt: now }
    }

    const data: BirdeyeTrendingResponse = await res.json()
    if (!data.success || !data.data?.tokens) {
      return { source: "birdeye", tokens: [], error: "Invalid response", fetchedAt: now }
    }

    const tokens: TrendingToken[] = data.data.tokens.slice(0, 10).map((token, index) => ({
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.address,
      chain,
      marketCap: token.mc || undefined,
      priceUsd: token.price || undefined,
      priceChange24h: token.priceChange24hPercent ?? token.v24hChangePercent ?? undefined,
      volume24h: token.volume24hUSD || undefined,
      liquidity: token.liquidity || undefined,
      logoUrl: token.logoURI || undefined,
      source: "birdeye" as const,
      rank: index + 1,
      sourceUrl: `https://birdeye.so/token/${token.address}?chain=${chain}`,
    }))

    return { source: "birdeye", tokens, fetchedAt: now }
  } catch (e) {
    console.error("Birdeye trending fetch failed:", e)
    return { source: "birdeye", tokens: [], error: String(e), fetchedAt: now }
  }
}
