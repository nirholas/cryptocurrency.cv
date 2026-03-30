"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { RiExternalLinkLine } from "@remixicon/react"

import { getProjectWebsiteRelAttribute } from "@/lib/link-utils"

import { ProjectCardButtons } from "./project-card-buttons"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface Category {
  id: string
  name: string
}

interface ProjectCardProps {
  id: string
  slug: string
  name: string
  description: string
  logoUrl: string | null
  upvoteCount: number
  commentCount: number
  launchStatus: string
  launchType?: string | null
  dailyRanking?: number | null
  index?: number
  userHasUpvoted: boolean
  categories: Category[]
  isAuthenticated: boolean
  websiteUrl?: string
  chain?: string | null
  ticker?: string | null
  priceUsd?: number | null
  priceChange24h?: number | null
}

function getChainStyle(chain: string) {
  switch (chain) {
    case "solana":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
    case "base":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
    case "bnb":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
    case "ethereum":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

function formatCardPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  return `$${price.toFixed(8)}`
}

export function ProjectCard({
  id,
  slug,
  name,
  description,
  logoUrl,
  upvoteCount,
  commentCount,
  launchStatus,
  launchType,
  dailyRanking,
  index,
  userHasUpvoted,
  categories,
  isAuthenticated,
  websiteUrl,
  chain,
  ticker,
  priceUsd,
  priceChange24h,
}: ProjectCardProps) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const projectPageUrl = `/projects/${slug}`

  return (
    <div
      className="group border-border/40 hover:bg-accent/50 relative cursor-pointer border-b px-3 py-4 transition-all duration-200 sm:px-5"
      onClick={(e) => {
        e.stopPropagation()
        router.push(projectPageUrl)
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank Number */}
        {typeof index === "number" && (
          <span className="text-muted-foreground/60 hidden w-5 text-right text-sm font-bold tabular-nums sm:block">
            {index + 1}
          </span>
        )}

        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="border-border/60 bg-background relative h-14 w-14 overflow-hidden rounded-xl border shadow-sm transition-shadow group-hover:shadow-md sm:h-16 sm:w-16">
            {logoUrl && !imgError ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 56px, 64px"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-muted-foreground flex h-full w-full items-center justify-center text-xl font-bold">
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={projectPageUrl} onClick={(e) => e.stopPropagation()}>
              <h3 className="group-hover:text-primary line-clamp-1 text-[15px] font-semibold tracking-tight transition-colors sm:text-base">
                {name}
              </h3>
            </Link>
            {ticker && (
              <span className="text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 text-[11px] font-medium">
                ${ticker}
              </span>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel={getProjectWebsiteRelAttribute({ launchStatus, launchType, dailyRanking })}
                className="text-muted-foreground/50 hover:text-primary inline-flex transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={`Visit ${name}`}
              >
                <RiExternalLinkLine className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[13px] leading-relaxed sm:text-sm">
            {stripHtml(description)}
          </p>

          {/* Price & 24h Change */}
          {priceUsd != null && priceUsd > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-foreground text-xs font-semibold tabular-nums">
                {formatCardPrice(priceUsd)}
              </span>
              {priceChange24h != null && (
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    priceChange24h >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {priceChange24h >= 0 ? "+" : ""}
                  {priceChange24h.toFixed(2)}%
                </span>
              )}
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {chain && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getChainStyle(chain)}`}
              >
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </span>
            )}
            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories?category=${cat.id}`}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/80 bg-muted/40 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Upvote & Comment buttons */}
        <ProjectCardButtons
          projectPageUrl={projectPageUrl}
          commentCount={commentCount}
          projectId={id}
          upvoteCount={upvoteCount}
          isAuthenticated={isAuthenticated}
          hasUpvoted={userHasUpvoted}
          launchStatus={launchStatus}
          projectName={name}
        />
      </div>
    </div>
  )
}
