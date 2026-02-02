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
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **next-themes** | - | Dark mode support |

### Key Patterns

- **Server Components** - Default for data fetching
- **Client Components** - Interactive features (`'use client'`)
- **API Routes** - Serverless functions in `/api`
- **Providers** - Context for global state

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles
│   ├── api/                # API routes
│   │   ├── news/           # News endpoints
│   │   ├── search/         # Search endpoint
│   │   ├── article/        # AI summary endpoint
│   │   └── ...
│   ├── article/[id]/       # Article detail pages
│   ├── category/[slug]/    # Category pages
│   ├── source/[source]/    # Source filter pages
│   └── ...
├── components/             # React components
│   ├── cards/              # Article card variants
│   ├── ui/                 # Base UI components
│   └── ...
└── lib/                    # Utilities and helpers
    ├── api.ts              # API client functions
    ├── reading-time.ts     # Reading time utilities
    └── utils.ts            # General utilities
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

## 🛣️ API Routes

All API routes are in `src/app/api/`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/news` | GET | Latest news |
| `/api/search` | GET | Search articles |
| `/api/article` | GET | Article with AI summary |
| `/api/breaking` | GET | Breaking news (2h) |
| `/api/bitcoin` | GET | Bitcoin news |
| `/api/defi` | GET | DeFi news |
| `/api/trending` | GET | Trending topics |
| `/api/sources` | GET | News sources |
| `/api/health` | GET | API health check |

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

## 🧪 Testing

### Running Tests

```bash
# TypeScript SDK tests
cd sdk/typescript && npm test

# Lint
npm run lint
```

### Writing Tests

```typescript
// sdk/typescript/src/__tests__/client.test.ts
import { describe, it, expect } from 'vitest';
import { CryptoNews } from '../client';

describe('CryptoNews', () => {
  it('should fetch latest news', async () => {
    const client = new CryptoNews();
    const articles = await client.getLatest(5);
    expect(articles).toHaveLength(5);
  });
});
```

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

See existing SDKs in `sdk/` for patterns:

1. Create folder: `sdk/my-language/`
2. Implement client with methods:
   - `getLatest(limit)`
   - `search(query)`
   - `getDefi(limit)`
   - `getBitcoin(limit)`
   - `getBreaking(limit)`
3. Add `README.md` with usage examples
4. Update main `README.md` to list new SDK

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
