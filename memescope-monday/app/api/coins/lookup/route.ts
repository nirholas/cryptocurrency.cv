import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const chain = searchParams.get("chain") || "solana"

  if (!address || address.length < 10) {
    return NextResponse.json({ error: "Valid contract address required" }, { status: 400 })
  }

  const result: Record<string, unknown> = {}

  // Fetch from multiple sources in parallel
  const [pumpfunData, dexscreenerData, heliusData] = await Promise.allSettled([
    // PumpFun (Solana only)
    chain === "solana"
      ? fetch(`https://frontend-api-v3.pump.fun/coins/${address}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null),

    // DexScreener (all chains)
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),

    // Helius (Solana only)
    chain === "solana" && process.env.HELIUS_API_KEY
      ? fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mintAccounts: [address], includeOffChain: true }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null),
  ])

  // Extract PumpFun data
  const pf = pumpfunData.status === "fulfilled" ? pumpfunData.value : null
  if (pf?.mint) {
    result.name = pf.name
    result.ticker = pf.symbol
    result.description = pf.description || ""
    result.logoUrl = pf.image_uri || ""
    result.websiteUrl = pf.website || ""
    result.twitterUrl = pf.twitter ? `https://x.com/${pf.twitter}` : ""
    result.telegramUrl = pf.telegram || ""
    result.pumpfunUrl = `https://pump.fun/coin/${pf.mint}`
    result.source = "pumpfun"
  }

  // Extract DexScreener data
  const ds = dexscreenerData.status === "fulfilled" ? dexscreenerData.value : null
  if (ds?.pairs?.length > 0) {
    // Pick the pair with most liquidity
    const pair = ds.pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
    )[0]

    const baseToken = pair.baseToken
    if (!result.name && baseToken?.name) result.name = baseToken.name
    if (!result.ticker && baseToken?.symbol) result.ticker = baseToken.symbol

    // DexScreener info (websites, socials)
    if (pair.info) {
      if (!result.websiteUrl && pair.info.websites?.length > 0) {
        result.websiteUrl = pair.info.websites[0].url
      }
      if (!result.twitterUrl && pair.info.socials?.length > 0) {
        const twitter = pair.info.socials.find((s: { type: string }) => s.type === "twitter")
        if (twitter) result.twitterUrl = twitter.url
      }
      if (!result.telegramUrl && pair.info.socials?.length > 0) {
        const telegram = pair.info.socials.find((s: { type: string }) => s.type === "telegram")
        if (telegram) result.telegramUrl = telegram.url
      }
      if (pair.info.imageUrl && !result.logoUrl) {
        result.logoUrl = pair.info.imageUrl
      }
    }

    result.dexscreenerUrl = pair.url || `https://dexscreener.com/${chain}/${address}`
    result.source = result.source || "dexscreener"
  }

  // Extract Helius metadata
  const hl = heliusData.status === "fulfilled" ? heliusData.value : null
  if (hl && Array.isArray(hl) && hl.length > 0) {
    const meta = hl[0]
    const onchain = meta?.onChainMetadata?.metadata?.data
    const offchain = meta?.offChainMetadata?.metadata

    if (!result.name && onchain?.name) result.name = onchain.name
    if (!result.ticker && onchain?.symbol) result.ticker = onchain.symbol
    if (!result.description && offchain?.description) result.description = offchain.description
    if (!result.logoUrl && offchain?.image) result.logoUrl = offchain.image
    result.source = result.source || "helius"
  }

  if (!result.name && !result.ticker) {
    return NextResponse.json({ error: "Token not found", result: {} }, { status: 404 })
  }

  return NextResponse.json({ result })
}
