# Article Card Components

A suite of premium, accessible article card components for the Free Crypto News site.

## Overview

The card system provides 4 variants optimized for different use cases, plus utility components for enhanced functionality.

## Card Variants

### ArticleCardLarge

Premium horizontal card for Editor's Picks and featured sections.

```tsx
import { ArticleCardLarge } from '@/components/cards';

<ArticleCardLarge
  article={article}
  externalLink={false}  // Link to internal article page (default)
/>
```

**Features:**
- Responsive: stacked on mobile, horizontal on desktop
- 320px height on desktop
- Animated mesh gradient backgrounds
- Floating orb animations
- Source-specific color schemes

---

### ArticleCardMedium

Vertical card for grid display layouts.

```tsx
import { ArticleCardMedium } from '@/components/cards';

<ArticleCardMedium
  article={article}
  externalLink={false}
/>
```

**Features:**
- 200px gradient image area
- Category badge overlay
- Glassmorphism effects
- Image zoom on hover

---

### ArticleCardSmall

Compact card for sidebar trending lists.

```tsx
import { ArticleCardSmall } from '@/components/cards';

<ArticleCardSmall
  article={article}
  rank={1}           // Optional ranking number
  showRank={true}    // Show numbered ranking
  showBookmark={true}
/>
```

**Features:**
- Minimal footprint
- Optional rank indicator (1, 2, 3...)
- Top 3 ranks highlighted with brand color
- Source color bar indicator

---

### ArticleCardList

Full-width horizontal card for "More Stories" sections.

```tsx
import { ArticleCardList } from '@/components/cards';

<ArticleCardList
  article={article}
  showBookmark={true}
  showShare={true}
/>
```

**Features:**
- 96-112px thumbnail
- Single-line description on desktop
- Compact meta row
- Reading progress indicator support

---

## Using Posts Component

The `Posts` component wraps all card variants with a grid layout:

```tsx
import Posts from '@/components/Posts';

// Default medium cards in grid
<Posts articles={articles} />

// Large cards stacked
<Posts articles={articles} variant="large" />

// Small cards with rankings
<Posts articles={articles} variant="small" showRank={true} />

// List view
<Posts articles={articles} variant="list" />

// External links (open source site)
<Posts articles={articles} externalLinks={true} />
```

---

## Skeleton Loading States

Show loading states while fetching data:

```tsx
import { 
  ArticleCardLargeSkeleton,
  ArticleCardMediumSkeleton,
  ArticleCardSmallSkeleton,
  ArticleCardListSkeleton,
  ArticleGridSkeleton 
} from '@/components/cards';

// Individual skeleton
<ArticleCardMediumSkeleton />

// Grid of skeletons
<ArticleGridSkeleton variant="medium" count={6} />
<ArticleGridSkeleton variant="large" count={3} />
<ArticleGridSkeleton variant="small" count={5} />
```

---

## Utility Components

### CardImage

Smart image with lazy loading and gradient fallback:

```tsx
import { CardImage } from '@/components/cards';

<CardImage
  src={article.imageUrl}      // Optional - falls back to gradient
  alt={article.title}
  source={article.source}     // Used for gradient color
  size="md"                   // 'sm' | 'md' | 'lg'
  showSourceInitial={true}    // Show source letter in fallback
  className="absolute inset-0"
/>
```

### CardBookmarkButton

Bookmark button styled for card overlays:

```tsx
import { CardBookmarkButton } from '@/components/cards';

<CardBookmarkButton
  article={article}
  size="sm"           // 'sm' | 'md'
  className="absolute top-4 right-4"
/>
```

### QuickShareButton

Share button with native share API + clipboard fallback:

```tsx
import { QuickShareButton } from '@/components/cards';

<QuickShareButton
  title={article.title}
  url={articleUrl}
/>
```

### SentimentBadge

Market sentiment indicator:

```tsx
import { SentimentBadge } from '@/components/cards';

<SentimentBadge 
  sentiment="bullish"   // 'bullish' | 'bearish' | 'neutral'
  size="sm"             // 'sm' | 'md'
/>
```

### ReadingProgress

Progress bar for partially read articles:

```tsx
import { ReadingProgress } from '@/components/cards';

<ReadingProgress 
  progress={45}         // 0-100
  className="mt-2"
/>
```

---

## Article Interface

All cards expect articles matching this interface:

```typescript
interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  
  // Optional fields
  description?: string;
  category?: string;
  readTime?: string;
  id?: string;
  imageUrl?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  readProgress?: number;  // 0-100
}
```

---

## Source Color Mapping

Each source gets unique gradient and badge colors:

| Source | Gradient | Badge |
|--------|----------|-------|
| CoinDesk | Blue | `bg-blue-500` |
| The Block | Purple | `bg-purple-500` |
| Decrypt | Emerald | `bg-emerald-500` |
| CoinTelegraph | Orange | `bg-orange-500` |
| Bitcoin Magazine | Amber | `bg-amber-500` |
| Blockworks | Indigo | `bg-indigo-500` |
| The Defiant | Pink | `bg-pink-500` |

Access colors programmatically:

```typescript
import { getSourceColors, getSourceGradient } from '@/components/cards';

const colors = getSourceColors('CoinDesk');
// { bg: 'bg-blue-100', text: 'text-blue-700', solid: 'bg-blue-500' }

const gradient = getSourceGradient('CoinDesk');
// 'from-blue-700 via-blue-800 to-indigo-900'
```

---

## Accessibility

All cards include:

- **Focus rings**: Visible keyboard focus indicators
- **ARIA labels**: Screen reader support
- **Reduced motion**: Respects `prefers-reduced-motion`
- **Semantic HTML**: Proper `<article>`, `<time>`, heading hierarchy
- **Color contrast**: WCAG AA compliant text

```tsx
// Animations disabled for users who prefer reduced motion
className="motion-reduce:transition-none motion-reduce:hover:scale-100"
```

---

## Dark Mode

All components support dark mode automatically via Tailwind's `dark:` variants:

```tsx
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

---

## File Structure

```
src/components/cards/
├── index.ts              # Barrel exports
├── cardUtils.ts          # Shared colors, types, helpers
├── ArticleCardLarge.tsx  # Premium horizontal card
├── ArticleCardMedium.tsx # Grid card
├── ArticleCardSmall.tsx  # Compact sidebar card
├── ArticleCardList.tsx   # List view card
├── CardImage.tsx         # Smart image component
├── CardBookmarkButton.tsx# Bookmark button
├── QuickShareButton.tsx  # Share button
├── SentimentBadge.tsx    # Market sentiment
├── ReadingProgress.tsx   # Reading progress bar
└── CardSkeletons.tsx     # Loading states
```

---

## Importing

```tsx
// Import specific components
import { ArticleCardLarge, ArticleCardMedium } from '@/components/cards';

// Import everything
import * as Cards from '@/components/cards';

// Import utilities
import { 
  sourceColors, 
  sourceGradients,
  getSourceColors,
  estimateReadTime,
  type Article 
} from '@/components/cards';
```
