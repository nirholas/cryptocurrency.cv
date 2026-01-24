# Feature Migration Guide: FCN ↔ CDA Feature Parity

> **Generated**: January 24, 2026  
> **Purpose**: Comprehensive feature gap analysis and migration implementation guide between Free Crypto News (FCN) and Crypto Data Aggregator (CDA)

---

## Executive Summary

| Metric | FCN | CDA | Gap |
|--------|-----|-----|-----|
| **Pages** | 45 | 49 | +4 CDA |
| **Components** | 113 | 119 | +6 CDA |
| **API Routes** | 104 | 106 | +2 CDA |
| **Library Files** | 68 | 67 | +1 FCN |
| **i18n Locales** | 18 | 0 | +18 FCN |
| **Test Files** | 200 | 4 | +196 FCN |

### Key Differentiators

| Feature | FCN | CDA |
|---------|-----|-----|
| **Internationalization** | ✅ 18 languages | ❌ None |
| **Alpha Signal Engine** | ✅ AI-powered signals | ❌ Missing |
| **DeFi Sub-pages** | ✅ Chain/Protocol routes | ❌ Basic only |
| **Heatmap** | ❌ Missing | ✅ Full implementation |
| **Crypto Calculator** | ❌ Missing | ✅ Full implementation |
| **Gas Tracker** | ❌ Missing | ✅ Full implementation |
| **Screener** | ❌ Missing | ✅ Advanced screener |
| **Correlation Matrix** | ❌ Missing | ✅ Full implementation |
| **Dominance Chart** | ❌ Missing | ✅ Full implementation |
| **Liquidations Feed** | ❌ Missing | ✅ Real-time feed |
| **Social Buzz** | ❌ Missing | ✅ Full implementation |
| **Multiple Data Sources** | ⚠️ Partial | ✅ CoinCap, CoinPaprika |
| **Unit Tests** | ✅ 200 tests | ⚠️ 4 tests |

---

## Section 1: Feature Gap Matrix

### 1.1 Pages Comparison

| Page | FCN Status | CDA Status | Priority | Complexity | Est. Hours |
|------|------------|------------|----------|------------|------------|
| **Heatmap** | ❌ Missing | ✅ Complete | 9 | 6 | 4-6 |
| **Calculator** | ❌ Missing | ✅ Complete | 8 | 5 | 3-4 |
| **Gas Tracker** | ❌ Missing | ✅ Complete | 7 | 5 | 3-4 |
| **Screener** | ❌ Missing | ✅ Complete | 9 | 8 | 6-8 |
| **Correlation** | ❌ Missing | ✅ Complete | 6 | 7 | 4-6 |
| **Dominance** | ❌ Missing | ✅ Complete | 7 | 6 | 4-5 |
| **Liquidations** | ❌ Missing | ✅ Complete | 8 | 7 | 5-6 |
| **Social Buzz** | ❌ Missing | ✅ Complete | 7 | 6 | 4-5 |
| **Install** | ❌ Missing | ✅ Complete | 4 | 2 | 1-2 |
| **Docs/API** | ❌ Missing | ✅ Complete | 5 | 3 | 2-3 |
| **DeFi Chain** | ✅ Complete | ❌ Missing | 8 | 5 | 4-5 |
| **DeFi Protocol** | ✅ Complete | ❌ Missing | 8 | 5 | 4-5 |
| **AI Brief** | ✅ Complete | ❌ Missing | 7 | 4 | 3-4 |
| **AI Counter** | ✅ Complete | ❌ Missing | 6 | 4 | 3-4 |
| **AI Debate** | ✅ Complete | ❌ Missing | 6 | 4 | 3-4 |
| **Analytics Headlines** | ✅ Complete | ❌ Missing | 5 | 4 | 3-4 |
| **i18n (all pages)** | ✅ 18 locales | ❌ None | 10 | 9 | 20-30 |

### 1.2 Components Comparison

