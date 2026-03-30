"use client"

import type { CoinDetailData } from "@/lib/coin-data"
import { cn } from "@/lib/utils"

interface SocialBuzzProps {
  data: CoinDetailData
  upvoteCount: number
}

type BuzzLevel = "Dead" | "Low" | "Medium" | "High" | "Viral"

function calculateBuzz(
  data: CoinDetailData,
  upvoteCount: number,
): { level: BuzzLevel; score: number } {
  let score = 0
  const { dexscreener, pumpfun } = data

  // Trading volume signals
  if (dexscreener?.volume) {
    if (dexscreener.volume.h24 >= 1_000_000) score += 30
    else if (dexscreener.volume.h24 >= 100_000) score += 20
    else if (dexscreener.volume.h24 >= 10_000) score += 10
  }

  // Transaction count signals
  if (dexscreener?.txns) {
    const total = dexscreener.txns.h24.buys + dexscreener.txns.h24.sells
    if (total >= 1000) score += 25
    else if (total >= 500) score += 15
    else if (total >= 100) score += 10
    else if (total >= 20) score += 5
  }

  // PumpFun replies
  if (pumpfun?.replyCount) {
    if (pumpfun.replyCount >= 100) score += 20
    else if (pumpfun.replyCount >= 50) score += 15
    else if (pumpfun.replyCount >= 10) score += 10
    else if (pumpfun.replyCount > 0) score += 5
  }

  // Community upvotes
  if (upvoteCount >= 50) score += 15
  else if (upvoteCount >= 20) score += 10
  else if (upvoteCount >= 5) score += 5

  // Social links presence
  const hasTwitter = !!(
    pumpfun?.twitter || dexscreener?.info?.socials?.some((s) => s.type === "twitter")
  )
  const hasWebsite = !!(pumpfun?.website || dexscreener?.info?.websites?.length)
  if (hasTwitter) score += 5
  if (hasWebsite) score += 5

  score = Math.min(score, 100)

  let level: BuzzLevel
  if (score >= 80) level = "Viral"
  else if (score >= 50) level = "High"
  else if (score >= 30) level = "Medium"
  else if (score >= 10) level = "Low"
  else level = "Dead"

  return { level, score }
}

function getBuzzStyle(level: BuzzLevel) {
  switch (level) {
    case "Viral":
      return {
        emoji: "🔥",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-300",
        bar: "bg-orange-500",
      }
    case "High":
      return {
        emoji: "🚀",
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-300",
        bar: "bg-green-500",
      }
    case "Medium":
      return {
        emoji: "📈",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        bar: "bg-blue-500",
      }
    case "Low":
      return {
        emoji: "😴",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-300",
        bar: "bg-yellow-500",
      }
    case "Dead":
      return {
        emoji: "💀",
        bg: "bg-gray-100 dark:bg-gray-800/50",
        text: "text-gray-600 dark:text-gray-400",
        bar: "bg-gray-400",
      }
  }
}

export function SocialBuzz({ data, upvoteCount }: SocialBuzzProps) {
  const { level, score } = calculateBuzz(data, upvoteCount)
  const style = getBuzzStyle(level)

  return (
    <div className={cn("rounded-lg p-3", style.bg)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Social Buzz
        </span>
        <div className="flex items-center gap-1.5">
          <span>{style.emoji}</span>
          <span className={cn("text-sm font-bold", style.text)}>{level}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all", style.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
