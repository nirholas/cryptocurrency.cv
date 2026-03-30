import type { PumpFunCoin } from "./types"

const PUMPFUN_API = "https://frontend-api-v3.pump.fun"

export async function getPumpFunCoin(mint: string): Promise<PumpFunCoin | null> {
  try {
    const res = await fetch(`${PUMPFUN_API}/coins/${mint}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error("PumpFun fetch failed:", e)
    return null
  }
}

export async function searchPumpFunCoins(query: string, limit = 10): Promise<PumpFunCoin[]> {
  try {
    const res = await fetch(
      `${PUMPFUN_API}/coins?search=${encodeURIComponent(query)}&limit=${limit}&sort=market_cap&order=desc`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error("PumpFun search failed:", e)
    return []
  }
}
