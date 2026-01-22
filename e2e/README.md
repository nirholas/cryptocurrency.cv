# E2E Tests

End-to-end tests using Playwright.

## Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/tests/main.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Coverage

### Homepage Tests
- ✅ Page loads with correct title
- ✅ News articles are displayed
- ✅ Navigation links work
- ✅ Dark mode toggle works
- ✅ Search opens with `/` key

### Article Tests
- ✅ Article page displays content
- ✅ Reading progress bar shows on scroll

### Search Tests
- ✅ Search returns results
- ✅ Autocomplete suggestions appear

### Keyboard Navigation
- ✅ `j/k` keys navigate articles
- ✅ `?` shows keyboard shortcuts help
- ✅ `g+key` navigation shortcuts

### PWA Tests
- ✅ Manifest is present
- ✅ Service worker registers

### API Tests
- ✅ `/api/news` returns articles
- ✅ `/feed.xml` returns RSS feed
- ✅ `/api/health` returns OK

### Accessibility Tests
- ✅ Skip to content link present
- ✅ Proper heading hierarchy
- ✅ Images have alt text

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Crypto News/);
});
```

## CI Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

See `.github/workflows/ci.yml` for configuration.
