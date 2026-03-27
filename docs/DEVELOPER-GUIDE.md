# Developer Guide

Technical documentation for developers working on or extending Free Crypto News.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Providers & Context](#providers-context)
- [Utilities](#utilities)
- [API Routes](#api-routes)
- [Scripts & Automation](#scripts-automation)
- [Styling](#styling)
- [Testing](#testing)
- [Extending the App](#extending-the-app)

---

## 🏗️ Architecture Overview

Free Crypto News is built with:

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Drizzle ORM** | - | Database (Neon Postgres) |
| **Upstash Redis** | - | Distributed caching & rate limiting |
| **next-intl** | - | Internationalisation (42 locales) |
| **next-themes** | - | Dark mode support |
| **Zod** | - | Runtime schema validation |
| **Pino** | - | Structured JSON logging |
| **OpenTelemetry** | - | Distributed tracing |
| **Inngest** | - | Background job orchestration |

### Key Patterns

- **Server Components** - Default for data fetching
- **Client Components** - Interactive features (`'use client'`)
- **API Routes** - Serverless functions in `/api`
- **Providers** - Context for global state

---

## 📁 Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── [locale]/                # i18n wrapper — all user-facing pages
│   │   ├── page.tsx             # Homepage — latest news feed
│   │   ├── article/[slug]/      # Article detail
│   │   ├── category/[slug]/     # Category feed
│   │   ├── source/[source]/     # Source filter
│   │   ├── coin/[coinId]/       # Coin-specific news
│   │   ├── search/              # Full-text search
│   │   └── ...
│   ├── api/                     # 150+ API routes (mostly Edge Runtime)
│   │   ├── news/                # Main news feed
│   │   ├── search/              # Search articles
│   │   ├── article/             # AI summary, extraction
│   │   ├── market/              # Price data, charts, fear & greed
│   │   ├── ai/                  # Sentiment, summaries, RAG
│   │   ├── onchain/             # On-chain metrics, whale alerts
│   │   ├── defi/                # Yields, TVL, DEX volumes
│   │   ├── sse/                 # Server-Sent Events stream
│   │   ├── rss/ , atom/         # Feed endpoints
│   │   ├── v1/ , v2/            # Versioned endpoints
│   │   ├── og/                  # Dynamic OpenGraph images
│   │   ├── cron/                # Scheduled jobs
│   │   └── ...
│   └── layout.tsx               # Root layout + providers
├── components/                  # 170+ React components
│   ├── cards/                   # Article card variants
│   ├── charts/                  # Market charts (Recharts)
│   ├── rag-chat/                # RAG chat interface
│   ├── admin/                   # Admin dashboard
│   ├── ui/                      # Base UI primitives
│   └── ...
├── hooks/                       # Custom React hooks
├── i18n/                        # Internationalization config
├── types/                       # TypeScript type definitions
├── __tests__/                   # Unit tests
└── lib/                         # 200+ library modules
    ├── api.ts                   # API client functions
    ├── archive-v2.ts            # Archive read/write helpers
    ├── distributed-cache.ts     # Redis / in-memory cache
    ├── news-sources.ts          # Source registry (200+ feeds)
    ├── rate-limiter.ts          # Distributed rate limiting
    ├── reading-time.ts          # Reading time utilities
    └── ...

archive/                         # Static JSON data store
mcp/                             # Claude MCP server
sdk/                             # Official SDKs (13 languages)
widget/                          # Embeddable HTML widgets
scripts/                         # Build & automation scripts
messages/                        # i18n translation files (42 locales)
drizzle/                         # Database migrations
e2e/                             # Playwright E2E tests
stories/                         # Storybook component stories
```

---

## 🧩 Core Components

### NewsCard

The primary article display component with multiple variants.

```tsx
import { NewsCard } from '@/components/NewsCard';

<NewsCard
  article={article}
  variant="default"      // 'default' | 'compact' | 'featured' | 'horizontal'
  showImage={true}
  showDescription={true}
  showReadingTime={true}
  priority={false}       // Image loading priority
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `article` | `Article` | required | Article data object |
| `variant` | `string` | `'default'` | Display variant |
| `showImage` | `boolean` | `true` | Show thumbnail |
| `showDescription` | `boolean` | `true` | Show excerpt |
| `showReadingTime` | `boolean` | `true` | Show reading time badge |
| `priority` | `boolean` | `false` | Next.js Image priority |

**Data Attributes:**

- `data-article` - Article identifier for keyboard navigation

---

### ArticleCardLarge

Premium horizontal card for featured sections like Editor's Picks.

```tsx
import { ArticleCardLarge } from '@/components/cards/ArticleCardLarge';

<ArticleCardLarge
  article={article}
  imagePosition="left"   // 'left' | 'right'
/>
```

---

### HeroArticle

Full-width hero section for the most important story.

```tsx
import { HeroArticle } from '@/components/HeroArticle';

<HeroArticle article={featuredArticle} />
```

---

### ReadingProgress

Scroll progress indicator for article pages.

```tsx
import { ReadingProgress } from '@/components/ReadingProgress';

// Add to article layout
<ReadingProgress />
```

**Features:**
- Throttled scroll listener (16ms)
- Gradient background (blue → purple)
- Fixed position at top
- Auto-hides at 0%

---

### SearchAutocomplete

Debounced search input with dropdown suggestions.

```tsx
import { SearchAutocomplete } from '@/components/SearchAutocomplete';

<SearchAutocomplete
  placeholder="Search news..."
  className="w-full"
/>
```

**Features:**
- 300ms debounce
- Keyboard navigation (↑/↓/Enter/Escape)
- Click outside to close
- Loading state
- Mobile responsive

---

### ThemeToggle

Dark mode toggle button.

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle />
```

**States:**
- ☀️ Light mode
- 🌙 Dark mode
- System preference (auto)

---

### KeyboardShortcuts

Global keyboard navigation provider with help modal.

```tsx
// In layout.tsx
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcuts';

<KeyboardShortcutsProvider>
  {children}
</KeyboardShortcutsProvider>
```

**Registered Shortcuts:**

| Key | Action |
|-----|--------|
| `j` | Select next `[data-article]` element |
| `k` | Select previous `[data-article]` element |
| `Enter` | Navigate to selected article |
| `/` | Focus search input |
| `d` | Toggle dark mode |
| `g h` | Navigate to home |
| `g t` | Navigate to trending |
| `g s` | Navigate to sources |
| `g b` | Navigate to bookmarks |
| `?` | Toggle help modal |

---

### BreakingNewsBanner

Animated banner for urgent news.

```tsx
import { BreakingNewsBanner } from '@/components/BreakingNewsBanner';

<BreakingNewsBanner />
```

**Features:**
- Auto-fetches from `/api/breaking`
- Animated red pulsing dot
- Auto-dismissible
- Links to full article

---

### BookmarkButton

Toggle bookmark state for articles.

```tsx
import { BookmarkButton } from '@/components/BookmarkButton';

<BookmarkButton articleId={article.id} />
```

**Features:**
- Uses `BookmarksProvider` context
- Persists to localStorage
- Animated state change

---

## 🔌 Providers & Context

### ThemeProvider

Manages dark/light mode state.

```tsx
// layout.tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

**Usage in components:**

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme, resolvedTheme } = useTheme();
```

---

### BookmarksProvider

Manages bookmarked articles.

```tsx
// layout.tsx
import { BookmarksProvider } from '@/components/BookmarksProvider';

<BookmarksProvider>
  {children}
</BookmarksProvider>
```

**Usage in components:**

```tsx
import { useBookmarks } from '@/components/BookmarksProvider';

const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
```

---

### KeyboardShortcutsProvider

Registers global keyboard shortcuts.

```tsx
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcuts';

<KeyboardShortcutsProvider>
  {children}
</KeyboardShortcutsProvider>
```

---

## 🛠️ Utilities

### reading-time.ts

Calculate and estimate reading times.

```typescript
import { 
  calculateReadingTime, 
  estimateReadingTime, 
  getReadingTimeBadgeColor 
} from '@/lib/reading-time';

// From full text
const minutes = calculateReadingTime(articleContent);
// => 5

// Estimate from title + description
const estimated = estimateReadingTime(title, description);
// => 3

// Get badge color class
const colorClass = getReadingTimeBadgeColor(minutes);
// => 'bg-green-100 text-green-800' (1-3 min)
// => 'bg-yellow-100 text-yellow-800' (4-7 min)
// => 'bg-red-100 text-red-800' (8+ min)
```

---

### api.ts

API client functions.

```typescript
import { 
  fetchNews, 
  fetchArticle, 
  searchNews,
  fetchBreaking,
  fetchSources 
} from '@/lib/api';

// Fetch latest news
const { articles } = await fetchNews({ limit: 10 });

// Search
const results = await searchNews('bitcoin ETF');

// Get single article with AI summary
const article = await fetchArticle(articleId);
```

---

## 🌐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` | No | Upstash Redis / Vercel KV URL |
| `KV_REST_API_TOKEN` | No | Redis auth token |
| `DATABASE_URL` | No | Neon Postgres connection string |
| `GROQ_API_KEY` | No | Groq AI (free, recommended for dev) |
| `OPENAI_API_KEY` | No | OpenAI GPT models |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude models |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google Gemini AI |
| `INNGEST_EVENT_KEY` | No | Background job orchestration |
| `SENTRY_DSN` | No | Error monitoring |
| `VAPID_PUBLIC_KEY` | No | Web push notifications |
| `VAPID_PRIVATE_KEY` | No | Web push notifications |

> **Tip:** The app runs with **zero environment variables** for basic development. Without Redis, it uses in-memory caching. Without a database, it reads from the static archive. Without AI keys, AI endpoints return helpful error messages.

---

## 🛣️ API Routes

All API routes are in `src/app/api/`. The project has **150+ endpoints** organised by category:

### Core

| Route | Method | Description |
|-------|--------|-------------|
| `/api/news` | GET | Latest news feed |
| `/api/search` | GET | Full-text search |
| `/api/article` | GET | Article with AI summary |
| `/api/breaking` | GET | Breaking news (last 2h) |
| `/api/trending` | GET | Trending topics |
| `/api/digest` | GET | AI-generated daily digest |
| `/api/sources` | GET | Available news sources |
| `/api/health` | GET | System health check |

### Topic-Specific

| Route | Method | Description |
|-------|--------|-------------|
| `/api/bitcoin` | GET | Bitcoin news |
| `/api/defi` | GET | DeFi news |
| `/api/solana` | GET | Solana ecosystem |
| `/api/nft` | GET | NFT news |
| `/api/gaming` | GET | Web3 gaming |
| `/api/regulatory` | GET | Regulation & policy |

### Market Data

| Route | Method | Description |
|-------|--------|-------------|
| `/api/prices` | GET | Current prices |
| `/api/market` | GET | Market overview |
| `/api/fear-greed` | GET | Fear & Greed Index |
| `/api/charts` | GET | Price charts |
| `/api/ohlc` | GET | OHLC candle data |
| `/api/derivatives` | GET | Derivatives data |
| `/api/liquidations` | GET | Liquidation data |

### AI & Analysis

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai` | POST | Multi-action AI endpoint |
| `/api/sentiment` | GET | Market sentiment analysis |
| `/api/summarize` | POST | Article summarisation |
| `/api/extract` | POST | Entity extraction |
| `/api/factcheck` | POST | Fact checking |
| `/api/forecast` | GET | AI market forecasts |
| `/api/rag` | POST | RAG chat with news context |

### On-Chain

| Route | Method | Description |
|-------|--------|-------------|
| `/api/onchain` | GET | On-chain metrics |
| `/api/whale-alerts` | GET | Whale transaction alerts |
| `/api/gas` | GET | Gas prices |
| `/api/flows` | GET | Exchange flows |

### Feeds & Export

| Route | Method | Description |
|-------|--------|-------------|
| `/api/rss` | GET | RSS feed |
| `/api/atom` | GET | Atom feed |
| `/api/opml` | GET | OPML subscription list |
| `/api/export` | GET | Data export (CSV/JSON) |
| `/api/openapi.json` | GET | OpenAPI specification |

### Adding a New Endpoint

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  
  // Your logic here
  const data = await fetchData(limit);
  
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}
```

---

## 🎨 Styling

### Tailwind Configuration

Custom colors and extensions in `tailwind.config.js`.

### Dark Mode

Use `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

### Common Patterns

```tsx
// Card with hover
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow">

// Gradient text
<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

// Focus ring (keyboard nav)
<a className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
```

---

## 🔧 Scripts & Automation

The `scripts/` directory contains utilities for development, testing, and maintenance.

### Changelog Automation

Keep CHANGELOG.md in sync with git history:

```bash
# Generate changelog from commits
./scripts/generate-changelog.sh --unreleased

# Check if commits are documented
node scripts/analyze-commits.js --check

# Auto-update CHANGELOG.md with missing entries
node scripts/analyze-commits.js --update

# View commit statistics
node scripts/commit-stats.js
```

📚 **Full documentation:** [scripts/CHANGELOG-AUTOMATION.md](https://github.com/nirholas/free-crypto-news/blob/main/scripts/CHANGELOG-AUTOMATION.md)

### Accessibility Audits

```bash
# Run accessibility audit
node scripts/a11y-audit.js

# Check color contrast
node scripts/contrast-audit.js
```

### Internationalization

```bash
# Translate to new locale
GROQ_API_KEY=your-key npx tsx scripts/i18n/translate.ts --locale es

# Validate translations
npx tsx scripts/i18n/validate.ts
```

### Archive Management

```bash
# Collect today's news
node scripts/archive/collect.js

# View archive stats
node scripts/archive/stats.js
```

📚 **All scripts:** [scripts/README.md](https://github.com/nirholas/free-crypto-news/blob/main/scripts/README.md)

---

## 🐛 Debugging Tips

### Common development issues

**Port 3000 already in use:**
```bash
lsof -i :3000          # Find the process
kill -9 <PID>          # Kill it
# Or use a different port:
PORT=3001 bun run dev
```

**Redis connection errors:**
The app works without Redis — it falls back to in-memory caching. To silence Redis warnings, remove `KV_REST_API_URL` from `.env.local`.

**AI endpoints returning errors:**
Set at least one AI provider key in `.env.local`. [Groq](https://console.groq.com) is free and recommended for development.

**Empty news feed on fresh install:**
News is fetched from RSS feeds every 5 minutes. On a fresh install, wait for the first fetch cycle or run:
```bash
bun run archive:collect
```

**TypeScript errors after pulling:**
```bash
pnpm install            # Install any new dependencies
bun run typecheck       # Verify types
```

### Useful debug commands

```bash
bun run lint            # Run ESLint
bun run typecheck       # Run TypeScript compiler check
bun run test            # Run unit tests (Vitest)
bun run test:e2e        # Run E2E tests (Playwright)
bun run analyze         # Bundle size analysis
bun run audit:unused    # Find unused exports (Knip)
bun run audit:a11y      # Accessibility audit
bun run archive:stats   # View archive statistics
```

---

## 🧪 Testing

### Running Tests

```bash
# Unit tests (Vitest)
bun run test

# Unit tests with coverage
bun run test:coverage

# E2E tests (Playwright)
bun run test:e2e

# Lint
bun run lint

# Type checking
bun run typecheck
```

### Writing Tests

```typescript
// src/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Testing strategies

| Layer | Tool | Location |
|-------|------|----------|
| Unit tests | Vitest | `src/__tests__/` |
| Component tests | Vitest + Testing Library | `src/__tests__/` |
| Visual tests | Storybook 10 | `stories/` |
| E2E tests | Playwright | `e2e/` |
| API tests | Vitest | `src/__tests__/api/` |

> See [Testing Guide](TESTING.md) for comprehensive testing documentation.

---

## 🔧 Extending the App

### Adding a New Page

1. Create folder in `src/app/`:

```bash
mkdir -p src/app/my-page
```

2. Create `page.tsx`:

```tsx
// src/app/my-page/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page | Free Crypto News',
  description: 'Description here',
};

export default async function MyPage() {
  const data = await fetchData();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1>My Page</h1>
      {/* Content */}
    </main>
  );
}
```

---

### Adding a New Component

1. Create component file:

```tsx
// src/components/MyComponent.tsx
'use client';

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

/**
 * MyComponent - Brief description
 * 
 * @param title - The title to display
 * @param onAction - Callback when action is triggered
 */
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

2. Export from component index (if using barrel exports).

---

### Adding a New SDK

See existing SDKs in `sdk/` for patterns. The project currently ships **13 SDKs**:

| Tier | SDKs |
|------|------|
| Tier 1 (full-featured) | Python, TypeScript, Go |
| Tier 2 (standard) | JavaScript, React, PHP, Ruby, Rust |
| Tier 3 (basic) | Java, Kotlin, Swift, C#, R |

To add a new SDK:

1. Create folder: `sdk/my-language/`
2. Implement a client class with these core methods:
   - `getLatest(limit)` — Fetch latest news
   - `search(query)` — Full-text search
   - `getBitcoin(limit)` — Bitcoin-specific news
   - `getDefi(limit)` — DeFi news
   - `getBreaking(limit)` — Breaking news
   - `getMarket()` — Market data
   - `getSentiment()` — Sentiment analysis
3. Add comprehensive `README.md` with:
   - Installation instructions
   - Quick start example
   - Method reference table
   - Error handling examples
4. Add tests
5. Update `docs/README.md` to list the new SDK
6. Update the main `README.md` SDK section

---

### Adding a New Data Source

To add a new RSS/Atom news source:

1. Edit `src/lib/news-sources.ts`
2. Add an entry to the sources array:

```typescript
{
  name: 'My Source',
  url: 'https://example.com/rss',
  category: 'bitcoin',       // or 'ethereum', 'defi', 'nft', etc.
  language: 'en',
  reliability: 'high',       // 'high' | 'medium' | 'low'
}
```

3. Test the feed: `curl https://example.com/rss | head -50`
4. Run the dev server and verify articles appear

---

### Adding Background Jobs

Background jobs use [Inngest](https://www.inngest.com/) for event-driven functions:

```typescript
// src/app/api/inngest/route.ts
import { inngest } from '@/lib/inngest';

export const myJob = inngest.createFunction(
  { id: 'my-job', name: 'My Background Job' },
  { cron: '0 * * * *' },  // Every hour
  async ({ event, step }) => {
    // Your job logic here
  }
);
```

---

## 📚 Additional Resources

### Project documentation

- [Architecture](ARCHITECTURE.md) — System design, data flow, storage
- [API Reference](API.md) — Complete endpoint catalogue (150+ endpoints)
- [Testing Guide](TESTING.md) — Unit, component, and E2E testing
- [Database](DATABASE.md) — Storage backends, Drizzle ORM, migrations
- [Deployment](DEPLOYMENT.md) — Vercel, Docker, Railway
- [Real-Time](REALTIME.md) — SSE, WebSocket, push notifications
- [AI Features](AI-FEATURES.md) — Summarisation, sentiment, RAG
- [Scalability](SCALABILITY.md) — Caching, edge runtime, load handling
- [Security](SECURITY.md) — Security policy and architecture

### External documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
