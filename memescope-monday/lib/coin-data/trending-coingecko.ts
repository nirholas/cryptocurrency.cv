import type { TrendingSourceResult, TrendingToken } from "./trending-types"

const COINGECKO_API = "https://api.coingecko.com/api/v3"

interface CoinGeckoTrendingItem {
  item: {
    id: string
    coin_id: number
    name: string
    symbol: string
    market_cap_rank: number | null
    thumb: string
    small: string
    large: string
    slug: string
    score: number
    data?: {
      price?: number
      price_change_percentage_24h?: Record<string, number>
      market_cap?: string
      total_volume?: string
    }
  }
}

interface CoinGeckoTrendingResponse {
  coins: CoinGeckoTrendingItem[]
}

export async function getCoinGeckoTrending(): Promise<TrendingSourceResult> {
  const now = new Date().toISOString()
  try {
    const headers: Record<string, string> = { accept: "application/json" }
    const apiKey = process.env.COINGECKO_API_KEY
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey

    const res = await fetch(`${COINGECKO_API}/search/trending`, {
      headers,
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return { source: "coingecko", tokens: [], error: `HTTP ${res.status}`, fetchedAt: now }
    }

    const data: CoinGeckoTrendingResponse = await res.json()
    const tokens: TrendingToken[] = (data.coins || []).slice(0, 10).map((coin, index) => {
      const item = coin.item
      const priceChange = item.data?.price_change_percentage_24h?.usd ?? undefined

      // Parse market cap string like "$1.2M" or "$500K"
      let marketCap: number | undefined
      if (item.data?.market_cap) {
        const mcStr = item.data.market_cap.replace(/[,$]/g, "")
        const parsed = parseFloat(mcStr)
        if (!isNaN(parsed)) marketCap = parsed
      }

      return {
        name: item.name,
        symbol: item.symbol.toUpperCase(),
        chain: "multi",
        marketCap,
        priceUsd: item.data?.price ?? undefined,
        priceChange24h: priceChange,
        logoUrl: item.large || item.small || item.thumb,
        source: "coingecko" as const,
        rank: index + 1,
        sourceUrl: `https://www.coingecko.com/en/coins/${item.slug || item.id}`,
      }
    })

    return { source: "coingecko", tokens, fetchedAt: now }
  } catch (e) {
    console.error("CoinGecko trending fetch failed:", e)
    return { source: "coingecko", tokens: [], error: String(e), fetchedAt: now }
  }
}
