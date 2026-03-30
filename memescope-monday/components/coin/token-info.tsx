"use client"

import { useState } from "react"

import { RiArrowDownSLine, RiInformationLine } from "@remixicon/react"

import type { CoinDetailData } from "@/lib/coin-data"
import { cn } from "@/lib/utils"

interface TokenInfoProps {
  data: CoinDetailData
  chain: string
}

export function TokenInfo({ data }: TokenInfoProps) {
  const [showFullDesc, setShowFullDesc] = useState(false)
  const { pumpfun, heliusMeta, coingeckoExtra } = data

  // Pick the best available description
  const description =
    coingeckoExtra?.description || pumpfun?.description || heliusMeta?.description || null

  // Strip HTML tags for CoinGecko descriptions
  const cleanDescription = description?.replace(/<[^>]*>/g, "").trim() || null

  const categories = coingeckoExtra?.categories ?? []
  const genesisDate = coingeckoExtra?.genesisDate
  const coingeckoId = coingeckoExtra?.coingeckoId

  const hasContent = cleanDescription || heliusMeta || categories.length > 0 || genesisDate

  if (!hasContent) return null

  const isLongDescription = (cleanDescription?.length ?? 0) > 200

  return (
    <div className="space-y-4">
      <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        Token Info
      </h4>

      {/* Helius on-chain metadata */}
      {heliusMeta && (
        <div className="bg-muted/30 space-y-2 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <RiInformationLine className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs">On-chain Metadata (Helius)</span>
          </div>
          <div className="space-y-1 text-sm">
            {heliusMeta.name && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{heliusMeta.name}</span>
              </div>
            )}
            {heliusMeta.symbol && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Symbol</span>
                <span className="text-foreground font-medium">{heliusMeta.symbol}</span>
              </div>
            )}
            {heliusMeta.uri && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Metadata URI</span>
                <a
                  href={heliusMeta.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary max-w-[180px] truncate text-sm hover:underline"
                >
                  View JSON
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {cleanDescription && (
        <div className="space-y-2">
          <div
            className={cn(
              "text-muted-foreground text-sm leading-relaxed",
              !showFullDesc && isLongDescription && "line-clamp-3",
            )}
          >
            {cleanDescription}
          </div>
          {isLongDescription && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
            >
              {showFullDesc ? "Show less" : "Read more"}
              <RiArrowDownSLine
                className={cn("h-3.5 w-3.5 transition-transform", showFullDesc && "rotate-180")}
              />
            </button>
          )}
        </div>
      )}

      {/* CoinGecko Categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <span className="text-muted-foreground text-xs">CoinGecko Categories</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 8).map((cat) => (
              <span
                key={cat}
                className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extra details */}
      <div className="space-y-1.5 text-sm">
        {genesisDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Genesis Date</span>
            <span className="text-foreground font-medium">
              {new Date(genesisDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {coingeckoId && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CoinGecko</span>
            <a
              href={`https://www.coingecko.com/en/coins/${coingeckoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              View on CoinGecko
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
