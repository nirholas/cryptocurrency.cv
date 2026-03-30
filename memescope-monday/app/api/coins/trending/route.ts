import { NextResponse } from "next/server"

import { fetchAllTrending, fetchTrendingBySource } from "@/lib/coin-data/trending"

const VALID_SOURCES = ["coingecko", "dexscreener", "pumpfun", "birdeye"] as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source")

    if (source) {
      if (!VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])) {
        return NextResponse.json(
          { error: `Invalid source. Valid: ${VALID_SOURCES.join(", ")}` },
          { status: 400 },
        )
      }
      const data = await fetchTrendingBySource(source as (typeof VALID_SOURCES)[number])
      return NextResponse.json({ data })
    }

    const data = await fetchAllTrending()
    return NextResponse.json({ data })
  } catch (e) {
    console.error("Trending fetch failed:", e)
    return NextResponse.json({ error: "Failed to fetch trending data" }, { status: 500 })
  }
}
