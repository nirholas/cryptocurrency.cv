# 🧪 Testing Guide

Comprehensive testing guide for the Free Crypto News project.

---

## Table of Contents

- [Overview](#overview)
- [Unit Testing (Vitest)](#unit-testing-vitest)
- [Component Testing](#component-testing)
- [API Integration Tests](#api-integration-tests)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Storybook](#storybook)
- [Coverage](#coverage)
- [CI/CD Integration](#cicd-integration)

---

## Overview

The project uses a three-tier testing strategy:

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Vitest | Test individual functions & utilities |
| Component | Vitest + Testing Library | Test React components |
| E2E | Playwright | Test full user flows |
| Visual | Storybook | Component documentation & visual testing |

---

## Unit Testing (Vitest)

### Setup

Vitest is pre-configured with React support:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run once (CI mode)
npm run test:run

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Configuration

See [vitest.config.ts](https://github.com/nirholas/free-crypto-news/blob/main/vitest.config.ts):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Writing Unit Tests

**Testing Library Functions:**

```typescript
// src/lib/alerts.test.ts
import { describe, it, expect } from 'vitest';
import { createPriceAlert, checkPriceAlerts } from './alerts';

describe('Alerts', () => {
  it('creates a price alert', () => {
    const alert = createPriceAlert({
      userId: 'user-1',
      coinId: 'bitcoin',
      type: 'above',
      targetPrice: 100000,
    });

    expect(alert.id).toBeDefined();
    expect(alert.coinId).toBe('bitcoin');
    expect(alert.triggered).toBe(false);
  });

  it('triggers when price exceeds target', () => {
    createPriceAlert({
      userId: 'user-1',
      coinId: 'bitcoin',
      type: 'above',
      targetPrice: 50000,
    });

    const triggered = checkPriceAlerts({ bitcoin: 55000 });
    expect(triggered.length).toBe(1);
  });
});
```

**Testing Async Functions:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchCryptoNews } from './crypto-news';

// Mock fetch
vi.mock('global', () => ({
  fetch: vi.fn(),
}));

describe('fetchCryptoNews', () => {
  it('fetches and parses news', async () => {
    const articles = await fetchCryptoNews({ limit: 5 });
    expect(Array.isArray(articles)).toBe(true);
  });
});
```

---

## Component Testing

### Testing React Components

```typescript
// src/components/Header.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders logo', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /crypto news/i })).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /trending/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sources/i })).toBeInTheDocument();
  });
});
```

**Testing User Interactions:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkButton } from './BookmarkButton';

describe('BookmarkButton', () => {
  it('toggles bookmark on click', async () => {
    render(<BookmarkButton articleId="test-123" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
```

**Testing with Context Providers:**

```typescript
import { render } from '@testing-library/react';
import { BookmarksProvider } from './BookmarksProvider';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BookmarksProvider>
      {ui}
    </BookmarksProvider>
  );
};

describe('BookmarkedArticles', () => {
  it('displays bookmarked articles', () => {
    renderWithProviders(<BookmarkedArticles />);
    // Test assertions
  });
});
```

---

## API Integration Tests

Test API routes with Vitest:

```typescript
// src/__tests__/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {
  describe('GET /api/news', () => {
    it('returns articles array', async () => {
      const res = await fetch(`${API_URL}/api/news`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.articles)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const res = await fetch(`${API_URL}/api/news?limit=5`);
      const data = await res.json();

      expect(data.articles.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await fetch(`${API_URL}/api/health`);
      const data = await res.json();

      expect(data.status).toBe('healthy');
    });
  });
});
```

---

## E2E Testing (Playwright)

### Setup

```bash
# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed
```

### Configuration

See [playwright.config.ts](https://github.com/nirholas/free-crypto-news/blob/main/playwright.config.ts):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Writing E2E Tests

**Page Navigation:**

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and displays news', async ({ page }) => {
    await page.goto('/');
    
    // Wait for news to load
    await expect(page.locator('article').first()).toBeVisible();
    
    // Check header
    await expect(page.locator('h1')).toContainText('Crypto News');
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Click trending
    await page.click('a[href="/trending"]');
    await expect(page).toHaveURL('/trending');
    
    // Click sources
    await page.click('a[href="/sources"]');
    await expect(page).toHaveURL('/sources');
  });
});
```

**Testing Search:**

```typescript
test('search functionality', async ({ page }) => {
  await page.goto('/');
  
  // Open search
  await page.click('[data-testid="search-button"]');
  
  // Type query
  await page.fill('input[type="search"]', 'bitcoin');
  await page.press('input[type="search"]', 'Enter');
  
  // Check results
  await expect(page).toHaveURL(/\/search\?q=bitcoin/);
  await expect(page.locator('article')).toHaveCount({ minimum: 1 });
});
```

**Testing API Responses:**

```typescript
// e2e/api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/news returns valid response', async ({ request }) => {
    const response = await request.get('/api/news');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBe(true);
  });

  test('GET /api/health returns healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    const data = await response.json();
    
    expect(data.status).toBe('healthy');
  });
});
```

**Visual Regression Testing:**

```typescript
test('homepage visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

---

## Storybook

### Setup

```bash
# Start Storybook dev server
npm run storybook

# Build static Storybook
npm run build-storybook
```

### Writing Stories

**Basic Story:**

```typescript
// src/components/LoadingSpinner.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};
```

**Interactive Story:**

```typescript
// src/components/BookmarkButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { BookmarkButton } from './BookmarkButton';
import { BookmarksProvider } from './BookmarksProvider';

const meta: Meta<typeof BookmarkButton> = {
  title: 'Actions/BookmarkButton',
  component: BookmarkButton,
  decorators: [
    (Story) => (
      <BookmarksProvider>
        <Story />
      </BookmarksProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    articleId: 'test-article-1',
  },
};

export const Bookmarked: Story = {
  args: {
    articleId: 'test-bookmarked',
    initialBookmarked: true,
  },
};
```

**Story with Mock Data:**

```typescript
// src/components/ArticleCards.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ArticleCards } from './ArticleCards';

const mockArticles = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High',
    description: 'BTC surpasses $100,000 for the first time...',
    link: 'https://example.com/article-1',
    source: 'CoinDesk',
    pubDate: new Date().toISOString(),
  },
  // More articles...
];

const meta: Meta<typeof ArticleCards> = {
  title: 'Content/ArticleCards',
  component: ArticleCards,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    articles: mockArticles,
  },
};

export const Loading: Story = {
  args: {
    articles: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    articles: [],
    loading: false,
  },
};
```

---

## Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates:
- Terminal summary
- HTML report in `coverage/`
- JSON report for CI integration

### Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | > 70% |
| Branches | > 60% |
| Functions | > 70% |
| Lines | > 70% |

### View HTML Report

```bash
npm run test:coverage
open coverage/index.html
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test File Structure

```
/
├── vitest.config.ts          # Vitest configuration
├── vitest.setup.ts           # Test setup & mocks
├── playwright.config.ts      # Playwright configuration
├── .storybook/
│   ├── main.ts              # Storybook config
│   └── preview.tsx          # Preview settings
├── src/
│   ├── lib/
│   │   ├── alerts.ts
│   │   ├── alerts.test.ts   # Unit tests alongside source
│   │   └── ...
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Header.test.tsx  # Component tests
│   │   ├── Header.stories.tsx # Storybook stories
│   │   └── ...
│   └── __tests__/
│       └── api.test.ts      # API integration tests
└── e2e/
    ├── home.spec.ts         # E2E tests
    └── api.spec.ts
```

---

## Best Practices

### Do's

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests focused and small
- ✅ Use data-testid for E2E selectors
- ✅ Mock external dependencies
- ✅ Test edge cases and error states

### Don'ts

- ❌ Test third-party libraries
- ❌ Write tests that depend on execution order
- ❌ Use hardcoded timeouts (use waitFor)
- ❌ Test implementation details
- ❌ Duplicate tests across layers

---

## Troubleshooting

### Tests failing locally but passing in CI

Check for:
- Environment variables differences
- Time zone issues (use UTC)
- Flaky async tests (add proper waits)

### Storybook not loading

```bash
rm -rf node_modules/.cache/storybook
npm run storybook
```

### Playwright browsers not installed

```bash
npx playwright install --with-deps
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Storybook Documentation](https://storybook.js.org/docs)
