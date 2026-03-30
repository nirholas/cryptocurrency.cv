import "dotenv/config"

import { db } from "../drizzle/db"
import { category, project, projectToCategory } from "../drizzle/db/schema"

const now = new Date()

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

// ── Categories ──────────────────────────────────────────────────────────────

const categories = [
  { id: crypto.randomUUID(), name: "Meme" },
  { id: crypto.randomUUID(), name: "Dog" },
  { id: crypto.randomUUID(), name: "Cat" },
  { id: crypto.randomUUID(), name: "AI" },
  { id: crypto.randomUUID(), name: "Gaming" },
  { id: crypto.randomUUID(), name: "DeFi" },
  { id: crypto.randomUUID(), name: "Culture" },
  { id: crypto.randomUUID(), name: "Celebrity" },
  { id: crypto.randomUUID(), name: "Political" },
  { id: crypto.randomUUID(), name: "Other" },
] as const

const catByName = Object.fromEntries(categories.map((c) => [c.name, c.id]))

// ── Real PumpFun Coins ──────────────────────────────────────────────────────

const coins = [
  {
    id: crypto.randomUUID(),
    name: "OFFICIAL TRUMP",
    slug: "official-trump",
    ticker: "TRUMP",
    chain: "solana",
    contractAddress: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    description: "The official memecoin of Donald J. Trump.",
    websiteUrl: "https://gettrumpmemes.com",
    logoUrl: "https://cdn.dexscreener.com/cms/images/85a2613c51c8ded8e51b1b3910487ab66691cb60fecec7d0905481a603bba899?width=800&height=800&quality=95&format=auto",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 1,
    trending: true,
    paidTrending: false,
    categoryNames: ["Political", "Celebrity"],
  },
  {
    id: crypto.randomUUID(),
    name: "Pump.fun",
    slug: "pump-fun",
    ticker: "PUMP",
    chain: "solana",
    contractAddress: "6Jc7JsWnjLMvpwJ1yaRacH75v91LnAjhpLkJ8FdQ35i7",
    description: "The official token of Pump.fun — the launchpad for memecoins on Solana.",
    websiteUrl: "https://pump.fun",
    logoUrl: "https://pump.fun/icon.png",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 2,
    trending: true,
    paidTrending: false,
    categoryNames: ["DeFi"],
  },
  {
    id: crypto.randomUUID(),
    name: "TROLL",
    slug: "troll",
    ticker: "TROLL",
    chain: "solana",
    contractAddress: "5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2",
    description: "The original troll token. Community-driven meme coin on Solana.",
    websiteUrl: "https://trololol.io",
    logoUrl: "https://cdn.dexscreener.com/cms/images/97b02493a3a6aa5c7433cfa8ccd4732e6d73b9ebe70cfe43f0c258c4de83593c?width=800&height=800&quality=95&format=auto",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 3,
    trending: true,
    paidTrending: false,
    categoryNames: ["Meme", "Culture"],
  },
  {
    id: crypto.randomUUID(),
    name: "NEET",
    slug: "neet",
    ticker: "NEET",
    chain: "solana",
    contractAddress: "Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3pump",
    description: "NEET supremacy. Not In Employment, Education, or Training.",
    websiteUrl: "https://neetcoin.xyz/",
    logoUrl: "https://ipfs.io/ipfs/QmXVKWN3i56vyh4Xot9sTb3XsCu92ihypcArFJLujuwzoS",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 4,
    trending: true,
    paidTrending: false,
    categoryNames: ["Meme", "Culture"],
  },
  {
    id: crypto.randomUUID(),
    name: "Tokabu",
    slug: "tokabu",
    ticker: "Tokabu",
    chain: "solana",
    contractAddress: "H8xQ6poBjB9DTPMDTKWzWPrnxu4bDEhybxiouF8Ppump",
    description: "I'm Tokabu, the spirit of gambling.",
    websiteUrl: "https://x.com/TokabuTheSpirit",
    logoUrl: "https://ipfs.io/ipfs/bafkreicrdi3icewusvj5ff53uwnlzng53dmkk3llrmdbn35eb2ozamnhpq",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 5,
    trending: false,
    paidTrending: false,
    categoryNames: ["Meme", "Gaming"],
  },
  {
    id: crypto.randomUUID(),
    name: "Golden Celestial Ratio",
    slug: "gcr",
    ticker: "GCR",
    chain: "solana",
    contractAddress: "7dGbPgUxKpB5qWiLRKcTQSC3om1fPzUpgGAFfwej9hXx",
    description: "GCR — Golden Celestial Ratio. The meme that transcends.",
    websiteUrl: "https://pump.fun",
    logoUrl: "https://cdn.dexscreener.com/cms/images/c7c6583e038f6155421eaa28f062d806fe3c0c3787806c71b8948115c0eaa475?width=800&height=800&quality=95&format=auto",
    launchStatus: "ongoing",
    launchType: "free",
    featuredOnHomepage: true,
    coinType: "existing",
    dailyRanking: 6,
    trending: false,
    paidTrending: false,
    categoryNames: ["Meme"],
  },
]

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database with real PumpFun coins...")

  // 1. Clear existing data (respecting FK order)
  console.log("  Clearing existing data...")
  await db.delete(projectToCategory)
  await db.delete(project)
  await db.delete(category)

  // 2. Insert categories
  console.log("  Inserting categories...")
  await db.insert(category).values(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: now,
      updatedAt: now,
    })),
  )

  // 3. Insert projects
  console.log("  Inserting projects...")
  await db.insert(project).values(
    coins.map(({ categoryNames, ...coin }) => ({
      ...coin,
      pricing: "free",
      createdAt: now,
      updatedAt: now,
    })),
  )

  // 4. Insert project-to-category mappings
  console.log("  Inserting project-to-category mappings...")
  const mappings = coins.flatMap((coin) =>
    coin.categoryNames.map((catName) => ({
      projectId: coin.id,
      categoryId: catByName[catName],
    })),
  )
  await db.insert(projectToCategory).values(mappings)

  // 5. Summary
  console.log("\nSeed complete!")
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Coins:      ${coins.length}`)
  console.log(`  Mappings:   ${mappings.length}`)
  console.log("\nCoins seeded:")
  for (const coin of coins) {
    console.log(`  ${coin.ticker.padEnd(8)} ${coin.name} (${coin.chain}) — ${coin.contractAddress.slice(0, 12)}...`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
