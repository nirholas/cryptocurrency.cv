# SEO Guide

This document outlines the SEO implementation and best practices for Free Crypto News.

## Current Implementation

### ✅ Sitemap

**Files:** 
- `src/app/sitemap.ts` - Main sitemap
- `src/app/news-sitemap.xml/route.ts` - Google News sitemap

Dynamic sitemap generation supporting:

- **18 locales** with proper URLs
- **50+ static pages** with appropriate change frequencies
- **22 top cryptocurrencies** with hourly updates
- **Blog posts** with weekly updates
- **API documentation** pages
- **Google News sitemap** with `<news:news>` tags for fast news indexing

```typescript
// Example sitemap entry
{
  url: 'https://cryptocurrency.cv/en/markets',
  lastModified: new Date(),
  changeFrequency: 'hourly',
  priority: 0.9,
}
```

### ✅ Robots.txt

**File:** `src/app/robots.ts`

Configured rules for:

- **AI bots** (GPTBot, ChatGPT-User) - allowed access to public APIs
- **Search engines** (Googlebot, Bingbot) - with crawl delays
- **Protected paths** - `/api/`, `/admin/`, `/_next/`
- **Multiple sitemaps** - main sitemap and news sitemap

### ✅ Structured Data (JSON-LD)

**File:** `src/components/StructuredData.tsx`

Implemented schemas:

| Schema | Component | Usage |
|--------|-----------|-------|
| WebSite | `WebsiteStructuredData` | Homepage |
| Organization | `OrganizationStructuredData` | Homepage |
| NewsArticle | `ArticleStructuredData` | Article pages |
| ItemList | `NewsListStructuredData` | News feeds |
| BreadcrumbList | `BreadcrumbStructuredData` | Navigation |
| FAQPage | `FAQStructuredData` | Documentation |
| SoftwareApplication | `APIStructuredData` | Developer pages |
| FinancialProduct | `CryptoAssetStructuredData` | Coin pages |
| VideoObject | `VideoStructuredData` | Video embeds |

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

- **hreflang tags** for all 18 locales
- **x-default** fallback to English
- **Proper locale mapping** (zh-CN → zh-Hans)

---

## Performance Components

### Core Web Vitals Monitoring

**File:** `src/components/WebVitals.tsx`

Measures and reports:

- **LCP** - Largest Contentful Paint (target: < 2.5s)
- **FID** - First Input Delay (target: < 100ms)
- **CLS** - Cumulative Layout Shift (target: < 0.1)
- **FCP** - First Contentful Paint
- **TTFB** - Time to First Byte
- **INP** - Interaction to Next Paint

```tsx
// Add to layout.tsx
import { WebVitals } from '@/components/WebVitals';

// In your component
<WebVitals />
```

### Resource Hints

**File:** `src/components/ResourceHints.tsx`

Provides:

- **Preconnect** - Establish early connections
- **DNS Prefetch** - Resolve DNS for future navigations
- **Preload** - Fetch critical resources early

### SEO Image Component

**File:** `src/components/SEOImage.tsx`

Features:

- Enforced alt text (required prop)
- Fallback image on load failure
- Proper lazy loading
- Caption and credit support

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

Use the `SEOImage` component:

```tsx
import { SEOImage, generateCryptoAltText, IMAGE_SIZES } from '@/components/SEOImage';

<SEOImage
  src={coin.image}
  alt={generateCryptoAltText({ type: 'logo', name: 'Bitcoin', symbol: 'BTC' })}
  width={64}
  height={64}
  sizes={IMAGE_SIZES.thumbnail}
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

1. **Google Search Console** - Monitor indexing, errors
2. **Google PageSpeed Insights** - Core Web Vitals
3. **Rich Results Test** - Validate structured data
4. **Mobile-Friendly Test** - Mobile usability

### Validation Commands

```bash
# Validate structured data
curl https://cryptocurrency.cv/en | grep -o '<script type="application/ld+json">[^<]*'

# Check sitemap
curl https://cryptocurrency.cv/sitemap.xml

# Check robots.txt
curl https://cryptocurrency.cv/robots.txt
```

---

## Checklist for New Pages

When creating new pages, ensure:

- [ ] `generateMetadata` function with unique title/description
- [ ] Proper heading hierarchy (single H1, logical H2-H6)
- [ ] Structured data if applicable
- [ ] Alt text on all images
- [ ] Internal links to related content
- [ ] Added to sitemap (if significant)
- [ ] Canonical URL set
- [ ] Mobile responsive design

---

## Future Improvements

1. ~~**Google News Sitemap**~~ ✅ Implemented
2. ~~**Canonical URLs**~~ ✅ Implemented on article and coin pages
3. ~~**Image Optimization**~~ ✅ WebP/AVIF formats configured
4. ~~**Core Web Vitals Monitoring**~~ ✅ Implemented
5. **Google News Publisher Center** - Submit for Google News inclusion
6. **AMP Pages** - For news articles (optional)
7. **Video SEO** - If adding video content
8. **Local SEO** - If targeting specific regions
