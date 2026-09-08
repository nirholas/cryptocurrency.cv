# SEO Guide

This document outlines the SEO implementation and best practices for Free Crypto News.

## Current Implementation

### ✅ Sitemap

**Files:** 
- `src/app/sitemap.ts` - Main sitemap
- `src/app/news-sitemap.xml/route.ts` - Google News sitemap

Dynamic sitemap generation supporting:

- **Canonical, unprefixed URLs.** `next-intl` runs with `localePrefix: 'as-needed'`,
  so the default locale is served at the bare path and `/en/<path>` only 307s
  there. The sitemap therefore emits `https://cryptocurrency.cv/markets`, never
  `https://cryptocurrency.cv/en/markets`, and attaches `hreflang` alternates for
  the other locales with `x-default` pointing at the unprefixed URL.
- **Only routes that exist.** Static pages are discovered by walking the route
  tree on disk (`src/app/[locale]`), so a deleted or renamed page drops out of
  the sitemap instead of becoming a 404. Private and account-bound segments
  (`/dashboard`, `/settings`, `/login`, `/keys`, `/bookmarks`, `/notifications`,
  `/watchlist`, `/portfolio`, `/alerts`, `/export`) are excluded.
- **Only translated locales** are advertised in `hreflang`. Routing accepts more
  locales than we have message files for, and an untranslated locale is a
  duplicate English page.
- **146 blog posts** at `/blog/<slug>` plus a page per active category at
  `/blog/category/<category>`, all weekly.
- **Top cryptocurrencies** with hourly updates.
- **Google News sitemap** with `<news:news>` tags for fast news indexing.

```typescript
// Example sitemap entry (note: no /en/ prefix)
{
  url: 'https://cryptocurrency.cv/markets',
  lastModified: new Date(),
  changeFrequency: 'hourly',
  priority: 0.9,
  alternates: { languages: { es: 'https://cryptocurrency.cv/es/markets', /* … */ } },
}
```

See `src/app/sitemap.ts` and its test at `src/__tests__/sitemap.test.ts`.

### ✅ Robots.txt

**File:** `src/app/robots.ts`

Configured rules for:

- **AI bots** - explicitly allowed, not merely tolerated: GPTBot, ChatGPT-User,
  Claude-Web, ClaudeBot, anthropic-ai, Grok, xAI-Grok, Google-Extended,
  FacebookBot, Meta-ExternalAgent, PerplexityBot, cohere-ai, YouBot,
  mistral-crawler, Amazonbot, Applebot-Extended, Bytespider and more. The API
  middleware allowlists the same agents, so a crawler that reads `robots.ts` and
  then calls the API is never turned away at the door.
- **Search engines** (Googlebot, Bingbot) - with crawl delays
- **Protected paths** - `/api/`, `/admin/`, `/_next/`
- **Multiple sitemaps** - main sitemap and news sitemap

### ✅ Structured Data (JSON-LD)

**File:** `src/components/StructuredData.tsx`

Implemented schemas:

| Schema | Component | Usage |
|--------|-----------|-------|
| WebSite | `WebsiteStructuredData` | Homepage (includes SearchAction for sitelinks) |
| Organization | `OrganizationStructuredData` | Homepage |
| NewsArticle | `ArticleStructuredData` | Article pages |
| ItemList | `NewsListStructuredData` | News feeds |
| BreadcrumbList | `BreadcrumbStructuredData` | Navigation pages |
| FAQPage | `FAQStructuredData` | Documentation / FAQ |
| SoftwareApplication | `SoftwareApplicationStructuredData` | Developer / API pages |

### ✅ Meta Tags

**File:** `src/app/[locale]/layout.tsx`

Configured metadata:

- **Title template:** `%s | Free Crypto News`
- **Open Graph:** Full image, type, locale support
- **Twitter Cards:** Large image summary
- **Robots:** Index, follow, max snippets
- **Viewport:** Responsive, proper scaling

### ✅ Internationalization SEO

**File:** `src/components/AlternateLinks.tsx`

- **`getAlternateLanguages()`** utility generates hreflang URLs for all locales
- Used by `generateSEOMetadata()` in `src/lib/seo.ts` to set `alternates.languages`
- **Proper locale mapping** (zh-CN → zh-Hans)

---

## Performance Components

### Core Web Vitals Monitoring

**Tool:** `@vercel/speed-insights`

Automatic Core Web Vitals reporting via Vercel Speed Insights, integrated in the locale layout:

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

