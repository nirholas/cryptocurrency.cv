import type { DexScreenerPair } from "./types"

const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex"

export async function getDexScreenerPairs(contractAddress: string): Promise<DexScreenerPair[]> {
  try {
    const res = await fetch(`${DEXSCREENER_API}/tokens/${contractAddress}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.pairs || []
  } catch (e) {
    console.error("DexScreener fetch failed:", e)
    return []
  }
}

export async function getDexScreenerTopPair(
  contractAddress: string,
): Promise<DexScreenerPair | null> {
  const pairs = await getDexScreenerPairs(contractAddress)
  if (!pairs.length) return null
  // Return highest liquidity pair
  return pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
}

export function getDexScreenerEmbedUrl(chain: string, contractAddress: string): string {
  const chainMap: Record<string, string> = {
    solana: "solana",
    base: "base",
    bnb: "bsc",
    ethereum: "ethereum",
  }
  return `https://dexscreener.com/${chainMap[chain] || "solana"}/${contractAddress}?embed=1&theme=dark&info=0&trades=0`
}

export function getGeckoTerminalEmbedUrl(chain: string, contractAddress: string): string {
  const chainMap: Record<string, string> = {
    solana: "solana",
    base: "base",
    bnb: "bsc",
    ethereum: "eth",
  }
  return `https://www.geckoterminal.com/${chainMap[chain] || "solana"}/pools/${contractAddress}?embed=1&info=0&swaps=0`
}

export function getDexScreenerPageUrl(chain: string, contractAddress: string): string {
  const chainMap: Record<string, string> = {
    solana: "solana",
    base: "base",
    bnb: "bsc",
    ethereum: "ethereum",
  }
  return `https://dexscreener.com/${chainMap[chain] || "solana"}/${contractAddress}`
}