| Component | FCN Status | CDA Status | Lines | Priority | Complexity |
|-----------|------------|------------|-------|----------|------------|
| **Heatmap** | ❌ Missing | ✅ Complete | 298 | 9 | 6 |
| **CryptoCalculator** | ❌ Missing | ✅ Complete | 326 | 8 | 5 |
| **GasTracker** | ❌ Missing | ✅ Complete | 195 | 7 | 5 |
| **Screener** | ❌ Missing | ✅ Complete | 525 | 9 | 8 |
| **CorrelationMatrix** | ❌ Missing | ✅ Complete | 251 | 6 | 7 |
| **DominanceChart** | ❌ Missing | ✅ Complete | 252 | 7 | 6 |
| **LiquidationsFeed** | ❌ Missing | ✅ Complete | 220 | 8 | 7 |
| **SocialBuzz** | ❌ Missing | ✅ Complete | 259 | 7 | 6 |
| **LivePrice** | ❌ Missing | ✅ Complete | 147 | 8 | 4 |
| **ExportData** | ❌ Missing | ✅ Complete | 204 | 6 | 4 |
| **CurrencySelector** | ❌ Missing | ✅ Complete | 200 | 5 | 3 |
| **UsageChart** (admin) | ❌ Missing | ✅ Complete | ~150 | 4 | 4 |
| **LanguageSwitcher** | ✅ Complete | ❌ Missing | ~100 | 10 | 3 |
| **X402PaymentButton** | ✅ Complete | ❌ Missing | ~150 | 5 | 4 |
| **HeaderNew** | ✅ Complete | ❌ Missing | ~200 | 3 | 3 |

### 1.3 Library Functions Comparison

| Library | FCN Status | FCN Lines | CDA Status | CDA Lines | Priority |
|---------|------------|-----------|------------|-----------|----------|
| **alpha-signal-engine** | ✅ | 293 | ❌ | - | 9 |
| **international-sources** | ✅ | 611 | ❌ | - | 8 |
| **source-translator** | ✅ | 402 | ❌ | - | 8 |
| **translate** | ✅ | 281 | ❌ | - | 9 |
| **coincap** | ❌ | - | ✅ | 236 | 7 |
| **coinpaprika** | ❌ | - | ✅ | 335 | 7 |
| **defi-yields** | ❌ | - | ✅ | 265 | 6 |
| **bitcoin-onchain** | ❌ | - | ✅ | 393 | 5 |
| **price-websocket** | ❌ | - | ✅ | 406 | 8 |
| **market-data** | ✅ | 1836 | ✅ | 1719 | - |
| **cache** | ✅ | 174 | ✅ | 175 | - |
| **alerts** | ✅ | 883 | ✅ | 883 | - |
| **portfolio** | ✅ | 349 | ✅ | 349 | - |
| **webhooks** | ✅ | 405 | ✅ | 833 | - |
| **websocket** | ✅ | 289 | ✅ | 289 | - |
| **x402** | ✅ | 705 | ✅ | 725 | - |
| **binance** | ✅ | 461 | ✅ | 461 | - |

### 1.4 API Routes Gap

| API Route | FCN | CDA | Notes |
|-----------|-----|-----|-------|
| `/api/v1/usage` | ❌ | ✅ | Admin usage tracking |
| `/api/register` | ❌ | ✅ | User registration |
| `/api/cron/expire-subscriptions` | ❌ | ✅ | Subscription management |
| `/api/webhooks/test` | ❌ | ✅ | Webhook testing |
| `/api/news/international` | ✅ | ❌ | International news sources |
| `/api/openapi.json` | ✅ | ❌ | OpenAPI spec endpoint |
| `/api/i18n/translate` | ✅ | ❌ | Translation API |

---

## Section 2: FCN → CDA Migration Tasks

### 2.1 Complete i18n System

**Priority**: 10/10 | **Complexity**: 9/10 | **Estimated Hours**: 20-30

- [ ] **Install next-intl dependency**
  ```bash
  npm install next-intl
  ```

- [ ] **Create message files**
  - Files to create: `messages/{en,es,fr,de,pt,ja,zh-CN,zh-TW,ko,ar,ru,it,nl,pl,tr,vi,th,id}.json`
  - Copy structure from FCN's `messages/en.json` as template

- [ ] **Create i18n configuration**
  - `src/i18n/config.ts`:
    ```typescript
    export const locales = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN', 'zh-TW', 'ko', 'ar', 'ru', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'] as const;
    export const defaultLocale = 'en';
    export type Locale = (typeof locales)[number];
    ```
  - `src/i18n/index.ts`
  - `src/i18n/navigation.ts`
  - `src/i18n/request.ts`

