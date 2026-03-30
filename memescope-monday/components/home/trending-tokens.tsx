"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { formatMarketCap } from "@/lib/coin-data/enrichment"
import type {
  TrendingData,
  TrendingSourceResult,
  TrendingToken,
} from "@/lib/coin-data/trending-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SOURCE_META = {
  coingecko: { label: "CoinGecko", emoji: "🦎" },
  dexscreener: { label: "DEX", emoji: "🌐" },
  pumpfun: { label: "Pump", emoji: "💊" },
  birdeye: { label: "Birdeye", emoji: "🦅" },
} as const

const RANK_EMOJI = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

function getChainDot(chain: string) {
  switch (chain) {
    case "solana":
      return "bg-green-400"
    case "base":
      return "bg-blue-500"
    case "bnb":
      return "bg-yellow-400"
    case "ethereum":
      return "bg-indigo-400"
    default:
      return "bg-gray-400"
  }
}

function getChainLabel(chain: string) {
  switch (chain) {
    case "solana":
      return "SOL"
    case "base":
      return "Base"
    case "bnb":
      return "BNB"
    case "ethereum":
      return "ETH"
    case "multi":
      return ""
    default:
      return chain
  }
}

function formatAge(createdAt?: string): string | null {
  if (!createdAt) return null
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function TokenRow({ token }: { token: TrendingToken }) {
  const [imgError, setImgError] = useState(false)
  const age = formatAge(token.createdAt)
  const chain = getChainLabel(token.chain)

  return (
    <a
      href={token.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
    >
      {/* Rank */}
      <span className="w-6 text-center text-sm">{RANK_EMOJI[token.rank - 1] ?? token.rank}</span>

      {/* Logo */}
      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
        {token.logoUrl && !imgError ? (
          <Image
            src={token.logoUrl}
            alt={token.symbol}
            width={32}
            height={32}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold">
            {token.symbol.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Name + chain */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{token.symbol}</span>
          {chain && (
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${getChainDot(token.chain)}`}
              />
              <span className="text-muted-foreground text-[10px]">{chain}</span>
            </span>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">{token.name}</p>
      </div>

      {/* Market cap */}
      <div className="text-right">
        <div className="text-sm font-medium">
          {token.marketCap ? formatMarketCap(token.marketCap) : "—"}
        </div>
        <div className="flex items-center justify-end gap-1.5">
          {token.priceChange24h !== undefined && (
            <span
              className={`text-xs font-medium ${
                token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {token.priceChange24h >= 0 ? "+" : ""}
              {token.priceChange24h.toFixed(1)}%
            </span>
          )}
          {age && <span className="text-muted-foreground text-[10px]">⋅ {age}</span>}
        </div>
      </div>
    </a>
  )
}

function SourcePanel({ result }: { result: TrendingSourceResult }) {
  if (result.error && result.tokens.length === 0) {
    return (
      <div className="text-muted-foreground border-border rounded-lg border border-dashed py-8 text-center text-sm">
        {result.error.includes("not configured")
          ? "API key not configured"
          : "Failed to load trending tokens"}
      </div>
    )
  }

  if (result.tokens.length === 0) {
    return (
      <div className="text-muted-foreground border-border rounded-lg border border-dashed py-8 text-center text-sm">
        No trending tokens found
      </div>
    )
  }

  return (
    <div className="divide-border divide-y">
      {result.tokens.map((token, i) => (
        <TokenRow
          key={`${token.source}-${token.contractAddress || token.symbol}-${i}`}
          token={token}
        />
      ))}
    </div>
  )
}

function TrendingTokensSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="bg-muted h-5 w-6 animate-pulse rounded" />
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-3 w-32 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

interface TrendingTokensProps {
  initialData?: TrendingData | null
}

export function TrendingTokens({ initialData }: TrendingTokensProps) {
  const [data, setData] = useState<TrendingData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) return

    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/coins/trending")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json.data)
      } catch (e) {
        console.error("Failed to load trending tokens:", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [initialData])

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="flex items-center gap-2 text-base font-semibold">🔥 Trending Tokens</h3>
        <p className="text-muted-foreground text-xs">
          Live from CoinGecko, DexScreener, Pump.fun & Birdeye
        </p>
      </div>

      {loading ? (
        <div className="p-4">
          <TrendingTokensSkeleton />
        </div>
      ) : !data ? (
        <div className="text-muted-foreground p-8 text-center text-sm">
          Failed to load trending data
        </div>
      ) : (
        <Tabs defaultValue="dexscreener" className="w-full">
          <div className="border-b border-gray-200 px-4 dark:border-zinc-800">
            <TabsList className="h-auto gap-0 bg-transparent p-0">
              {(Object.keys(SOURCE_META) as Array<keyof typeof SOURCE_META>).map((key) => {
                const meta = SOURCE_META[key]
                const count = data[key]?.tokens?.length ?? 0
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium transition-colors"
                  >
                    <span className="mr-1">{meta.emoji}</span>
                    {meta.label}
                    {count > 0 && (
                      <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {(Object.keys(SOURCE_META) as Array<keyof typeof SOURCE_META>).map((key) => (
            <TabsContent key={key} value={key} className="mt-0 p-2">
              <SourcePanel result={data[key]} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
