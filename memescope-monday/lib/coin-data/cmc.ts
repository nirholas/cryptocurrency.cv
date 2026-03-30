const CMC_API = "https://pro-api.coinmarketcap.com/v2"

interface CMCQuote {
  price: number
  volume_24h: number
  percent_change_24h: number
  market_cap: number
  fully_diluted_market_cap: number
}

interface CMCToken {
  id: number
  name: string
  symbol: string
  slug: string
  platform?: { token_address: string }
  quote?: { USD: CMCQuote }
}

export async function getCMCByContract(contractAddress: string): Promise<CMCToken | null> {
  const apiKey = process.env.CMC_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `${CMC_API}/cryptocurrency/info?address=${contractAddress}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    const tokens = data.data ? Object.values(data.data) : []
    return (tokens[0] as CMCToken) || null
  } catch (e) {
    console.error("CMC fetch failed:", e)
    return null
  }
}