- [ ] **Update middleware.ts**
  ```typescript
  import createMiddleware from 'next-intl/middleware';
  import { locales, defaultLocale } from './i18n/config';
  
  export default createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed'
  });
  ```

- [ ] **Restructure app directory**
  - Move `src/app/*` to `src/app/[locale]/*`
  - Update all page imports to use `useTranslations`

- [ ] **Create LanguageSwitcher component**
  - Copy from FCN: `src/components/LanguageSwitcher.tsx`
  - Add to Header component

- [ ] **Testing requirements**
  - Test all 18 locales load correctly
  - Test RTL support for Arabic
  - Test CJK character rendering

### 2.2 DeFi Sub-pages (Chain/Protocol)

**Priority**: 8/10 | **Complexity**: 5/10 | **Estimated Hours**: 8-10

- [ ] **Create chain detail page**
  - File: `src/app/defi/chain/[slug]/page.tsx`
  - API: Already exists via `/api/market/defi`

- [ ] **Create protocol detail page**
  - File: `src/app/defi/protocol/[slug]/page.tsx`
  - Uses DeFiLlama API integration

- [ ] **Config changes**
  - Add routes to navigation config
  - Add SEO metadata generation

### 2.3 Alpha Signal Engine

**Priority**: 9/10 | **Complexity**: 7/10 | **Estimated Hours**: 8-10

- [ ] **Copy library file**
  - Source: FCN `src/lib/alpha-signal-engine.ts` (293 lines)
  - Target: CDA `src/lib/alpha-signal-engine.ts`

- [ ] **Copy hook**
  - Source: FCN `src/hooks/useAlphaSignals.ts`
  - Target: CDA `src/hooks/useAlphaSignals.ts`

- [ ] **Create API route**
  - File: `src/app/api/signals/route.ts`

- [ ] **Dependencies**
  - Technical indicators library
  - Market data integration

### 2.4 Unit Test Patterns

**Priority**: 8/10 | **Complexity**: 4/10 | **Estimated Hours**: 10-15

- [ ] **Copy test setup files**
  - `vitest.setup.ts`
  - `vitest.config.ts` updates

- [ ] **Copy test utilities**
  - Test mocks for market data
  - Component testing helpers

- [ ] **Create test templates**
  - Component tests (React Testing Library)
  - API route tests
  - Library function tests

---

## Section 3: CDA → FCN Migration Tasks

### 3.1 Heatmap Page

**Priority**: 9/10 | **Complexity**: 6/10 | **Estimated Hours**: 4-6

- [ ] **Copy component**
  - Source: CDA `src/components/Heatmap.tsx` (298 lines)
  - Target: FCN `src/components/Heatmap.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/heatmap/page.tsx`
  ```typescript
  import { getTranslations } from 'next-intl/server';
  import { Heatmap } from '@/components/Heatmap';
  import { getTopCoins } from '@/lib/market-data';
  
  export async function generateMetadata({ params: { locale } }) {
    const t = await getTranslations({ locale, namespace: 'heatmap' });
    return {
      title: t('title'),
      description: t('description'),
    };
  }
  
  export default async function HeatmapPage() {
    const coins = await getTopCoins(100, '7d');
    return <Heatmap coins={coins} />;
  }
  ```

- [ ] **Add i18n messages**
  ```json
  // messages/en.json
  {
    "heatmap": {
      "title": "Crypto Heatmap",
      "description": "Visual market cap and price change heatmap",
      "timeframe": {
        "24h": "24 Hours",
        "7d": "7 Days"
      },
      "sortBy": {
        "marketCap": "Market Cap",
        "change": "Price Change"
      }
    }
  }
  ```

- [ ] **Add navigation link**
  - Update `src/components/navigation.ts`

- [ ] **Testing**
  - Component unit tests
  - E2E test for page load

### 3.2 Crypto Calculator

**Priority**: 8/10 | **Complexity**: 5/10 | **Estimated Hours**: 3-4

- [ ] **Copy component**
  - Source: CDA `src/components/CryptoCalculator.tsx` (326 lines)
  - Target: FCN `src/components/CryptoCalculator.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/calculator/page.tsx`

