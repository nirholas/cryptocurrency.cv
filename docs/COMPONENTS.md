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

**File:** `src/app/globals.css`

#### Animation Duration Tokens

Use CSS custom properties for consistent timing:

```css
:root {
  --duration-fast: 150ms;    /* Quick interactions */
  --duration-normal: 200ms;  /* Standard transitions */
  --duration-slow: 300ms;    /* Emphasis animations */
}
```

#### Transition Utility Classes

```css
/* Duration utilities */
.transition-fast { transition-duration: var(--duration-fast); }
.transition-normal { transition-duration: var(--duration-normal); }
.transition-slow { transition-duration: var(--duration-slow); }

/* Pre-built transitions */
.transition-colors-fast { 
  transition-property: color, background-color, border-color;
  transition-duration: var(--duration-fast);
}
.transition-all-normal {
  transition-property: all;
  transition-duration: var(--duration-normal);
}
```

#### Entrance/Exit Animations

```css
/* Animate elements entering/exiting */
.animate-enter {
  animation: enter var(--duration-normal) ease-out forwards;
}
.animate-exit {
  animation: exit var(--duration-fast) ease-in forwards;
}
```

#### Keyframe Animations

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes enter {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

#### Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
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

### NewsCard

Versatile news card component with bookmark and share actions.

**File:** `src/components/NewsCard.tsx`

```tsx
import NewsCard from '@/components/NewsCard';

// Default card (for grids)
<NewsCard article={article} />

// Compact card (for sidebars)
<NewsCard article={article} variant="compact" priority={1} />

// Horizontal card (for lists)
<NewsCard article={article} variant="horizontal" showDescription={true} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `article` | Article | - | Article data object |
| `variant` | 'default' \| 'compact' \| 'horizontal' | 'default' | Card layout style |
| `showDescription` | boolean | true | Show article description |
| `priority` | number | - | Ranking number (compact only) |

**Features:**
- Three variants: default, compact, horizontal
- Source-specific color coding
- Reading time estimates
- **Bookmark button** - Save/unsave with visual feedback
- **Share button** - Web Share API with clipboard fallback
- "Link copied!" toast confirmation
- Hover animations (lift, shadow)
- Dark mode compatible
- Accessible focus states

---

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

Slide-out mobile navigation drawer with swipe-to-close gesture support.

**File:** `src/components/MobileNav.tsx`

```tsx
import { MobileNav } from '@/components/MobileNav';

// MobileNav manages its own open/close state internally
<MobileNav />
```

**Features:**
- Slide-in from right
- Swipe-to-close gesture (swipe right to dismiss)
- 80px threshold or 0.3px/ms velocity to trigger close
- Visual swipe indicator bar
- Focus trap for accessibility
- Body scroll lock when open
- ESC key to close
- Collapsible navigation sections
- Language switcher integration

---

### ScrollIndicator

Horizontal scroll container with fade gradients and arrow navigation.

**File:** `src/components/ScrollIndicator.tsx`

```tsx
import { ScrollIndicator, ScrollSnapItem } from '@/components/ScrollIndicator';

<ScrollIndicator showArrows={true} arrowSize="md">
  <div className="flex gap-2">
    {items.map((item) => (
      <ScrollSnapItem key={item.id}>
        <ItemCard {...item} />
      </ScrollSnapItem>
    ))}
  </div>
</ScrollIndicator>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Scrollable content |
| `className` | string | '' | Additional classes |
| `showArrows` | boolean | true | Show arrow buttons |
| `arrowSize` | 'sm' \| 'md' \| 'lg' | 'md' | Arrow button size |

**Features:**
- Fade gradients appear when content is scrollable
- Left/right arrow buttons with smooth scroll
- Scroll-snap support with `ScrollSnapItem` wrapper
- ResizeObserver for dynamic content
- Hidden scrollbar with smooth scrolling

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

### Page Loading Skeletons

Next.js `loading.tsx` files that show during route navigation.

**Files:**
- `src/app/[locale]/loading.tsx` - Homepage skeleton
- `src/app/[locale]/search/loading.tsx` - Search page skeleton
- `src/app/[locale]/article/[slug]/loading.tsx` - Article page skeleton
- `src/app/[locale]/category/[slug]/loading.tsx` - Category page skeleton
- `src/app/[locale]/developers/loading.tsx` - Developers page skeleton
- `src/app/[locale]/markets/loading.tsx` - Markets page skeleton

**Features:**
- Full page layout matching actual content
- Shimmer animation on skeleton elements
- Consistent with dark mode
- Maintains layout stability (no CLS)

---

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

## Animation Components

Located in `src/components/animations.tsx`. Uses Framer Motion for smooth animations.

### FadeIn

Simple fade in animation.

```tsx
import { FadeIn } from '@/components/animations';

<FadeIn duration={0.5} delay={0.1}>
  <p>This content fades in</p>
</FadeIn>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | number | 0.5 | Animation duration in seconds |
| `delay` | number | 0 | Delay before animation starts |
| `children` | ReactNode | - | Content to animate |

### FadeInUp

Fade in with upward slide.

```tsx
import { FadeInUp } from '@/components/animations';

<FadeInUp distance={20}>
  <ArticleCard article={article} />
</FadeInUp>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `distance` | number | 20 | Pixels to slide up |
| `duration` | number | 0.5 | Animation duration |
| `delay` | number | 0 | Animation delay |

### ScaleIn

Scale from smaller to full size.

```tsx
import { ScaleIn } from '@/components/animations';

<ScaleIn scale={0.95}>
  <Modal>...</Modal>
</ScaleIn>
```

### StaggerContainer

Stagger children animations.

```tsx
import { StaggerContainer, FadeInUp } from '@/components/animations';

<StaggerContainer staggerDelay={0.1}>
  {articles.map(article => (
    <FadeInUp key={article.id}>
      <ArticleCard article={article} />
    </FadeInUp>
  ))}
</StaggerContainer>
```

### HoverCard

Card with hover lift effect.

```tsx
import { HoverCard } from '@/components/animations';

<HoverCard scale={1.02} shadow>
  <div className="p-4 bg-white rounded-lg">
    Hover me!
  </div>
</HoverCard>
```

### PressButton

Button with press-down effect.

```tsx
import { PressButton } from '@/components/animations';

<PressButton onClick={handleClick}>
  Click Me
</PressButton>
```

### SlideInPanel

Slide in from edge of screen.

```tsx
import { SlideInPanel } from '@/components/animations';

<SlideInPanel direction="right" isOpen={isOpen}>
  <Sidebar />
</SlideInPanel>
```

**Directions:** `left` | `right` | `top` | `bottom`

### AnimatedTooltip

Tooltip with fade animation.

```tsx
import { AnimatedTooltip } from '@/components/animations';

<AnimatedTooltip content="Helpful tip here">
  <button>Hover for info</button>
</AnimatedTooltip>
```

### Respecting Reduced Motion

All animations automatically respect `prefers-reduced-motion`:

```tsx
// Animations are disabled when user prefers reduced motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

---

## Chart Components

Located in `src/components/charts.tsx`. Uses Recharts for data visualization.

### PriceLineChart

Line chart for price history.

```tsx
import { PriceLineChart } from '@/components/charts';

const data = [
  { time: '9:00', price: 97500 },
  { time: '10:00', price: 98200 },
  { time: '11:00', price: 99100 },
  { time: '12:00', price: 98800 },
];

<PriceLineChart
  data={data}
  dataKey="price"
  height={300}
  color="#10B981"
  showGrid
  showTooltip
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | array | - | Chart data points |
| `dataKey` | string | - | Key for Y-axis values |
| `xAxisKey` | string | 'time' | Key for X-axis |
| `height` | number | 200 | Chart height in px |
| `color` | string | '#3B82F6' | Line color |
| `showGrid` | boolean | false | Show grid lines |
| `showTooltip` | boolean | true | Show hover tooltip |

### PriceAreaChart

Area chart with gradient fill.

```tsx
import { PriceAreaChart } from '@/components/charts';

<PriceAreaChart
  data={priceHistory}
  dataKey="price"
  height={250}
  color="#10B981"
  gradientOpacity={0.3}
/>
```

### VolumeChart

Bar chart for trading volume.

```tsx
import { VolumeChart } from '@/components/charts';

const volumeData = [
  { time: '9:00', volume: 1250000 },
  { time: '10:00', volume: 1890000 },
  { time: '11:00', volume: 2340000 },
];

<VolumeChart
  data={volumeData}
  dataKey="volume"
  height={150}
  color="#6366F1"
/>
```

### ComparisonChart

Compare multiple assets.

```tsx
import { ComparisonChart } from '@/components/charts';

const data = [
  { time: '00:00', BTC: 100, ETH: 100, SOL: 100 },
  { time: '06:00', BTC: 102, ETH: 105, SOL: 98 },
  { time: '12:00', BTC: 104, ETH: 103, SOL: 110 },
];

<ComparisonChart
  data={data}
  lines={[
    { dataKey: 'BTC', color: '#F7931A', name: 'Bitcoin' },
    { dataKey: 'ETH', color: '#627EEA', name: 'Ethereum' },
    { dataKey: 'SOL', color: '#00FFA3', name: 'Solana' },
  ]}
  height={300}
/>
```

### AllocationPieChart

Pie/donut chart for portfolio allocation.

```tsx
import { AllocationPieChart } from '@/components/charts';

const holdings = [
  { name: 'Bitcoin', value: 45000, color: '#F7931A' },
  { name: 'Ethereum', value: 25000, color: '#627EEA' },
  { name: 'Solana', value: 15000, color: '#00FFA3' },
  { name: 'Others', value: 15000, color: '#6B7280' },
];

<AllocationPieChart
  data={holdings}
  innerRadius={60}
  outerRadius={100}
  showLabels
  showLegend
/>
```

### Sparkline

Compact inline chart.

```tsx
import { Sparkline } from '@/components/charts';

// In a table cell or compact space
<td>
  <Sparkline
    data={[45, 52, 48, 61, 55, 67, 72]}
    width={100}
    height={30}
    color={isUp ? '#10B981' : '#EF4444'}
  />
</td>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | number[] | - | Array of values |
| `width` | number | 100 | Sparkline width |
| `height` | number | 30 | Sparkline height |
| `color` | string | '#3B82F6' | Line color |
| `showDot` | boolean | true | Show dot at last point |

### Chart Theming

Charts automatically adapt to dark mode:

```tsx
// Dark mode colors applied via CSS variables
const chartTheme = {
  background: 'var(--chart-bg)',
  text: 'var(--chart-text)',
  grid: 'var(--chart-grid)',
};
```

### Responsive Charts

All charts are responsive by default:

```tsx
<ResponsiveContainer width="100%" height={300}>
  <PriceLineChart data={data} dataKey="price" />
</ResponsiveContainer>
```

### Loading States

Show skeleton while loading:

```tsx
import { ChartSkeleton } from '@/components/charts';

{loading ? (
  <ChartSkeleton height={300} />
) : (
  <PriceLineChart data={data} dataKey="price" />
)}
```

---

## Dashboard Components

### AIMarketAgentDashboard

AI-powered market analysis dashboard with autonomous agent.

**File:** `src/components/AIMarketAgentDashboard.tsx`

```tsx
import AIMarketAgentDashboard from '@/components/AIMarketAgentDashboard';

<AIMarketAgentDashboard
  assets={['BTC', 'ETH']}
  autoRefresh={true}
  refreshInterval={60000}
/>
```

**Features:**
- Real-time AI market analysis
- Multi-asset tracking
- Sentiment gauges
- Signal generation
- Natural language queries

---

### ArbitrageDashboard

Cross-exchange arbitrage opportunity scanner.

**File:** `src/components/ArbitrageDashboard.tsx`

```tsx
import ArbitrageDashboard from '@/components/ArbitrageDashboard';

<ArbitrageDashboard
  pairs={['BTC/USDT', 'ETH/USDT']}
  minSpread={0.5}
  exchanges={['binance', 'coinbase', 'kraken']}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pairs` | string[] | [] | Trading pairs to scan |
| `minSpread` | number | 0.5 | Minimum spread % to display |
| `exchanges` | string[] | all | Exchanges to include |
| `autoRefresh` | boolean | true | Enable auto-refresh |

---

### OptionsFlowDashboard

Real-time options flow visualization.

**File:** `src/components/OptionsFlowDashboard.tsx`

```tsx
import OptionsFlowDashboard from '@/components/OptionsFlowDashboard';

<OptionsFlowDashboard
  asset="BTC"
  exchanges={['deribit', 'okx']}
  showMaxPain={true}
/>
```

**Features:**
- Options flow table with filtering
- Put/Call ratio visualization
- Max pain indicator
- Implied volatility chart
- Large premium alerts

---

### WhaleAlertsDashboard

Large blockchain transaction monitoring.

**File:** `src/components/WhaleAlertsDashboard.tsx`

```tsx
import WhaleAlertsDashboard from '@/components/WhaleAlertsDashboard';

<WhaleAlertsDashboard
  minValue={1000000}
  assets={['BTC', 'ETH', 'USDT']}
  showExchangeFlow={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minValue` | number | 1000000 | Min USD value to display |
| `assets` | string[] | all | Assets to track |
| `showExchangeFlow` | boolean | true | Show exchange in/out flow |
| `soundAlerts` | boolean | false | Play sound on new alerts |

---

### LiquidationsFeed

Real-time liquidation event feed.

**File:** `src/components/LiquidationsFeed.tsx`

```tsx
import LiquidationsFeed from '@/components/LiquidationsFeed';

<LiquidationsFeed
  minValue={10000}
  maxItems={50}
  animate={true}
/>
```

**Features:**
- Real-time liquidation events
- Long/short visualization
- Exchange breakdown
- Cumulative totals
- Animated entry effects

---

### OrderBookDashboard

Aggregated order book visualization.

**File:** `src/components/OrderBookDashboard.tsx`

```tsx
import OrderBookDashboard from '@/components/OrderBookDashboard';

<OrderBookDashboard
  symbol="BTCUSDT"
  depth={20}
  showImbalance={true}
/>
```

**Features:**
- Multi-exchange aggregation
- Depth visualization
- Bid/ask imbalance indicator
- Spread monitoring
- Price level clustering

---

### SentimentDashboard

Multi-source sentiment analysis dashboard.

**File:** `src/components/SentimentDashboard.tsx`

```tsx
import SentimentDashboard from '@/components/SentimentDashboard';

<SentimentDashboard
  asset="BTC"
  sources={['news', 'social', 'onchain']}
  showHistory={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `asset` | string | 'BTC' | Asset to analyze |
| `sources` | string[] | all | Sentiment sources |
| `showHistory` | boolean | true | Show historical chart |
| `period` | string | '24h' | Time period |

---

### SocialIntelligenceDashboard

Social media monitoring across platforms.

**File:** `src/components/SocialIntelligenceDashboard.tsx`

```tsx
import SocialIntelligenceDashboard from '@/components/SocialIntelligenceDashboard';

<SocialIntelligenceDashboard
  platforms={['twitter', 'discord', 'telegram', 'reddit']}
  topics={['bitcoin', 'ethereum']}
/>
```

**Features:**
- Multi-platform aggregation
- Trending topics detection
- Influencer tracking
- Viral content alerts
- Sentiment by platform

---

### RegulatoryDashboard

Regulatory news and impact tracking.

**File:** `src/components/RegulatoryDashboard.tsx`

```tsx
import RegulatoryDashboard from '@/components/RegulatoryDashboard';

<RegulatoryDashboard
  jurisdictions={['US', 'EU', 'UK']}
  showImpactScores={true}
/>
```

---

### ProtocolHealthDashboard

DeFi protocol health monitoring.

**File:** `src/components/ProtocolHealthDashboard.tsx`

```tsx
import ProtocolHealthDashboard from '@/components/ProtocolHealthDashboard';

<ProtocolHealthDashboard
  protocols={['aave', 'compound', 'uniswap']}
  showRiskMetrics={true}
/>
```

**Features:**
- TVL tracking
- Health score visualization
- Risk indicators
- Audit status
- Recent events timeline

---

### FundingRates

Perpetual futures funding rate display.

**File:** `src/components/FundingRates.tsx`

```tsx
import FundingRates from '@/components/FundingRates';

<FundingRates
  symbols={['BTCUSDT', 'ETHUSDT']}
  showPrediction={true}
/>
```

---

### CorrelationMatrix

Asset correlation heatmap.

**File:** `src/components/CorrelationMatrix.tsx`

```tsx
import CorrelationMatrix from '@/components/CorrelationMatrix';

<CorrelationMatrix
  assets={['BTC', 'ETH', 'SOL', 'SPY', 'GOLD']}
  period="30d"
/>
```

---

## AI Components

### OracleChat

AI chat interface for market questions.

**File:** `src/components/OracleChat.tsx`

```tsx
import OracleChat from '@/components/OracleChat';

<OracleChat
  initialQuestion="What's driving BTC price today?"
  showSuggestions={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialQuestion` | string | - | Pre-filled question |
| `showSuggestions` | boolean | true | Show suggested questions |
| `maxHistory` | number | 10 | Chat history length |
| `model` | string | 'gpt-4' | AI model to use |

**Features:**
- Natural language queries
- Context-aware responses
- Source citations
- Follow-up suggestions
- Response streaming

---

### TheOracle

Full-page AI oracle experience.

**File:** `src/components/TheOracle.tsx`

```tsx
import TheOracle from '@/components/TheOracle';

<TheOracle showBackground={true} />
```

---

## Alert Components

### PriceAlerts

Price alert configuration and display.

**File:** `src/components/alerts/PriceAlerts.tsx`

```tsx
import PriceAlerts from '@/components/alerts/PriceAlerts';

<PriceAlerts
  onAlertCreate={(alert) => console.log(alert)}
  showActive={true}
/>
```

**Features:**
- Create price alerts
- Multiple conditions (above, below, percent change)
- Notification preferences
- Alert history
- Bulk management

---

### WhaleAlerts

Whale alert configuration.

**File:** `src/components/alerts/WhaleAlerts.tsx`

```tsx
import WhaleAlerts from '@/components/alerts/WhaleAlerts';

<WhaleAlerts
  minValue={1000000}
  assets={['BTC', 'ETH']}
/>
```

---

### NotificationSettings

Push notification preferences.

**File:** `src/components/NotificationSettings.tsx`

```tsx
import NotificationSettings from '@/components/NotificationSettings';

<NotificationSettings
  categories={['breaking', 'whales', 'signals']}
/>
```

---

### PushNotifications

Push notification permission and management.

**File:** `src/components/PushNotifications.tsx`

```tsx
import PushNotifications from '@/components/PushNotifications';

<PushNotifications
  requestOnMount={false}
  showBanner={true}
/>
```

---

## Payment Components

### X402PaymentButton

Cryptocurrency payment button using X402 protocol.

**File:** `src/components/x402/X402PaymentButton.tsx`

```tsx
import X402PaymentButton from '@/components/x402/X402PaymentButton';

<X402PaymentButton
  amount={100}
  currency="BTC"
  onSuccess={(txHash) => console.log('Paid:', txHash)}
  onError={(err) => console.error(err)}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `amount` | number | required | Amount in satoshis |
| `currency` | string | 'BTC' | BTC, ETH, USDC |
| `label` | string | 'Pay' | Button label |
| `onSuccess` | function | - | Success callback |
| `onError` | function | - | Error callback |

---

## Utility Components

### CryptoCalculator

Cryptocurrency unit converter.

**File:** `src/components/CryptoCalculator.tsx`

```tsx
import CryptoCalculator from '@/components/CryptoCalculator';

<CryptoCalculator
  defaultFrom="BTC"
  defaultTo="USD"
/>
```

---

### GasTracker

Ethereum gas price tracker.

**File:** `src/components/GasTracker.tsx`

```tsx
import GasTracker from '@/components/GasTracker';

<GasTracker
  showHistory={true}
  showPrediction={true}
/>
```

**Features:**
- Real-time gas prices
- Speed estimates (slow, standard, fast)
- Historical chart
- Transaction cost estimator

---

### Screener

Token screening with filters.

**File:** `src/components/Screener.tsx`

```tsx
import Screener from '@/components/Screener';

<Screener
  defaultFilters={{
    marketCapMin: 100000000,
    volume24hMin: 10000000
  }}
/>
```

---

### InfluencerLeaderboard

Crypto influencer rankings.

**File:** `src/components/InfluencerLeaderboard.tsx`

```tsx
import InfluencerLeaderboard from '@/components/InfluencerLeaderboard';

<InfluencerLeaderboard
  platform="twitter"
  metric="accuracy"
  limit={20}
/>
```

---

### SocialBuzz

Social media trending topics.

**File:** `src/components/SocialBuzz.tsx`

```tsx
import SocialBuzz from '@/components/SocialBuzz';

<SocialBuzz
  platforms={['twitter', 'reddit']}
  limit={10}
/>
```

---

## Admin Components

### AdminDashboard

Main admin interface.

**File:** `src/components/admin/AdminDashboard.tsx`

```tsx
import AdminDashboard from '@/components/admin/AdminDashboard';

<AdminDashboard />
```

**Features:**
- System metrics
- User management
- API key management
- Cache controls
- Error logs

---

### BillingManagement

Subscription and billing UI.

**File:** `src/components/billing/BillingManagement.tsx`

```tsx
import BillingManagement from '@/components/billing/BillingManagement';

<BillingManagement userId="user_123" />
```

---

## Portfolio Components

### PortfolioDashboard

Portfolio tracking and analytics.

**File:** `src/components/portfolio/PortfolioDashboard.tsx`

```tsx
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';

<PortfolioDashboard
  showPerformance={true}
  showAllocation={true}
/>
```

---

### WatchlistManager

Cryptocurrency watchlist management.

**File:** `src/components/watchlist/WatchlistManager.tsx`

```tsx
import WatchlistManager from '@/components/watchlist/WatchlistManager';

<WatchlistManager
  maxItems={50}
  showAlerts={true}
/>
```

---

## Component Best Practices

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false 
  }
);
```

### Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

### Testing Components

```tsx
import { render, screen } from '@testing-library/react';
import PriceAlerts from '@/components/alerts/PriceAlerts';

test('renders price alerts', () => {
  render(<PriceAlerts />);
  expect(screen.getByText('Price Alerts')).toBeInTheDocument();
});
```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API.md)
- [Hooks](HOOKS.md)
- [Contributing Guide](CONTRIBUTING.md)
