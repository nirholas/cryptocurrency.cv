# Prompt 02: Add Quality/Tier Filter to the News API

## Goal

Add a `quality` query parameter to the `/api/news` endpoint that lets consumers filter articles by source tier. Default behavior should exclude the lowest tiers (which were removed in prompt 01, but this creates the infrastructure for any future tier filtering). The API should respect a `min_tier` parameter.

## Context

After prompt 01, the remaining tiers are: `tier1`, `tier2`, `tier3`, `research`. The `tier4` and `fintech` tiers have been removed. We want to let API consumers request specific quality levels.

## Changes

### 1. `src/lib/schemas/index.ts` — Add `quality` param to `newsQuerySchema`

Add a new optional `quality` field to the `newsQuerySchema` z.object:

```typescript
export const newsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  source: z.string().optional(),
  category: z
    .enum([
      "general",
      "bitcoin",
      "defi",
      "nft",
      "research",
      "institutional",
      "etf",
      "derivatives",
      "onchain",
      "macro",
      "quant",
      "journalism",
      "ethereum",
      "asia",
      "tradfi",
      "mainstream",
      "mining",
      "gaming",
      "altl1",
      "stablecoin",
      "geopolitical",
      "security",
      "developer",
      "layer2",
      "solana",
      "trading",
    ])
    .optional(),
  quality: z.enum(["all", "high", "premium"]).optional(),
  lang: languageSchema.default("en"),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).optional(),
});
```

**Also remove `'fintech'` from the `category` enum** — fintech sources no longer exist.

Quality levels map to tiers:

- `premium` → tier1 + research only (institutional-grade)
- `high` → tier1 + tier2 + research (default for homepage)
- `all` → tier1 + tier2 + tier3 + research (everything we have)
- No value / omitted → same as `all` (backward compatible)

### 2. `src/lib/source-tiers.ts` — Add tier filtering helper

Add this new exported function after the existing helpers:

```typescript
/**
 * Returns the set of tiers included at a given quality level.
 * - 'premium'  → tier1 + research
 * - 'high'     → tier1 + tier2 + research
 * - 'all' / undefined → all tiers
 */
export function getTiersForQuality(quality?: string): Set<SourceTier> {
  switch (quality) {
    case "premium":
      return new Set(["tier1", "research"]);
    case "high":
      return new Set(["tier1", "tier2", "research"]);
    default:
      return new Set(["tier1", "tier2", "tier3", "research"]);
  }
}

/**
 * Returns true if the given source key passes the quality filter.
 */
export function sourcePassesQuality(
  sourceKey: string,
  quality?: string,
): boolean {
  if (!quality || quality === "all") return true;
  const tier = getSourceTier(sourceKey);
  if (!tier) return quality !== "premium"; // Unknown sources pass unless premium filter
  return getTiersForQuality(quality).has(tier);
}
```

### 3. `src/lib/crypto-news.ts` — Wire quality filtering into `getLatestNews()`

Update the `NewsQueryOptions` interface (around line 3830):

```typescript
export interface NewsQueryOptions {
  category?: string;
  from?: Date | string;
  to?: Date | string;
  page?: number;
  perPage?: number;
  homepageOnly?: boolean;
  quality?: string; // NEW: 'premium' | 'high' | 'all'
}
```

Import the new helper:

```typescript
import { SOURCE_REPUTATION_SCORES, sourcePassesQuality } from "./source-tiers";
```

(Remove the `isFintechSource` import if it wasn't already removed in prompt 01)

In `getLatestNews()`, after the existing source filtering logic and before `fetchMultipleSources()`, add quality filtering:

```typescript
// Apply quality filter
if (options?.quality && options.quality !== "all") {
  sourceKeys = sourceKeys.filter((k) =>
    sourcePassesQuality(k, options.quality),
  );
}
```

This should go right before the `let articles = await fetchMultipleSources(...)` call.

### 4. `src/app/api/news/route.ts` — Pass quality param through

Update the destructuring of `validation.data` (around line 55):

```typescript
const { limit, source, category, from, to, page, per_page, lang, quality } =
  validation.data;
```

Update the `getLatestNews` call to pass quality:

```typescript
const data = await getLatestNews(limit, source, {
  from,
  to,
  page,
  perPage: per_page,
  category,
  homepageOnly: sources === "homepage",
  quality,
});
```

### 5. Also update `VALID_CATEGORIES` array in the route file

Remove `'fintech'` from the `VALID_CATEGORIES` array (around line 30).

## Verification

- `GET /api/news` → returns all sources (backward compatible)
- `GET /api/news?quality=all` → same as above
- `GET /api/news?quality=high` → only T1, T2, research
- `GET /api/news?quality=premium` → only T1, research
- `GET /api/news?quality=invalid` → Zod validation error (400)
- `bun run build` passes
- `bun run test` passes

## Commit message

`feat: add quality filter parameter to news API (?quality=premium|high|all)`
