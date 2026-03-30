"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

import { formatMarketCap } from "@/lib/coin-data/enrichment"

import { UpvoteButton } from "@/components/project/upvote-button"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface Category {
  id: string
  name: string
}

interface TrendingProjectCardProps {
  id: string
  slug: string
  name: string
  description: string
  logoUrl: string | null
  upvoteCount: number
  launchStatus: string
  userHasUpvoted: boolean
  categories: Category[]
  isAuthenticated: boolean
  chain?: string | null
  ticker?: string | null
  marketCap?: number | null
  createdAt: Date | string
}

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
      return "Solana"
    case "base":
      return "Base"
    case "bnb":
      return "BNB Chain"
    case "ethereum":
      return "Ethereum"
    default:
      return chain.charAt(0).toUpperCase() + chain.slice(1)
  }
}

function getCategoryStyle(name: string) {
  const lower = name.toLowerCase()
  if (lower === "featured")
    return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
  if (lower === "trending")
    return "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
}

export function TrendingProjectCard({
  id,
  slug,
  name,
  description,
  logoUrl,
  upvoteCount,
  userHasUpvoted,
  categories,
  isAuthenticated,
  chain,
  ticker,
  marketCap,
  createdAt,
}: TrendingProjectCardProps) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const projectPageUrl = `/projects/${slug}`
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const dateStr = format(new Date(createdAt), "MMM d, yyyy")

  return (
    <div
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      onClick={() => router.push(projectPageUrl)}
    >
      {/* Top row: upvote + logo + name/ticker + chain */}
      <div className="flex items-start gap-3">
        {/* Upvote */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <UpvoteButton
            projectId={id}
            initialUpvoted={userHasUpvoted}
            upvoteCount={upvoteCount}
            isAuthenticated={isAuthenticated}
            variant="compact"
          />
        </div>

        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="bg-muted relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700">
            {logoUrl && !imgError ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-muted-foreground text-base font-bold">{initials}</span>
            )}
          </div>
        </div>

        {/* Name + ticker */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={projectPageUrl}
              onClick={(e) => e.stopPropagation()}
              className="group-hover:text-primary text-[15px] font-bold tracking-tight transition-colors"
            >
              {name}
            </Link>
          </div>
          {ticker && (
            <span className="text-muted-foreground text-xs font-medium">${ticker}</span>
          )}
        </div>

        {/* Chain badge */}
        {chain && (
          <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${getChainDot(chain)}`} />
            <span className="font-medium">{getChainLabel(chain)}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
        {stripHtml(description)}
      </p>

      {/* Tags + date */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              href={`/categories?category=${cat.id}`}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 ${getCategoryStyle(cat.name)}`}
              onClick={(e) => e.stopPropagation()}
            >
              {cat.name}
            </Link>
          ))}
        </div>
        <span className="text-muted-foreground flex-shrink-0 text-xs">{dateStr}</span>
      </div>

      {/* Market cap */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-zinc-800">
        <span className="text-muted-foreground text-xs">Market Cap</span>
        <span className="text-primary text-sm font-semibold">{formatMarketCap(marketCap)}</span>
      </div>
    </div>
  )
}
