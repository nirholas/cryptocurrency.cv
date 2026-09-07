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

## Whole-site sweeps

Two specs walk every page the app serves. Neither hand-maintains a page list:
both read the routes out of `src/app/[locale]` through `e2e/lib/routes.ts`, so a
page added there is swept the moment it lands.

### `page-health.spec.ts` - is the page actually working?

```bash
npm run build && npm start          # serve a production build
npm run audit:pages                 # sweep it
BASE_URL=https://cryptocurrency.cv npm run audit:pages:prod
```

Per page it asserts that the document answered 2xx, that no error-boundary copy
is on screen, that the main region rendered real content, that no loading
placeholder survives the settle window, that nothing renders `NaN`,
`undefined`, `null` or `Invalid Date`, and that no summary tile reports a zero
money or percentage value.

That last check is the one the console-error scanner cannot make. The homepage
market banner read "Market Cap $0 / 24h Volume $0 / BTC Dominance 0.0%" for
weeks with a completely silent console, because the widget asked `/api/prices`
for `usd_market_cap` and `usd_24h_vol`, which that route did not send, and
summed `undefined` into zero. A page can throw nothing and still be broken.

Data tables and pricing pages are exempt from the zero check on purpose: an
illiquid token really can report no 24h volume, and a free plan really does cost
$0.

### Known slow pages

`/`, `/hub` and `/podcast` can still fail the sweep with a stuck-skeleton or
empty-page finding while being perfectly healthy on their own. All three fan
out to a lot of work per visit: the homepage and hub each issue well over a
dozen API calls (including duplicates of the same endpoint from sibling
widgets), and `/podcast` generates four scripts from the live feed on every
load. Under a parallel sweep they can miss the 10-second window.

Check one with the inspector below before treating it as a defect. If it renders
on its own, the finding is throughput, not breakage, and the fix is to stop the
duplicate fetches rather than to loosen the sweep.

### `console-errors.spec.ts` - did the page throw?

```bash
npm run dev
npm run test:errors                 # all pages
npm run test:errors:page -- /en/markets
```

Console errors, uncaught exceptions, failed requests and page crashes.

### Diagnosing a failure

The sweep names the page and the symptom; `scripts/audit/inspect-page.mjs` names
the widget and the request behind it:

```bash
node scripts/audit/inspect-page.mjs http://localhost:3000/en/hub
```

It prints every API call the page made with its status and a body preview, the
nearest heading above each surviving placeholder, and the element holding each
broken or zero value.

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
