import { getCoinGeckoByContract } from "./coingecko"
import { getDexScreenerTopPair } from "./dexscreener"
import { getHeliusAsset, getHeliusTokenHolders } from "./helius"
import { getPumpFunCoin } from "./pumpfun"
import type { CoinEnrichmentResult } from "./types"

/**
 * Enrich coin data from multiple sources.
 * Tries PumpFun first (for Solana memecoins), then DexScreener, Helius, CoinGecko.
 * Each source fills in gaps left by previous sources.
 */
export async function enrichCoinData(
  contractAddress: string,
  chain: string = "solana",
): Promise<CoinEnrichmentResult> {
  const result: CoinEnrichmentResult = { chain }

  // Run all API calls in parallel
  const [pumpfun, dexPair, helius, coingecko, holders] = await Promise.allSettled([
    chain === "solana" ? getPumpFunCoin(contractAddress) : Promise.resolve(null),
    getDexScreenerTopPair(contractAddress),
    chain === "solana" ? getHeliusAsset(contractAddress) : Promise.resolve(null),
    getCoinGeckoByContract(chain, contractAddress),
    chain === "solana" ? getHeliusTokenHolders(contractAddress) : Promise.resolve(null),
  ])

  // PumpFun data (best for Solana memecoins)
  const pf = pumpfun.status === "fulfilled" ? pumpfun.value : null
  if (pf) {
    result.pumpfunData = pf
    result.name = pf.name
    result.ticker = pf.symbol
    result.marketCap = pf.usd_market_cap
    result.athMarketCap = pf.ath_market_cap
    result.totalSupply = String(pf.total_supply)
    result.description = pf.description
    result.logoUrl = pf.image_uri
    result.bannerUrl = pf.banner_uri
    result.websiteUrl = pf.website
    result.twitterUrl = pf.twitter
  }

  // DexScreener data (works for all chains)
  const dex = dexPair.status === "fulfilled" ? dexPair.value : null
  if (dex) {
    result.dexscreenerData = dex
    result.priceUsd = parseFloat(dex.priceUsd) || undefined
    result.volume24h = dex.volume?.h24 || undefined
    result.priceChange24h = dex.priceChange?.h24 || undefined
    result.liquidity = dex.liquidity?.usd || undefined
    if (!result.marketCap) result.marketCap = dex.marketCap || dex.fdv
    if (!result.ticker) result.ticker = dex.baseToken?.symbol
    if (!result.name) result.name = dex.baseToken?.name
    if (!result.logoUrl && dex.info?.imageUrl) result.logoUrl = dex.info.imageUrl
    if (!result.websiteUrl && dex.info?.websites?.[0]) result.websiteUrl = dex.info.websites[0].url
    if (!result.twitterUrl) {
      const twitter = dex.info?.socials?.find((s) => s.type === "twitter")
      if (twitter) result.twitterUrl = twitter.url
    }
    if (!result.telegramUrl) {
      const tg = dex.info?.socials?.find((s) => s.type === "telegram")
      if (tg) result.telegramUrl = tg.url
    }
  }

  // Helius data (Solana only - token metadata)
  const hel = helius.status === "fulfilled" ? helius.value : null
  if (hel) {
    result.heliusData = hel
    if (!result.ticker) result.ticker = hel.content?.metadata?.symbol
    if (!result.name) result.name = hel.content?.metadata?.name
    if (!result.description) result.description = hel.content?.metadata?.description
    if (!result.logoUrl) result.logoUrl = hel.content?.links?.image || hel.content?.files?.[0]?.uri
    if (hel.token_info?.price_info?.price_per_token) {
      result.priceUsd = hel.token_info.price_info.price_per_token
    }
  }

  // Helius holders count
  const hCount = holders.status === "fulfilled" ? holders.value : null
  if (hCount) result.holders = hCount

  // CoinGecko data (fills remaining gaps)
  const cg = coingecko.status === "fulfilled" ? coingecko.value : null
  if (cg) {
    if (!result.marketCap && cg.market_data?.market_cap?.usd)
      result.marketCap = cg.market_data.market_cap.usd
    if (!result.volume24h && cg.market_data?.total_volume?.usd)
      result.volume24h = cg.market_data.total_volume.usd
    if (!result.priceUsd && cg.market_data?.current_price?.usd)
      result.priceUsd = cg.market_data.current_price.usd
    if (!result.priceChange24h && cg.market_data?.price_change_percentage_24h)
      result.priceChange24h = cg.market_data.price_change_percentage_24h
    if (!result.athMarketCap && cg.market_data?.ath?.usd)
      result.athMarketCap = cg.market_data.ath.usd
    if (!result.logoUrl && cg.image?.large) result.logoUrl = cg.image.large
    if (!result.twitterUrl && cg.links?.twitter_screen_name)
      result.twitterUrl = `https://twitter.com/${cg.links.twitter_screen_name}`
    if (!result.telegramUrl && cg.links?.telegram_channel_identifier)
      result.telegramUrl = `https://t.me/${cg.links.telegram_channel_identifier}`
  }

  return result
}

/** Format large numbers for display */
export function formatMarketCap(value: number | null | undefined): string {
  if (!value) return "N/A"
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

export function formatPrice(value: number | null | undefined): string {
  if (!value) return "N/A"
  if (value < 0.00001) return `$${value.toExponential(2)}`
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

export function formatPercentChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}
