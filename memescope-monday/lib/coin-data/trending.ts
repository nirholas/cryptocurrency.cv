import { getBirdeyeTrending } from "./trending-birdeye"
import { getCoinGeckoTrending } from "./trending-coingecko"
import { getDexScreenerTrending } from "./trending-dexscreener"
import { getPumpFunTrending } from "./trending-pumpfun"
import type { TrendingData, TrendingSourceResult } from "./trending-types"

/**
 * Fetch trending tokens from all sources in parallel.
 * Each source is independent — failures in one don't affect others.
 */
export async function fetchAllTrending(): Promise<TrendingData> {
  const [coingecko, dexscreener, pumpfun, birdeye] = await Promise.allSettled([
    getCoinGeckoTrending(),
    getDexScreenerTrending(),
    getPumpFunTrending(),
    getBirdeyeTrending(),
  ])

  const now = new Date().toISOString()

  const fallback = (source: TrendingSourceResult["source"]): TrendingSourceResult => ({
    source,
    tokens: [],
    error: "Fetch failed",
    fetchedAt: now,
  })

  return {
    coingecko: coingecko.status === "fulfilled" ? coingecko.value : fallback("coingecko"),
    dexscreener: dexscreener.status === "fulfilled" ? dexscreener.value : fallback("dexscreener"),
    pumpfun: pumpfun.status === "fulfilled" ? pumpfun.value : fallback("pumpfun"),
    birdeye: birdeye.status === "fulfilled" ? birdeye.value : fallback("birdeye"),
    fetchedAt: now,
  }
}

/**
 * Fetch trending tokens from a single source.
 */
export async function fetchTrendingBySource(
  source: "coingecko" | "dexscreener" | "pumpfun" | "birdeye",
): Promise<TrendingSourceResult> {
  switch (source) {
    case "coingecko":
      return getCoinGeckoTrending()
    case "dexscreener":
      return getDexScreenerTrending()
    case "pumpfun":
      return getPumpFunTrending()
    case "birdeye":
      return getBirdeyeTrending()
  }
}
