import type { TrendingSourceResult, TrendingToken } from "./trending-types"
import type { PumpFunCoin } from "./types"

/**
 * Pump.fun trending tokens
 * Fetches top tokens sorted by market cap from the Pump.fun API.
 * No API key required.
 */

const PUMPFUN_API = "https://frontend-api-v3.pump.fun"

export async function getPumpFunTrending(): Promise<TrendingSourceResult> {
  const now = new Date().toISOString()
  try {
    const res = await fetch(
      `${PUMPFUN_API}/coins?sort=market_cap&order=desc&limit=10&includeNsfw=false`,
      { next: { revalidate: 120 } },
    )

    if (!res.ok) {
      return { source: "pumpfun", tokens: [], error: `HTTP ${res.status}`, fetchedAt: now }
    }

    const data: PumpFunCoin[] = await res.json()

    const tokens: TrendingToken[] = data.map((coin, index) => ({
      name: coin.name,
      symbol: coin.symbol,
      contractAddress: coin.mint,
      chain: "solana",
      marketCap: coin.usd_market_cap || coin.market_cap,
      logoUrl: coin.image_uri,
      createdAt: coin.created_timestamp
        ? new Date(coin.created_timestamp * 1000).toISOString()
        : undefined,
      source: "pumpfun" as const,
      rank: index + 1,
      sourceUrl: `https://pump.fun/coin/${coin.mint}`,
    }))

    return { source: "pumpfun", tokens, fetchedAt: now }
  } catch (e) {
    console.error("PumpFun trending fetch failed:", e)
    return { source: "pumpfun", tokens: [], error: String(e), fetchedAt: now }
  }
}
