import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { and, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm"

import { enrichCoinData } from "@/lib/coin-data"

const API_KEY = process.env.CRON_API_KEY
const BATCH_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const providedKey = authHeader?.replace("Bearer ", "")

    if (!API_KEY || providedKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const staleThreshold = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

    // Find projects that need enrichment:
    // 1. Have a contract address
    // 2. Either never been enriched, or enriched more than 1 hour ago
    // 3. Prioritize projects with empty/placeholder logos
    const projectsToEnrich = await db
      .select({
        id: project.id,
        name: project.name,
        contractAddress: project.contractAddress,
        chain: project.chain,
        logoUrl: project.logoUrl,
        lastEnrichedAt: project.lastEnrichedAt,
      })
      .from(project)
      .where(
        and(
          isNotNull(project.contractAddress),
          or(
            // Never enriched
            isNull(project.lastEnrichedAt),
            // Stale enrichment
            lt(project.lastEnrichedAt, staleThreshold),
          ),
        ),
      )
      .orderBy(
        // Prioritize coins with missing/empty logos
        sql`CASE WHEN ${project.logoUrl} = '' OR ${project.logoUrl} LIKE '%placehold%' THEN 0 ELSE 1 END`,
        // Then by least recently enriched
        sql`${project.lastEnrichedAt} ASC NULLS FIRST`,
      )
      .limit(BATCH_SIZE)

    let enriched = 0
    let logosUpdated = 0
    let marketDataUpdated = 0

    for (const proj of projectsToEnrich) {
      if (!proj.contractAddress) continue

      try {
        const data = await enrichCoinData(proj.contractAddress, proj.chain ?? "solana")

        const updates: Record<string, unknown> = {
          lastEnrichedAt: now,
          updatedAt: now,
        }

        // Update logoUrl if currently empty/placeholder and enrichment found one
        const needsLogo =
          !proj.logoUrl || proj.logoUrl === "" || proj.logoUrl.includes("placehold")
        if (needsLogo && data.logoUrl) {
          updates.logoUrl = data.logoUrl
          logosUpdated++
        }

        // Update market data
        if (data.priceUsd !== undefined) updates.priceUsd = data.priceUsd
        if (data.marketCap !== undefined) updates.marketCap = data.marketCap
        if (data.priceChange24h !== undefined) updates.priceChange24h = data.priceChange24h
        if (data.volume24h !== undefined) updates.volume24h = data.volume24h
        if (data.liquidity !== undefined) updates.liquidity = data.liquidity
        if (data.holders !== undefined) updates.holders = data.holders
        if (data.athMarketCap !== undefined) updates.athMarketCap = data.athMarketCap
        if (data.totalSupply !== undefined) updates.totalSupply = data.totalSupply

        const hasMarketData =
          data.priceUsd !== undefined ||
          data.marketCap !== undefined ||
          data.priceChange24h !== undefined
        if (hasMarketData) marketDataUpdated++

        await db.update(project).set(updates).where(eq(project.id, proj.id))

        enriched++
      } catch (e) {
        console.error(`Failed to enrich ${proj.name} (${proj.contractAddress}):`, e)
      }
    }

    console.log(
      `[${now.toISOString()}] Coin enrichment completed: ${enriched}/${projectsToEnrich.length} enriched, ${logosUpdated} logos updated, ${marketDataUpdated} market data updated`,
    )

    return NextResponse.json({
      message: "Coin enrichment completed",
      details: {
        processed: projectsToEnrich.length,
        enriched,
        logosUpdated,
        marketDataUpdated,
      },
    })
  } catch (error) {
    console.error("Error enriching coins:", error)
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 })
  }
}