// In layout body
<SpeedInsights />
```

Measures:

- **LCP** - Largest Contentful Paint (target: < 2.5s)
- **FID** - First Input Delay (target: < 100ms)
- **CLS** - Cumulative Layout Shift (target: < 0.1)
- **FCP** - First Contentful Paint
- **TTFB** - Time to First Byte
- **INP** - Interaction to Next Paint

### Optimized Image Component

**File:** `src/components/OptimizedImage.tsx`

Features:

- WebP/AVIF format support via Next.js Image optimization
- Enforced alt text
- Fallback image on load failure
- Lazy loading by default, `priority` prop for above-fold images
- Aspect ratio enforcement to prevent CLS

### Dynamic OG Images

**Files:**
- `src/app/[locale]/opengraph-image.tsx` — Homepage / locale pages
- `src/app/[locale]/article/[id]/opengraph-image.tsx` — Article pages (headline, sentiment, tags)
- `src/app/[locale]/coin/[id]/opengraph-image.tsx` — Coin pages (live price, 24h change)
- `src/app/api/og/route.tsx` — General-purpose OG image API
- `src/app/api/og/coin/route.tsx` — Coin OG image API
- `src/app/api/og/market/route.tsx` — Market OG image API

Next.js file-convention `opengraph-image.tsx` files automatically generate unique 1200×630 social share images per page. Article pages show the headline with sentiment indicator, coin pages show live prices with green/red change indicators.

---

## SEO Utilities

### `src/lib/seo.ts`

Helper functions for generating optimized metadata:

```typescript
import { generateSEOMetadata, generateCoinMetadata, generateArticleMetadata } from '@/lib/seo';

// Generic page metadata
export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: 'Market Overview',
    description: 'Real-time cryptocurrency market data...',
    path: '/markets',
    tags: ['crypto', 'market', 'prices'],
  });
}

// Coin page metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const coin = await getCoin(params.coinId);
  return generateCoinMetadata({
    name: coin.name,
    symbol: coin.symbol,
    price: coin.price,
    priceChange: coin.priceChange24h,
  });
}
```

---

## Best Practices

### 1. Title Tags

- Keep under **60 characters**
- Include primary keyword at the start
- Use the title template for consistency

```typescript
// Good
title: 'Bitcoin Price Live - BTC/USD Chart & News'

// Bad (too long)
title: 'Bitcoin BTC Cryptocurrency Price Chart News Updates Live Real-Time Data'
```

### 2. Meta Descriptions

- Keep under **160 characters**
- Include call-to-action
- Use unique descriptions per page

```typescript
// Good
description: 'Track Bitcoin price in real-time. Get the latest BTC news, charts, and market analysis. Free, no signup required.'

// Bad
description: 'Bitcoin cryptocurrency page with information about Bitcoin.'
```

### 3. Images

Use the `OptimizedImage` component:

```tsx
import OptimizedImage from '@/components/OptimizedImage';

<OptimizedImage
  src={coin.image}
  alt="Bitcoin (BTC) cryptocurrency logo"
  width={64}
  height={64}
  priority={false}
/>
```

Always provide descriptive alt text:

```tsx
// Good
alt="Bitcoin (BTC) cryptocurrency logo"
alt="Bitcoin 24-hour price chart showing 5% increase"

// Bad
alt="logo"
alt="chart"
alt="" // Never empty!
```

### 4. Internal Linking

- Use descriptive anchor text
- Link to related content
- Maintain reasonable link depth (3 clicks max)

```tsx
// Good
<Link href="/coin/bitcoin">Bitcoin price analysis</Link>

// Bad
<Link href="/coin/bitcoin">Click here</Link>
```

### 5. URL Structure

URLs should be:

- Lowercase
- Hyphen-separated
- Descriptive
- Short but meaningful

```
✅ /en/coin/bitcoin
✅ /en/category/defi-news
❌ /en/coin/Bitcoin
❌ /en/page?id=123
```

---

## Performance SEO

### Core Web Vitals

Implemented optimizations:

1. **LCP (Largest Contentful Paint)**
   - Use `priority` prop on hero images
   - Preconnect to external domains
   - Font optimization with `next/font`

2. **FID (First Input Delay)**
   - Minimal JavaScript in critical path
   - Code splitting with dynamic imports
   - Web Workers for heavy computations

3. **CLS (Cumulative Layout Shift)**
   - Explicit width/height on images
   - Font display swap
   - Reserved space for dynamic content

### Preconnect/Prefetch

Already configured in layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://api.coingecko.com" />
```

---

## Monitoring & Testing

### Tools