- [ ] **Add i18n messages**
  ```json
  {
    "calculator": {
      "title": "Crypto Calculator",
      "description": "Convert between cryptocurrencies and fiat currencies",
      "from": "From",
      "to": "To",
      "amount": "Amount",
      "swap": "Swap",
      "result": "Result"
    }
  }
  ```

- [ ] **Dependencies**
  - May need `CurrencySelector.tsx` component

### 3.3 Gas Tracker

**Priority**: 7/10 | **Complexity**: 5/10 | **Estimated Hours**: 3-4

- [ ] **Copy component**
  - Source: CDA `src/components/GasTracker.tsx` (195 lines)
  - Target: FCN `src/components/GasTracker.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/gas/page.tsx`

- [ ] **Verify API**
  - Ensure `/api/v1/gas` exists and returns gas prices

- [ ] **Add i18n messages**
  ```json
  {
    "gas": {
      "title": "Gas Tracker",
      "description": "Real-time Ethereum gas prices",
      "slow": "Slow",
      "standard": "Standard", 
      "fast": "Fast",
      "gwei": "Gwei"
    }
  }
  ```

### 3.4 Correlation Matrix

**Priority**: 6/10 | **Complexity**: 7/10 | **Estimated Hours**: 4-6

- [ ] **Copy component**
  - Source: CDA `src/components/CorrelationMatrix.tsx` (251 lines)
  - Target: FCN `src/components/CorrelationMatrix.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/correlation/page.tsx`

- [ ] **API requirements**
  - Historical price data for correlation calculation
  - May need new API endpoint for correlation data

- [ ] **Add i18n messages**

### 3.5 Dominance Chart

**Priority**: 7/10 | **Complexity**: 6/10 | **Estimated Hours**: 4-5

- [ ] **Copy component**
  - Source: CDA `src/components/DominanceChart.tsx` (252 lines)
  - Target: FCN `src/components/DominanceChart.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/dominance/page.tsx`

- [ ] **API requirements**
  - Global market data with dominance percentages
  - Uses CoinGecko global endpoint

### 3.6 Liquidations Feed

**Priority**: 8/10 | **Complexity**: 7/10 | **Estimated Hours**: 5-6

- [ ] **Copy component**
  - Source: CDA `src/components/LiquidationsFeed.tsx` (220 lines)
  - Target: FCN `src/components/LiquidationsFeed.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/liquidations/page.tsx`

- [ ] **API requirements**
  - WebSocket or SSE for real-time liquidation data
  - External data source (Coinalyze, etc.)

### 3.7 Screener

**Priority**: 9/10 | **Complexity**: 8/10 | **Estimated Hours**: 6-8

- [ ] **Copy component**
  - Source: CDA `src/components/Screener.tsx` (525 lines)
  - Target: FCN `src/components/Screener.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/screener/page.tsx`

- [ ] **API requirements**
  - Already exists: `/api/premium/analytics/screener`
  - Filtering and sorting capabilities

- [ ] **Add i18n messages**
  ```json
  {
    "screener": {
      "title": "Crypto Screener",
      "filters": {
        "marketCap": "Market Cap",
        "volume": "Volume",
        "priceChange": "Price Change",
        "category": "Category"
      }
    }
  }
  ```

### 3.8 Social Buzz

**Priority**: 7/10 | **Complexity**: 6/10 | **Estimated Hours**: 4-5

- [ ] **Copy component**
  - Source: CDA `src/components/SocialBuzz.tsx` (259 lines)
  - Target: FCN `src/components/SocialBuzz.tsx`

- [ ] **Create page**
  - File: `src/app/[locale]/buzz/page.tsx`

- [ ] **API requirements**
  - Social sentiment data
  - LunarCrush or similar API integration

### 3.9 LivePrice Component

**Priority**: 8/10 | **Complexity**: 4/10 | **Estimated Hours**: 2-3

- [ ] **Copy component**
  - Source: CDA `src/components/LivePrice.tsx` (147 lines)
  - Target: FCN `src/components/LivePrice.tsx`

- [ ] **Integration points**
  - Add to coin detail pages
  - Add to header price ticker

- [ ] **Dependencies**
  - WebSocket price stream (Binance)
  - Already have: `src/lib/binance.ts`

### 3.10 Export Functionality

**Priority**: 6/10 | **Complexity**: 4/10 | **Estimated Hours**: 2-3

