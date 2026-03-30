const COINGECKO_API = "https://api.coingecko.com/api/v3"

interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
  market_data?: {
    current_price?: { usd: number }
    market_cap?: { usd: number }
    total_volume?: { usd: number }
    price_change_percentage_24h?: number
    ath?: { usd: number }
    fully_diluted_valuation?: { usd: number }
  }
  image?: { large: string; small: string; thumb: string }
  links?: {
    homepage?: string[]
    twitter_screen_name?: string
    telegram_channel_identifier?: string
  }
}

export async function getCoinGeckoByContract(
  chain: string,
  contractAddress: string,
): Promise<CoinGeckoToken | null> {
  const platformMap: Record<string, string> = {
    solana: "solana",
    base: "base",
    bnb: "binance-smart-chain",
    ethereum: "ethereum",
  }
  const platform = platformMap[chain]
  if (!platform) return null

  try {
    const headers: Record<string, string> = { accept: "application/json" }
    const apiKey = process.env.COINGECKO_API_KEY
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey

    const res = await fetch(
      `${COINGECKO_API}/coins/${platform}/contract/${contractAddress}`,
      { headers, next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error("CoinGecko fetch failed:", e)
    return null
  }
}
