import { RiExternalLinkLine, RiGlobalLine, RiSendPlaneFill, RiTwitterFill } from "@remixicon/react"

import { getChainExplorerUrl, getDexScreenerChartUrl, type CoinDetailData } from "@/lib/coin-data"

interface CoinLinksProps {
  data: CoinDetailData
  tokenAddress: string
  chain: string
}

export function CoinLinksPanel({ data, tokenAddress, chain }: CoinLinksProps) {
  const { pumpfun, dexscreener, coingeckoExtra } = data
  const explorerUrl = getChainExplorerUrl(chain, tokenAddress)
  const chartUrl = dexscreener ? getDexScreenerChartUrl(chain, dexscreener.pairAddress) : null

  const links: { label: string; url: string; icon: React.ReactNode; category?: string }[] = []

  // Charts & Analytics
  if (chartUrl) {
    links.push({
      label: "DexScreener",
      url: chartUrl,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
      category: "charts",
    })
  }

  // GeckoTerminal
  const geckoChain = chain === "base" ? "base" : chain === "bnb" ? "bsc" : "solana"
  links.push({
    label: "GeckoTerminal",
    url: `https://www.geckoterminal.com/${geckoChain}/pools/${dexscreener?.pairAddress || tokenAddress}`,
    icon: <RiExternalLinkLine className="h-4 w-4" />,
    category: "charts",
  })

  if (chain === "solana") {
    links.push({
      label: "Birdeye",
      url: `https://birdeye.so/token/${tokenAddress}?chain=solana`,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
      category: "charts",
    })
  }

  // CoinGecko
  if (coingeckoExtra?.coingeckoId) {
    links.push({
      label: "CoinGecko",
      url: `https://www.coingecko.com/en/coins/${coingeckoExtra.coingeckoId}`,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
      category: "charts",
    })
  }

  // Block Explorer
  links.push({
    label: chain === "solana" ? "Solscan" : chain === "base" ? "BaseScan" : "BscScan",
    url: explorerUrl,
    icon: <RiExternalLinkLine className="h-4 w-4" />,
    category: "explorer",
  })

  // PumpFun
  if (pumpfun) {
    links.push({
      label: "PumpFun",
      url: `https://pump.fun/${tokenAddress}`,
      icon: <RiExternalLinkLine className="h-4 w-4" />,
      category: "dex",
    })
  }

  // Social links - aggregate from all sources, deduplicating
  const addedSocials = new Set<string>()

  // Twitter from PumpFun
  if (pumpfun?.twitter && !addedSocials.has("twitter")) {
    links.push({
      label: "Twitter",
      url: pumpfun.twitter,
      icon: <RiTwitterFill className="h-4 w-4" />,
      category: "social",
    })
    addedSocials.add("twitter")
  }

  // Twitter from DexScreener
  if (dexscreener?.info?.socials) {
    for (const social of dexscreener.info.socials) {
      if (social.type === "twitter" && !addedSocials.has("twitter")) {
        links.push({
          label: "Twitter",
          url: social.url,
          icon: <RiTwitterFill className="h-4 w-4" />,
          category: "social",
        })
        addedSocials.add("twitter")
      }
      if (social.type === "telegram" && !addedSocials.has("telegram")) {
        links.push({
          label: "Telegram",
          url: social.url,
          icon: <RiSendPlaneFill className="h-4 w-4" />,
          category: "social",
        })
        addedSocials.add("telegram")
      }
      if (social.type === "discord" && !addedSocials.has("discord")) {
        links.push({
          label: "Discord",
          url: social.url,
          icon: <RiExternalLinkLine className="h-4 w-4" />,
          category: "social",
        })
        addedSocials.add("discord")
      }
    }
  }

  // Twitter from CoinGecko
  if (coingeckoExtra?.twitterHandle && !addedSocials.has("twitter")) {
    links.push({
      label: "Twitter",
      url: `https://twitter.com/${coingeckoExtra.twitterHandle}`,
      icon: <RiTwitterFill className="h-4 w-4" />,
      category: "social",
    })
    addedSocials.add("twitter")
  }

  // Telegram from CoinGecko
  if (coingeckoExtra?.telegramChannel && !addedSocials.has("telegram")) {
    links.push({
      label: "Telegram",
      url: `https://t.me/${coingeckoExtra.telegramChannel}`,
      icon: <RiSendPlaneFill className="h-4 w-4" />,
      category: "social",
    })
    addedSocials.add("telegram")
  }

  // Website links
  const addedWebsites = new Set<string>()

  if (pumpfun?.website && !addedWebsites.has(pumpfun.website)) {
    links.push({
      label: "Website",
      url: pumpfun.website,
      icon: <RiGlobalLine className="h-4 w-4" />,
      category: "website",
    })
    addedWebsites.add(pumpfun.website)
  }

  if (dexscreener?.info?.websites) {
    for (const site of dexscreener.info.websites) {
      if (!addedWebsites.has(site.url)) {
        links.push({
          label: addedWebsites.size === 0 ? "Website" : "Website 2",
          url: site.url,
          icon: <RiGlobalLine className="h-4 w-4" />,
          category: "website",
        })
        addedWebsites.add(site.url)
      }
    }
  }

  if (coingeckoExtra?.homepage && !addedWebsites.has(coingeckoExtra.homepage)) {
    links.push({
      label: addedWebsites.size === 0 ? "Website" : "Homepage",
      url: coingeckoExtra.homepage,
      icon: <RiGlobalLine className="h-4 w-4" />,
      category: "website",
    })
    addedWebsites.add(coingeckoExtra.homepage)
  }

  // Group links by category for visual separation
  const categories = ["charts", "explorer", "dex", "social", "website"]
  const grouped = categories
    .map((cat) => links.filter((l) => l.category === cat))
    .filter((group) => group.length > 0)

  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Links</h4>
      <div className="space-y-1">
        {grouped.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-border my-1.5 border-t" />}
            {group.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