- [ ] **Copy component**
  - Source: CDA `src/components/ExportData.tsx` (204 lines)
  - Target: FCN `src/components/ExportData.tsx`

- [ ] **Integration points**
  - Portfolio page
  - Watchlist page
  - Market data tables

### 3.11 Multiple Data Sources

**Priority**: 7/10 | **Complexity**: 5/10 | **Estimated Hours**: 4-6

- [ ] **Copy CoinCap integration**
  - Source: CDA `src/lib/coincap.ts` (236 lines)
  - Target: FCN `src/lib/coincap.ts`

- [ ] **Copy CoinPaprika integration**
  - Source: CDA `src/lib/coinpaprika.ts` (335 lines)
  - Target: FCN `src/lib/coinpaprika.ts`

- [ ] **Copy additional data sources**
  - `defi-yields.ts` (265 lines)
  - `bitcoin-onchain.ts` (393 lines)
  - `price-websocket.ts` (406 lines)

- [ ] **Update market-data.ts**
  - Add fallback logic for API failures
  - Implement data source priority

---

## Section 4: Implementation Order

### Phase 1: Quick Wins (< 2 hours each)

| # | Task | Target | Hours | Dependencies |
|---|------|--------|-------|--------------|
| 1 | LivePrice component | FCN | 2 | Binance WebSocket |
| 2 | ExportData component | FCN | 2 | None |
| 3 | Install page | FCN | 1 | None |
| 4 | CurrencySelector component | FCN | 2 | None |
| 5 | Docs/API page | FCN | 2 | None |
| **Total** | | | **9 hours** | |

### Phase 2: Medium Complexity (2-8 hours each)

| # | Task | Target | Hours | Dependencies |
|---|------|--------|-------|--------------|
| 1 | Heatmap page + component | FCN | 5 | Market data API |
| 2 | Crypto Calculator | FCN | 4 | CurrencySelector |
| 3 | Gas Tracker | FCN | 4 | Gas API |
| 4 | Dominance Chart | FCN | 5 | Global market API |
| 5 | Social Buzz | FCN | 5 | Social APIs |
| 6 | CoinCap integration | FCN | 3 | None |
| 7 | CoinPaprika integration | FCN | 3 | None |
| 8 | DeFi Chain pages | CDA | 5 | DeFiLlama API |
| 9 | DeFi Protocol pages | CDA | 5 | DeFiLlama API |
| 10 | AI Brief/Counter/Debate pages | CDA | 6 | Groq API |
| **Total** | | | **45 hours** | |

### Phase 3: Complex Features (8+ hours each)

| # | Task | Target | Hours | Dependencies |
|---|------|--------|-------|--------------|
| 1 | Complete i18n system | CDA | 25 | All pages |
| 2 | Screener page + component | FCN | 8 | Multiple filters |
| 3 | Correlation Matrix | FCN | 6 | Historical data |
| 4 | Liquidations Feed | FCN | 6 | Real-time data |
| 5 | Alpha Signal Engine | CDA | 10 | Market analysis |
| 6 | Unit test migration | CDA | 15 | Test framework |
| **Total** | | | **70 hours** | |

---

## Section 5: Estimated Timeline

| Phase | Features | FCN Hours | CDA Hours | Total |
|-------|----------|-----------|-----------|-------|
| **Phase 1** | 5 quick wins | 9 | 0 | 9 |
| **Phase 2** | 10 medium features | 29 | 16 | 45 |
| **Phase 3** | 6 complex features | 20 | 50 | 70 |
| **Total** | 21 features | **58** | **66** | **124** |

### Recommended Sprint Plan

| Sprint | Duration | Focus | Deliverables |
|--------|----------|-------|--------------|
| Sprint 1 | 1 week | Quick Wins | LivePrice, Export, Install, CurrencySelector |
| Sprint 2 | 2 weeks | Data Visualization | Heatmap, Dominance, Calculator |
| Sprint 3 | 2 weeks | Trading Tools | Screener, Gas Tracker, Correlation |
| Sprint 4 | 2 weeks | Real-time Features | Liquidations, Social Buzz, LivePrice integration |
| Sprint 5 | 3 weeks | CDA i18n | Complete internationalization |
| Sprint 6 | 2 weeks | Advanced Features | Alpha Signals, DeFi sub-pages |
| Sprint 7 | 2 weeks | Testing & Polish | Unit tests, E2E tests, bug fixes |