1. **[Google Search Console](https://search.google.com/search-console)** - Monitor indexing, crawl errors, keyword rankings
2. **[Google PageSpeed Insights](https://pagespeed.web.dev/)** - Core Web Vitals (LCP, CLS, INP)
3. **[Rich Results Test](https://search.google.com/test/rich-results)** - Validate JSON-LD structured data
4. **[Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)** - Mobile usability
5. **[Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)** (free tier) - Backlinks, broken pages
6. **[Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/)** - Full site crawl for missing metadata/broken links

### Validation Commands

```bash
# Check structured data is present
curl -s https://cryptocurrency.cv/en | grep -c 'application/ld+json'

# Check sitemap is accessible and valid
curl -sI https://cryptocurrency.cv/sitemap.xml | grep -E "HTTP|Content-Type"
curl -s https://cryptocurrency.cv/sitemap.xml | head -20

# Check robots.txt
curl -s https://cryptocurrency.cv/robots.txt

# Check news sitemap
curl -sI https://cryptocurrency.cv/news-sitemap.xml | grep -E "HTTP|Content-Type"

# Check a page's canonical URL
curl -s https://cryptocurrency.cv/en/fear-greed | grep 'rel="canonical"'

# Count sitemap entries
curl -s https://cryptocurrency.cv/sitemap.xml | grep -c '<loc>'
```

### Monthly SEO Audit Checklist

Run these checks every month:

1. **Search Console** - Review Coverage report for indexing errors or excluded pages
2. **PageSpeed Insights** - Run on homepage, a coin page, and an article page
3. **Rich Results Test** - Validate structured data on homepage, article page, coin page
4. **Sitemap** - Verify no 404s by fetching and spot-checking 10 random URLs
5. **Robots.txt** - Confirm AI bots can reach API endpoints
6. **Core Web Vitals** - Check Vercel Speed Insights dashboard

---

## 2026 Audit Findings & Fixes

Audit conducted February 2026. Issues found and resolved:

| Issue | Severity | Status |
|-------|----------|--------|
| Sitemap included 4 non-existent pages (`/alerts`, `/unlocks`, `/smart-money`, `/exchange-flows`) → 404s | High | ✅ Fixed |
| 22+ real pages (fear-greed, onchain, whales, etc.) missing from sitemap | High | ✅ Fixed |
| `robots.ts` used `/*.json$` — the `$` is not a regex anchor in robots.txt format | Medium | ✅ Fixed |
| Layout default `alternates.canonical: '/'` applied to all pages, overriding page-level canonicals | Medium | ✅ Fixed |
| Layout default description had emoji wasting 2 characters | Low | ✅ Fixed |
| `OrganizationStructuredData.sameAs` only listed GitHub | Low | ✅ Fixed |
| `about`, `defi`, `sources`, `topics`, `trending`, `sentiment`, `digest` had weak metadata (no OG tags, generic titles) | Medium | ✅ Fixed |
| ~30 pages use `export const metadata` (static) — valid but not dynamic | Info | Acceptable |
| `compare` and `watchlist` pages are `'use client'` — can't use `generateMetadata` | Info | By design |

### Remaining SEO gaps

- **Individual source pages** (`/source/[source]`) not in sitemap
- **Category index page** (`/category`) not in sitemap — only specific categories are listed
- `compare` and `watchlist` are client components; their metadata is set only at the static layout level
- `booking`, `install`, `offline`, `saved`, `settings`, `share` pages intentionally excluded (user-specific or utility pages)

---

## Checklist for New Pages

When creating new pages, ensure:

- [ ] `export const metadata: Metadata = {...}` with unique title + description (or `generateMetadata` for dynamic pages)
- [ ] Title under 60 characters, includes primary keyword
- [ ] Description 120–160 characters, human-readable call to action
- [ ] `openGraph` block with title + description (at minimum)
- [ ] `keywords` array with 5–10 relevant terms
- [ ] `alternates.canonical` set to the canonical path
- [ ] Proper heading hierarchy (single H1, logical H2-H6)
- [ ] Structured data if applicable (use components from `StructuredData.tsx`)
- [ ] Alt text on all images
- [ ] Added to `sitemap.ts` `staticPages` array (if publicly indexable)
- [ ] Mobile responsive design

---

## Future Improvements

1. ~~**Google News Sitemap**~~ ✅ Implemented
2. ~~**Canonical URLs**~~ ✅ Implemented project-wide
3. ~~**Image Optimization**~~ ✅ WebP/AVIF formats configured
4. ~~**Core Web Vitals Monitoring**~~ ✅ Implemented
5. ~~**Sitemap ghost pages removed**~~ ✅ Cleaned up February 2026
6. **Individual source pages** — add `/source/[source]` canonical and sitemap entries
7. ~~**Dynamic OG images**~~ ✅ Implemented — file-convention `opengraph-image.tsx` for homepage, article, and coin pages
8. **Google News Publisher Center** — submit for Google News inclusion
9. **hreflang in page-level metadata** — use `getAlternateLanguages()` from `AlternateLinks.tsx` on high-traffic pages
10. **AMP Pages** — for news articles (optional)
