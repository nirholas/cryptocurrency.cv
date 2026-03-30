"use client"

import type { CoinDetailData } from "@/lib/coin-data"
import { cn } from "@/lib/utils"

interface SafetyScoreProps {
  data: CoinDetailData
  upvoteCount: number
}

interface ScoreCriteria {
  label: string
  score: number
  maxScore: number
  description: string
}

function calculateSafetyScore(
  data: CoinDetailData,
  upvoteCount: number,
): { total: number; grade: string; criteria: ScoreCriteria[] } {
  const criteria: ScoreCriteria[] = []
  const { market, dexscreener, pumpfun } = data

  // 1. Liquidity (0-100)
  let liquidityScore = 0
  if (market.liquidity !== null) {
    if (market.liquidity >= 100_000) liquidityScore = 100
    else if (market.liquidity >= 50_000) liquidityScore = 80
    else if (market.liquidity >= 10_000) liquidityScore = 60
    else if (market.liquidity >= 1_000) liquidityScore = 40
    else if (market.liquidity > 0) liquidityScore = 20
  }
  criteria.push({
    label: "Liquidity",
    score: liquidityScore,
    maxScore: 100,
    description:
      market.liquidity !== null
        ? `$${market.liquidity.toLocaleString()} liquidity`
        : "No on-chain data available",
  })

  // 2. Trading Activity (0-100)
  let tradingScore = 0
  if (dexscreener?.txns) {
    const total24h = dexscreener.txns.h24.buys + dexscreener.txns.h24.sells
    if (total24h >= 1000) tradingScore = 100
    else if (total24h >= 500) tradingScore = 80
    else if (total24h >= 100) tradingScore = 60
    else if (total24h >= 20) tradingScore = 40
    else if (total24h > 0) tradingScore = 20
  }
  criteria.push({
    label: "Trading Activity",
    score: tradingScore,
    maxScore: 100,
    description: dexscreener?.txns
      ? `${(dexscreener.txns.h24.buys + dexscreener.txns.h24.sells).toLocaleString()} txns (24h)`
      : "No trading data",
  })

  // 3. Buy/Sell Ratio (0-100)
  let ratioScore = 50
  if (dexscreener?.txns) {
    const buys = dexscreener.txns.h24.buys
    const sells = dexscreener.txns.h24.sells
    const total = buys + sells
    if (total > 0) {
      const buyRatio = buys / total
      if (buyRatio >= 0.6) ratioScore = 80
      else if (buyRatio >= 0.45) ratioScore = 60
      else if (buyRatio >= 0.3) ratioScore = 40
      else ratioScore = 20
    }
  }
  criteria.push({
    label: "Buy/Sell Ratio",
    score: ratioScore,
    maxScore: 100,
    description: dexscreener?.txns
      ? `${dexscreener.txns.h24.buys}B / ${dexscreener.txns.h24.sells}S (24h)`
      : "No data",
  })

  // 4. Social Presence (0-100)
  let socialScore = 0
  const hasWebsite = !!(pumpfun?.website || dexscreener?.info?.websites?.length)
  const hasTwitter = !!(
    pumpfun?.twitter || dexscreener?.info?.socials?.some((s) => s.type === "twitter")
  )
  if (hasWebsite) socialScore += 40
  if (hasTwitter) socialScore += 40
  if (pumpfun?.replyCount && pumpfun.replyCount > 10) socialScore += 20
  socialScore = Math.min(socialScore, 100)
  criteria.push({
    label: "Social Presence",
    score: socialScore,
    maxScore: 100,
    description:
      !hasWebsite && !hasTwitter
        ? "No social links provided"
        : [hasWebsite && "Website", hasTwitter && "Twitter"].filter(Boolean).join(", "),
  })

  // 5. Pair Age (0-100)
  let ageScore = 50
  if (pumpfun?.createdTimestamp) {
    const ageMs = Date.now() - pumpfun.createdTimestamp
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays >= 30) ageScore = 100
    else if (ageDays >= 14) ageScore = 80
    else if (ageDays >= 7) ageScore = 60
    else if (ageDays >= 1) ageScore = 40
    else ageScore = 20
  }
  criteria.push({
    label: "Pair Age",
    score: ageScore,
    maxScore: 100,
    description: pumpfun?.createdTimestamp
      ? `Created ${new Date(pumpfun.createdTimestamp).toLocaleDateString()}`
      : "Unknown age",
  })

  // 6. Community Votes (0-100)
  let voteScore = 0
  if (upvoteCount >= 50) voteScore = 100
  else if (upvoteCount >= 20) voteScore = 80
  else if (upvoteCount >= 10) voteScore = 60
  else if (upvoteCount >= 5) voteScore = 40
  else if (upvoteCount >= 1) voteScore = 20
  criteria.push({
    label: "Community Votes",
    score: voteScore,
    maxScore: 100,
    description: `${upvoteCount} upvotes`,
  })

  const total = Math.round(criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length)

  let grade: string
  if (total >= 80) grade = "A"
  else if (total >= 60) grade = "B"
  else if (total >= 40) grade = "C"
  else if (total >= 20) grade = "D"
  else grade = "F"

  return { total, grade, criteria }
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "text-green-600 dark:text-green-400"
    case "B":
      return "text-blue-600 dark:text-blue-400"
    case "C":
      return "text-yellow-600 dark:text-yellow-400"
    case "D":
      return "text-orange-600 dark:text-orange-400"
    case "F":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-muted-foreground"
  }
}

function getScoreIcon(score: number) {
  if (score >= 60) return { icon: "✓", color: "text-green-600 dark:text-green-400" }
  if (score >= 40) return { icon: "⚠", color: "text-yellow-600 dark:text-yellow-400" }
  return { icon: "✗", color: "text-red-600 dark:text-red-400" }
}

function getScoreBarColor(score: number) {
  if (score >= 60) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export function SafetyScore({ data, upvoteCount }: SafetyScoreProps) {
  const { total, grade, criteria } = calculateSafetyScore(data, upvoteCount)

  return (
    <div className="space-y-4">
      {/* Header with grade */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Safety Score</h3>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold", getGradeColor(grade))}>{grade}</span>
          <span className="text-muted-foreground text-sm">{total}/100</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", getScoreBarColor(total))}
          style={{ width: `${total}%` }}
        />
      </div>

      {/* Criteria breakdown */}
      <div className="space-y-3">
        {criteria.map((c) => {
          const { icon, color } = getScoreIcon(c.score)
          return (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", color)}>{icon}</span>
                  <span className="text-sm font-medium">{c.label}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {c.score}/{c.maxScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full transition-all", getScoreBarColor(c.score))}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">{c.description}</p>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-muted-foreground text-[10px] leading-tight">
        Safety scores are algorithmic estimates based on on-chain data, liquidity, and social
        signals. Not financial advice.
      </p>
    </div>
  )
}