---

## Section 6: Technical Considerations

### 6.1 Breaking Changes to Avoid

- **DO NOT** change existing API response structures
- **DO NOT** modify shared library function signatures
- **DO NOT** alter URL structures for existing pages (affects SEO)
- **DO NOT** remove any existing functionality

### 6.2 Backwards Compatibility Requirements

- All new pages must work with existing navigation
- New components must follow existing design system
- API additions should be additive, not breaking
- i18n implementation must default to English gracefully

### 6.3 Performance Considerations

- **Heatmap**: Virtualize for large coin lists (100+)
- **Screener**: Implement server-side pagination
- **LivePrice**: Use WebSocket connection pooling
- **Correlation Matrix**: Calculate server-side, cache results
- **Liquidations**: Implement windowed updates (last 100 events)

### 6.4 Testing Requirements

| Feature Type | Test Requirements |
|--------------|-------------------|
| Components | Unit tests (React Testing Library), Storybook stories |
| Pages | E2E tests (Playwright), SSR validation |
| API Routes | Integration tests, error handling tests |
| i18n | Locale loading tests, RTL tests, fallback tests |
| Real-time | WebSocket connection tests, reconnection handling |

---

## Section 7: GitHub Issue Templates

### Issue Template: New Page Migration

```markdown
---
name: "[Migration] Add {PageName} Page"
about: Migrate a page from CDA to FCN
labels: migration, enhancement, feature
---

## Summary
Migrate the {PageName} page from CDA to FCN with full i18n support.

## Source
- CDA Path: `src/app/{path}/page.tsx`
- Component: `src/components/{ComponentName}.tsx`
- Lines of code: {X} lines

## Tasks
- [ ] Copy component from CDA
- [ ] Create page at `src/app/[locale]/{path}/page.tsx`
- [ ] Add i18n messages to all 18 locale files
- [ ] Add navigation link
- [ ] Add route to sitemap
- [ ] Write unit tests
- [ ] Write E2E test
- [ ] Update documentation

## API Dependencies
- [ ] {API endpoint 1}
- [ ] {API endpoint 2}

## i18n Keys Required
```json
{
  "{namespace}": {
    "title": "",
    "description": ""
  }
}
```

## Acceptance Criteria
- [ ] Page renders correctly in all 18 locales
- [ ] Page is accessible (WCAG 2.1 AA)
- [ ] Page passes Lighthouse performance audit
- [ ] All tests pass
```

### Issue Template: Component Migration

```markdown
---
name: "[Migration] Add {ComponentName} Component"
about: Migrate a component from CDA to FCN
labels: migration, component
---

## Summary
Migrate the {ComponentName} component from CDA to FCN.

## Source
- CDA Path: `src/components/{ComponentName}.tsx`
- Lines of code: {X} lines

## Tasks
- [ ] Copy component from CDA
- [ ] Update imports for FCN structure
- [ ] Add i18n support using `useTranslations`
- [ ] Add TypeScript types
- [ ] Write unit tests
- [ ] Add Storybook story
- [ ] Document component usage

## Props Interface
```typescript
interface {ComponentName}Props {
  // Define props
}
```

## Usage Example
```tsx
<{ComponentName} prop1="value" />
```

## Acceptance Criteria
- [ ] Component renders correctly
- [ ] Component is accessible
- [ ] Tests pass with >80% coverage
- [ ] Storybook story works
```

### Issue Template: i18n Implementation

```markdown
---
name: "[i18n] Internationalization for CDA"
about: Complete i18n implementation for CDA
labels: i18n, major-feature, breaking-change
---

## Summary
Implement complete internationalization support for CDA using next-intl.

## Scope
- 18 languages: en, es, fr, de, pt, ja, zh-CN, zh-TW, ko, ar, ru, it, nl, pl, tr, vi, th, id
- All 49 pages
- All user-facing components

## Tasks

### Setup
- [ ] Install next-intl
- [ ] Create i18n configuration
- [ ] Set up middleware
- [ ] Create message files

### Migration
- [ ] Restructure app directory to `[locale]`
- [ ] Update all pages to use translations
- [ ] Add LanguageSwitcher component
- [ ] Update navigation

### Translation
- [ ] Extract all strings to en.json
- [ ] Translate to all 18 languages
- [ ] Review translations

### Testing
- [ ] Test all locales load
- [ ] Test RTL (Arabic)
- [ ] Test CJK characters
- [ ] E2E tests for locale switching

## Estimated Hours: 25-30
```

