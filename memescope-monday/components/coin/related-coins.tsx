"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface RelatedCoin {
  id: string
  name: string
  slug: string
  ticker: string | null
  logoUrl: string | null
  chain: string | null
  upvoteCount: number
}

interface RelatedCoinsProps {
  coins: RelatedCoin[]
}

function getChainIcon(chain: string | null) {
  switch (chain) {
    case "solana":
      return "◎"
    case "base":
      return "🔵"
    case "bnb":
      return "🟡"
    case "ethereum":
      return "⟠"
    default:
      return "●"
  }
}

function CoinLogo({ src, name }: { src: string | null; name: string }) {
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <span className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-sm font-bold">
        {name.charAt(0)}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={36}
      height={36}
      className="h-full w-full object-cover"
      unoptimized
      onError={() => setImgError(true)}
    />
  )
}

export function RelatedCoins({ coins }: RelatedCoinsProps) {
  if (coins.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Related Coins</h3>
      <div className="space-y-2">
        {coins.map((coin) => (
          <Link
            key={coin.id}
            href={`/projects/${coin.slug}`}
            className="border-border/60 hover:bg-muted/40 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
          >
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md">
              <CoinLogo src={coin.logoUrl} name={coin.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{coin.name}</p>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                {coin.ticker && <span>${coin.ticker}</span>}
                <span>·</span>
                <span>{coin.upvoteCount} votes</span>
              </div>
            </div>
            {coin.chain && (
              <span className="text-muted-foreground text-xs">{getChainIcon(coin.chain)}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
