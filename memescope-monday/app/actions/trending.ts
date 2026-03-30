"use server"

import { fetchAllTrending, fetchTrendingBySource } from "@/lib/coin-data/trending"
import type { TrendingData, TrendingSourceResult } from "@/lib/coin-data/trending-types"

export async function getTrendingTokens(): Promise<TrendingData> {
  return fetchAllTrending()
}

export async function getTrendingBySource(
  source: "coingecko" | "dexscreener" | "pumpfun" | "birdeye",
): Promise<TrendingSourceResult> {
  return fetchTrendingBySource(source)
}
