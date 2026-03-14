# Prompt 03: Expose Tier & Credibility Metadata in API Responses

## Goal

Add `tier`, `credibility`, and `reputation` fields to each article in the news API response. This gives consumers full transparency about source quality and lets them build their own filtering/ranking on the client side.

## Context

Source tier data lives in `src/lib/source-tiers.ts` (the `SOURCE_TIERS` map). Each article already carries a `sourceKey` field. We need to look up the tier info at response time and attach it.

## Changes

### 1. `src/lib/crypto-news.ts` — Extend `NewsArticle` interface

Find the `NewsArticle` interface (around line 2419-2433) and add three new optional fields:

```typescript
export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  translations?: Record<string, string>;
  imageUrl?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
  // Quality metadata
  tier?: string; // e.g. 'tier1', 'tier2', 'tier3', 'research'
  credibility?: number; // 0-1, source credibility score
  reputation?: number; // 0-100, source reputation score
}
```

### 2. `src/lib/crypto-news.ts` — Attach tier metadata during article creation

Import `getSourceTier, getSourceCredibility, getSourceReputation` from `./source-tiers` (update the existing import).

Find the `parseRSSFeed()` function where individual articles are constructed (each article object is built with `title`, `link`, `description`, etc.). Add the tier fields when creating each article:

```typescript
tier: getSourceTier(sourceKey) ?? undefined,
credibility: getSourceCredibility(sourceKey),
reputation: getSourceReputation(sourceKey),
```

Search for all places where `NewsArticle` objects are created/returned in `crypto-news.ts` — there may be multiple (RSS parsing, API source merging, etc.). Each one should include the tier fields. The key places are:

1. **`parseRSSFeed()`** — where RSS items become NewsArticle objects
2. **Any API source parsers** (fear & greed, price data) — these can use defaults or skip tier fields since they're not news sources

### 3. `src/lib/source-tiers.ts` — Export the helpers if not already exported

Make sure `getSourceTier`, `getSourceCredibility`, `getSourceReputation` are all exported. They should already be from prompt 02, but verify.

### 4. SDK type updates — `sdk/typescript/src/index.ts`

Find the `NewsArticle` interface in the TypeScript SDK and add the same optional fields:

```typescript
tier?: string;
credibility?: number;
reputation?: number;
```

### 5. Update API documentation response examples

In `docs/API.md`, find the example news response JSON and add the new fields to the example article:

```json
{
  "title": "Bitcoin Surges Past $100K...",
  "link": "https://...",
  "source": "CoinDesk",
  "sourceKey": "coindesk",
  "category": "general",
  "tier": "tier2",
  "credibility": 0.95,
  "reputation": 90,
  ...
}
```

## What NOT to change

- Don't change the archive format — historical articles don't need tier fields
- Don't change the trending score calculation — it already uses reputation internally
- Don't add tier fields to the Zod `articleSchema` in `schemas/index.ts` unless it's used for response validation (check if it is — if so, add the optional fields there too)

## Verification

- `GET /api/news` response articles now include `tier`, `credibility`, `reputation`
- Tier values match what's in `SOURCE_TIERS` for known sources
- Unknown/unmapped sources get `null` tier, default credibility (0.60), default reputation (50)
- `bun run build` passes
- `bun run test` passes

## Commit message

`feat: expose source tier, credibility, and reputation in API responses`
