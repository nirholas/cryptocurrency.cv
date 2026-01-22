# 🧩 Component Documentation

Comprehensive documentation for all React components in Free Crypto News.

---

## Table of Contents

- [Design System](#design-system)
- [Layout Components](#layout-components)
- [Article Cards](#article-cards)
- [Navigation](#navigation)
- [Market Components](#market-components)
- [Interactive Components](#interactive-components)
- [Loading States](#loading-states)
- [PWA Components](#pwa-components)
- [Utility Components](#utility-components)

---

## Design System

### Brand Colors

```typescript
const colors = {
  brand: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Primary
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
};
```

### Source-Specific Gradients

Each news source has a unique gradient for visual distinction:

```typescript
const sourceStyles = {
  'CoinDesk': {
    gradient: 'from-blue-700 via-blue-600 to-cyan-500',
    mesh: 'radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)',
    accent: 'text-blue-400',
    badge: 'bg-blue-500/20',
  },
  'CoinTelegraph': {
    gradient: 'from-orange-700 via-amber-600 to-yellow-500',
    mesh: 'radial-gradient(ellipse at 20% 80%, rgba(245, 158, 11, 0.4) 0%, transparent 50%)',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20',
  },
  'The Block': {
    gradient: 'from-purple-700 via-violet-600 to-indigo-500',
    accent: 'text-purple-400',
  },
  'Decrypt': {
    gradient: 'from-emerald-700 via-green-600 to-teal-500',
    accent: 'text-emerald-400',
  },
  'Bitcoin Magazine': {
    gradient: 'from-orange-800 via-orange-600 to-amber-500',
    accent: 'text-orange-400',
  },
  'Blockworks': {
    gradient: 'from-slate-700 via-gray-600 to-zinc-500',
    accent: 'text-slate-400',
  },
  'The Defiant': {
    gradient: 'from-pink-700 via-rose-600 to-red-500',
    accent: 'text-pink-400',
  },
};
```

### Typography

```css
/* Font stack */
font-family: var(--font-geist-sans), system-ui, sans-serif;

/* Sizes */
.text-xs    { font-size: 0.75rem; }   /* 12px */
.text-sm    { font-size: 0.875rem; }  /* 14px */
.text-base  { font-size: 1rem; }      /* 16px */
.text-lg    { font-size: 1.125rem; }  /* 18px */
.text-xl    { font-size: 1.25rem; }   /* 20px */
.text-2xl   { font-size: 1.5rem; }    /* 24px */
.text-3xl   { font-size: 1.875rem; }  /* 30px */
.text-4xl   { font-size: 2.25rem; }   /* 36px */
```

### Spacing & Layout

```css
/* Max widths */
.max-w-7xl { max-width: 80rem; }  /* 1280px */

/* Container padding */
.px-4 { padding: 0 1rem; }
.sm:px-6 { padding: 0 1.5rem; }
.lg:px-8 { padding: 0 2rem; }
```

### Animations

```css
/* Custom animations defined in globals.css */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

---

## Layout Components

### Header

Main navigation header with search, theme toggle, and mobile menu.

**File:** `src/components/Header.tsx`

```tsx
import Header from '@/components/Header';

<Header />
```

**Features:**
- Logo with home link
- Category navigation
- Search modal trigger
- Theme toggle (dark/light)
- Mobile hamburger menu
- Keyboard shortcuts (Cmd+K for search)

---

### Footer

Site footer with links, categories, and API endpoints.

**File:** `src/components/Footer.tsx`

```tsx
import Footer from '@/components/Footer';

<Footer />
```

**Features:**
- Gradient mesh background
- Four-column layout (brand, categories, resources, API)
- Social links with hover effects
- MIT license badge
- Responsive grid

**Props:** None (static component)

---

### Hero

Landing page hero section with animated gradient text.

**File:** `src/components/Hero.tsx`

```tsx
import Hero from '@/components/Hero';

<Hero />
```

**Features:**
- Animated gradient headline
- Feature pills (No API Key, 7 Sources, etc.)
- Dual CTAs (Browse News, View API)
- Floating orb decorations
- Terminal preview component
- Dark/light mode support

---

## Article Cards

### ArticleCardLarge

Premium horizontal card for Editor's Picks section.

**File:** `src/components/cards/ArticleCardLarge.tsx`

```tsx
import ArticleCardLarge from '@/components/cards/ArticleCardLarge';

<ArticleCardLarge
  title="Bitcoin Surges Past $100K"
  description="Institutional buying drives historic rally..."
  link="https://coindesk.com/..."
  source="CoinDesk"
  timeAgo="2 hours ago"
  category="bitcoin"
  image="/images/article.jpg"
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | Article headline |
| `description` | string | - | Article excerpt |
| `link` | string | ✅ | Article URL |
| `source` | string | ✅ | Source name |
| `timeAgo` | string | ✅ | Relative time |
| `category` | string | - | Article category |
| `image` | string | - | Image URL |

**Features:**
- 45%/55% image-content split
- Animated mesh background per source
- Reading time estimate
- Hover scale animation
- "Read More" CTA with arrow

---

### ArticleCardMedium

Standard grid card for main news display.

**File:** `src/components/cards/ArticleCardMedium.tsx`

```tsx
import ArticleCardMedium from '@/components/cards/ArticleCardMedium';

<ArticleCardMedium
  title="Ethereum 2.0 Launch Date Confirmed"
  link="https://decrypt.co/..."
  source="Decrypt"
  timeAgo="1 hour ago"
  category="ethereum"
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | Article headline |
| `link` | string | ✅ | Article URL |
| `source` | string | ✅ | Source name |
| `timeAgo` | string | ✅ | Relative time |
| `category` | string | - | Article category |
| `showBookmark` | boolean | - | Show bookmark button |

**Features:**
- Animated gradient mesh background
- Floating orb decorations
- Glassmorphism source badge
- Reading time estimate
- Hover lift effect
- Bookmark button

---

### ArticleCardSmall

Compact card for sidebar and trending lists.

**File:** `src/components/cards/ArticleCardSmall.tsx`

```tsx
import ArticleCardSmall from '@/components/cards/ArticleCardSmall';

<ArticleCardSmall
  title="XRP Breaks Out"
  link="https://..."
  source="CoinTelegraph"
  timeAgo="30 min ago"
  rank={1}  // Shows gold medal 🥇
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | Article headline |
| `link` | string | ✅ | Article URL |
| `source` | string | ✅ | Source name |
| `timeAgo` | string | ✅ | Relative time |
| `rank` | number | - | Position (1-3 get medals) |
| `showBookmark` | boolean | - | Show bookmark button |

**Features:**
- Gradient color bar (animates on hover)
- Medal ranks (🥇🥈🥉) for top 3
- Compact horizontal layout
- Source-specific colors

---

### FeaturedArticle

Hero-style featured article display.

**File:** `src/components/FeaturedArticle.tsx`

```tsx
import FeaturedArticle from '@/components/FeaturedArticle';

<FeaturedArticle article={article} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `article` | NewsArticle | ✅ | Article object |

**Features:**
- Full-width gradient background
- Large typography
- Animated mesh pattern
- "FEATURED" badge
- Reading time
- Responsive padding

---

## Navigation

### CategoryNav

Horizontal category navigation.

**File:** `src/components/CategoryNav.tsx`

```tsx
import CategoryNav from '@/components/CategoryNav';

<CategoryNav activeCategory="bitcoin" />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeCategory` | string | - | Currently active category |

**Categories:**
- 📰 All News
- ₿ Bitcoin
- 🔷 Ethereum
- 🏦 DeFi
- 🔮 NFTs
- ⚖️ Regulation
- 🏢 Markets

---

### MobileNav

Slide-out mobile navigation drawer.

**File:** `src/components/MobileNav.tsx`

```tsx
import MobileNav from '@/components/MobileNav';

<MobileNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | ✅ | Drawer visibility |
| `onClose` | function | ✅ | Close handler |

---

### Breadcrumbs

Page breadcrumb navigation.

**File:** `src/components/Breadcrumbs.tsx`

```tsx
import Breadcrumbs from '@/components/Breadcrumbs';

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Bitcoin', href: '/category/bitcoin' },
    { label: 'Article Title' },
  ]}
/>
```

---

## Market Components

### MarketStats

Market overview widget with prices and sentiment.

**File:** `src/components/MarketStats.tsx`

```tsx
import MarketStats from '@/components/MarketStats';

<MarketStats />  // Server component - fetches own data
```

**Features:**
- Total market cap with 24h change
- Mini sparkline chart
- 24h volume
- BTC dominance
- Fear & Greed Index gauge
- Trending coins list

---

### PriceTicker

Horizontal scrolling price ticker.

**File:** `src/components/PriceTicker.tsx`

```tsx
import PriceTicker from '@/components/PriceTicker';

<PriceTicker coins={['bitcoin', 'ethereum', 'solana']} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `coins` | string[] | - | Coin IDs to display |

---

## Interactive Components

### SearchModal

Full-screen search overlay.

**File:** `src/components/SearchModal.tsx`

```tsx
import SearchModal from '@/components/SearchModal';

<SearchModal 
  isOpen={searchOpen} 
  onClose={() => setSearchOpen(false)} 
/>
```

**Features:**
- Keyboard shortcut (Cmd+K)
- Real-time search
- Recent searches
- Search suggestions
- Results preview

---

### BookmarkButton

Save article to local bookmarks.

**File:** `src/components/BookmarkButton.tsx`

```tsx
import BookmarkButton from '@/components/BookmarkButton';

<BookmarkButton article={article} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `article` | NewsArticle | ✅ | Article to bookmark |

**Features:**
- Persists to localStorage
- Animated heart icon
- Toggle on/off
- Syncs with BookmarksProvider

---

### ShareButtons

Social sharing buttons.

**File:** `src/components/ShareButtons.tsx`

```tsx
import ShareButtons from '@/components/ShareButtons';

<ShareButtons 
  url="https://..." 
  title="Article Title" 
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `url` | string | ✅ | URL to share |
| `title` | string | ✅ | Share title |

**Platforms:**
- Twitter/X
- Facebook
- LinkedIn
- Reddit
- Copy link

---

### ThemeToggle

Dark/light mode toggle.

**File:** `src/components/ThemeToggle.tsx`

```tsx
import ThemeToggle from '@/components/ThemeToggle';

<ThemeToggle />
```

**Features:**
- Sun/moon icon animation
- System preference detection
- Persists preference
- Smooth transition

---

## Loading States

### LoadingSpinner

Animated loading indicator.

**File:** `src/components/LoadingSpinner.tsx`

```tsx
import LoadingSpinner, { 
  PageLoader, 
  CardSkeleton, 
  CardGridSkeleton 
} from '@/components/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" variant="default" />

// Full page loader
<PageLoader text="Loading articles..." />

// Card skeleton
<CardSkeleton />

// Grid of skeletons
<CardGridSkeleton count={6} />
```

**Props (LoadingSpinner):**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Spinner size |
| `variant` | 'default' \| 'brand' \| 'minimal' \| 'dots' | 'default' | Style variant |
| `text` | string | - | Loading text |

**Variants:**
- `default`: Gradient ring spinner
- `brand`: Brand-colored with glow
- `minimal`: Simple border spinner
- `dots`: Bouncing dots animation

---

### Skeleton

Generic skeleton loading component.

**File:** `src/components/Skeleton.tsx`

```tsx
import Skeleton from '@/components/Skeleton';

<Skeleton className="h-4 w-48" />
<Skeleton className="h-32 w-full" />
```

---

## PWA Components

### InstallPrompt

PWA install banner.

**File:** `src/components/InstallPrompt.tsx`

```tsx
import InstallPrompt from '@/components/InstallPrompt';

<InstallPrompt />
```

**Features:**
- Shows when installable
- Platform-specific instructions
- Dismissable
- Remembers dismissal

---

### UpdatePrompt

Service worker update notification.

**File:** `src/components/UpdatePrompt.tsx`

```tsx
import UpdatePrompt from '@/components/UpdatePrompt';

<UpdatePrompt />
```

**Features:**
- Shows when new version available
- "Update Now" button
- Reloads page on update

---

### OfflineIndicator

Offline status indicator.

**File:** `src/components/OfflineIndicator.tsx`

```tsx
import OfflineIndicator from '@/components/OfflineIndicator';

<OfflineIndicator />
```

**Features:**
- Shows when offline
- Animated pulse
- Auto-hides when online

---

## Utility Components

### BreakingNewsBanner

Urgent news alert banner.

**File:** `src/components/BreakingNewsBanner.tsx`

```tsx
import BreakingNewsBanner from '@/components/BreakingNewsBanner';

<BreakingNewsBanner article={breakingArticle} />
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `article` | NewsArticle | - | Breaking news article |

**Features:**
- Pulsing background animation
- Shimmer sweep effect
- Lightning bolt icon
- Urgency indicator lines
- Auto-fetches if no article provided

---

### StructuredData

JSON-LD structured data for SEO.

**File:** `src/components/StructuredData.tsx`

```tsx
import StructuredData from '@/components/StructuredData';

<StructuredData
  type="Article"
  data={{
    headline: "Article Title",
    datePublished: "2026-01-22",
    author: "CoinDesk",
  }}
/>
```

---

### ReadingProgress

Article reading progress bar.

**File:** `src/components/ReadingProgress.tsx`

```tsx
import ReadingProgress from '@/components/ReadingProgress';

<ReadingProgress />
```

**Features:**
- Fixed top position
- Gradient color
- Smooth animation
- Only shows on article pages

---

## Accessibility

All components follow WCAG AA guidelines:

- **Focus states**: Visible focus rings on all interactive elements
- **Color contrast**: Minimum 4.5:1 ratio
- **Motion**: Respects `prefers-reduced-motion`
- **Keyboard**: Full keyboard navigation
- **ARIA**: Proper labels and roles
- **Screen readers**: Meaningful content order

```tsx
// Example accessibility patterns
<button
  className="focus-ring"  // Visible focus state
  aria-label="Close menu"  // Screen reader label
  onClick={onClose}
>
  <span aria-hidden="true">×</span>  // Hide decorative content
</button>
```

---

## Testing Components

```bash
# Run component tests
npm test

# Visual regression tests
npm run test:visual

# Accessibility audit
npm run test:a11y
```

---

## Related Documentation

- [Architecture Overview](../ARCHITECTURE.md)
- [API Reference](API.md)
- [Contributing Guide](../CONTRIBUTING.md)
