import type { HeliusAsset } from "./types"

export async function getHeliusAsset(mint: string): Promise<HeliusAsset | null> {
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-asset",
        method: "getAsset",
        params: { id: mint },
      }),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result || null
  } catch (e) {
    console.error("Helius fetch failed:", e)
    return null
  }
}

export async function getHeliusTokenHolders(mint: string): Promise<number | null> {
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
        params: { mint, limit: 1, page: 1 },
      }),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.total || null
  } catch (e) {
    console.error("Helius holders fetch failed:", e)
    return null
  }
}
