import type { TrendingSourceResult, TrendingToken } from "./trending-types"

/**
 * DexScreener Token Boosts API
 * Returns the most-boosted tokens across all chains.
 * No API key required.
 */

interface DexScreenerBoostToken {
  url: string
  chainId: string
  tokenAddress: string
  icon?: string
  header?: string
  description?: string
  links?: { type: string; label: string; url: string }[]
  amount: number
  totalAmount: number
}

export async function getDexScreenerTrending(): Promise<TrendingSourceResult> {
  const now = new Date().toISOString()
  try {
    const res = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
      next: { revalidate: 120 },
    })

    if (!res.ok) {
      return { source: "dexscreener", tokens: [], error: `HTTP ${res.status}`, fetchedAt: now }
    }

    const data: DexScreenerBoostToken[] = await res.json()

    // Collect unique tokens (dedupe by address), take top 10
    const seen = new Set<string>()
    const uniqueTokens: DexScreenerBoostToken[] = []
    for (const token of data) {
      const key = `${token.chainId}:${token.tokenAddress}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueTokens.push(token)
      }
      if (uniqueTokens.length >= 10) break
    }

    // Fetch pair data for these tokens in parallel for market data
    const pairResults = await Promise.allSettled(
      uniqueTokens.map((t) =>
        fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.tokenAddress}`, {
          next: { revalidate: 120 },
        }).then((r) => (r.ok ? r.json() : null)),
      ),
    )

    const chainMap: Record<string, string> = {
      solana: "solana",
      ethereum: "ethereum",
      bsc: "bnb",
      base: "base",
      arbitrum: "arbitrum",
      polygon: "polygon",
      avalanche: "avalanche",
    }

    const tokens: TrendingToken[] = uniqueTokens.map((token, index) => {
      const pairData = pairResults[index].status === "fulfilled" ? pairResults[index].value : null
      const topPair = pairData?.pairs?.[0]

      return {
        name: topPair?.baseToken?.name || token.description || "Unknown",
        symbol: topPair?.baseToken?.symbol || "???",
        contractAddress: token.tokenAddress,
        chain: chainMap[token.chainId] || token.chainId,
        marketCap: topPair?.marketCap || topPair?.fdv || undefined,
        priceUsd: topPair ? parseFloat(topPair.priceUsd) || undefined : undefined,
        priceChange24h: topPair?.priceChange?.h24 ?? undefined,
        volume24h: topPair?.volume?.h24 ?? undefined,
        liquidity: topPair?.liquidity?.usd ?? undefined,
        logoUrl: token.icon || topPair?.info?.imageUrl || undefined,
        source: "dexscreener" as const,
        rank: index + 1,
        sourceUrl: token.url
          ? `https://dexscreener.com${token.url}`
          : `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`,
      }
    })

    return { source: "dexscreener", tokens, fetchedAt: now }
  } catch (e) {
    console.error("DexScreener trending fetch failed:", e)
    return { source: "dexscreener", tokens: [], error: String(e), fetchedAt: now }
  }
}