---

## Section 8: Shared Library Unification

### Libraries to Keep Identical

These libraries should be kept in sync between FCN and CDA:

| Library | FCN Lines | CDA Lines | Action |
|---------|-----------|-----------|--------|
| `alerts.ts` | 883 | 883 | ✅ Already identical |
| `portfolio.ts` | 349 | 349 | ✅ Already identical |
| `websocket.ts` | 289 | 289 | ✅ Already identical |
| `binance.ts` | 461 | 461 | ✅ Already identical |
| `cache.ts` | 174 | 175 | ⚠️ Minor diff - sync |
| `market-data.ts` | 1836 | 1719 | ⚠️ FCN has additions - merge |
| `webhooks.ts` | 405 | 833 | ⚠️ CDA has additions - merge |
| `x402.ts` | 705 | 725 | ⚠️ Minor diff - sync |

### Recommended Shared Library Structure

```
shared/
├── alerts.ts
├── binance.ts
├── cache.ts
├── market-data.ts
├── portfolio.ts
├── webhooks.ts
├── websocket.ts
└── x402.ts
```

### Sync Strategy

1. Create a `shared` branch in both repos
2. Use git submodule or npm package for shared code
3. Implement CI check to verify libraries stay in sync
4. Document any intentional divergences

---

## Appendix A: File Mapping Reference

### CDA → FCN Component Mapping

| CDA Component | FCN Target Path | i18n Namespace |
|---------------|-----------------|----------------|
| `Heatmap.tsx` | `src/components/Heatmap.tsx` | `heatmap` |
| `CryptoCalculator.tsx` | `src/components/CryptoCalculator.tsx` | `calculator` |
| `GasTracker.tsx` | `src/components/GasTracker.tsx` | `gas` |
| `Screener.tsx` | `src/components/Screener.tsx` | `screener` |
| `CorrelationMatrix.tsx` | `src/components/CorrelationMatrix.tsx` | `correlation` |
| `DominanceChart.tsx` | `src/components/DominanceChart.tsx` | `dominance` |
| `LiquidationsFeed.tsx` | `src/components/LiquidationsFeed.tsx` | `liquidations` |
| `SocialBuzz.tsx` | `src/components/SocialBuzz.tsx` | `buzz` |
| `LivePrice.tsx` | `src/components/LivePrice.tsx` | `common` |
| `ExportData.tsx` | `src/components/ExportData.tsx` | `common` |
| `CurrencySelector.tsx` | `src/components/CurrencySelector.tsx` | `common` |

### FCN → CDA Library Mapping

| FCN Library | CDA Target Path | Notes |
|-------------|-----------------|-------|
| `alpha-signal-engine.ts` | `src/lib/alpha-signal-engine.ts` | Core AI feature |
| `international-sources.ts` | `src/lib/international-sources.ts` | Requires i18n |
| `source-translator.ts` | `src/lib/source-translator.ts` | Requires i18n |
| `translate.ts` | `src/lib/translate.ts` | Core i18n utility |
| `useAlphaSignals.ts` | `src/hooks/useAlphaSignals.ts` | React hook |

---

## Appendix B: Quick Reference Commands

### Copy Component from CDA to FCN

```bash
# Copy a component
cp /tmp/cda-source/src/components/Heatmap.tsx /workspaces/free-crypto-news/src/components/

# Check diff between library files
diff /workspaces/free-crypto-news/src/lib/cache.ts /tmp/cda-source/src/lib/cache.ts
```

### Generate i18n Message Template

```bash
# Extract component strings (manual process)
grep -h ">[^<]*<" src/components/Heatmap.tsx | sed 's/.*>\([^<]*\)<.*/\1/' | sort -u
```

### Run Tests After Migration

```bash
# Run unit tests
npm run test:run

# Run E2E tests
npm run test:e2e

# Type check
npm run typecheck
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-24 | Agent 5 | Initial comprehensive analysis |

---

*This document was generated as part of the FCN ↔ CDA feature parity analysis. For questions or updates, refer to the project repository.*
