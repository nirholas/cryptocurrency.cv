# Incomplete Features & TODOs

This document tracks features that are not yet fully implemented or still use mock/placeholder data.

**Last Updated:** January 24, 2026

---

## 🔴 High Priority - Features Using Mock Data

### 1. Export API (`src/app/api/export/route.ts`)
**Status:** Uses mock data generators instead of real data sources
- `generateMockNewsData()` - Returns fake news articles
- `generateMockMarketData()` - Returns fake market data
- `generateMockPredictions()` - Returns fake predictions
- `generateMockSocialData()` - Returns fake social metrics

**Fix Required:** Connect to real database/API sources to fetch actual data for export.

---

### 2. Export Service (`src/lib/exports/service.ts`)
**Status:** Uses mock data and placeholder formats
- `fetchDataForExport()` returns simulated data (line 342)
- Parquet format is a placeholder (line 416)
- SQLite format is a placeholder (line 426)

**Fix Required:** 
- Implement actual data fetching from database
- Install and integrate `parquet-wasm` for Parquet output
- Install and integrate `sql.js` for SQLite output

---

### 3. Social Metrics Service (`src/lib/social/metrics.ts`)
**Status:** Falls back to mock data when API keys not configured
- `generateMockMetrics()` function (line 400)
- `generateMockInfluencers()` function (line 430)
- `generateMockTrends()` function (line 446)
- Returns mock data when `LUNARCRUSH_API_KEY` or `SANTIMENT_API_KEY` not set

**Fix Required:** Either require API keys or clearly indicate data is simulated in UI.

---

### 4. Trading Funding Rates (`src/lib/trading/funding-rates.ts`)
**Status:** Uses mock data in development
- `generateMockFundingRates()` function (line 209)
- Falls back to mock when not in production (line 300)
- Historical funding rates are mock only (line 448)

**Fix Required:** Implement real historical data fetching from exchanges.

---

### 5. Trading Arbitrage (`src/lib/trading/arbitrage.ts`)
**Status:** Uses mock prices
- `generateMockPrices()` function (line 173)
- Falls back to mock data (line 166)

**Fix Required:** Integrate real exchange price APIs.

---

### 6. Admin License Panel (`src/app/[locale]/admin/AdminLicensePanel.tsx`)
**Status:** Uses hardcoded mock data
- `mockData` object with fake license/revenue data (line 49)
- No actual API call to fetch real data

**Fix Required:** Create API endpoint `/api/admin/licenses` to fetch real license data from database.

---

## 🟡 Medium Priority - Incomplete Feature Integrations

### 7. Watchlist Feature
**Locations:**
- `src/app/[locale]/coin/[coinId]/CoinPageClient.tsx` (line 138)
  - `// TODO: Integrate with watchlist feature`
- `src/app/[locale]/markets/components/CoinRow.tsx` (line 133)
  - `// TODO: Implement watchlist functionality`

**Fix Required:** 
- Create watchlist database storage (Vercel KV or database)
- Create API endpoints: `/api/watchlist` (GET, POST, DELETE)
- Implement UI state management for watchlist

---

### 8. Price Alerts Feature
**Location:** `src/app/[locale]/coin/[coinId]/CoinPageClient.tsx`
- Line 143: `// TODO: Integrate with price alerts feature`
- Line 372: `// TODO: Implement alert creation`

**Fix Required:**
- Create alerts database storage
- Create API endpoints: `/api/alerts` (GET, POST, DELETE)
- Implement background job for price monitoring
- Add push notification integration

---

### 9. Influencer Storage (Production)
**Location:** `src/app/api/influencers/route.ts` (line 169)
- Comment: `// Note: In production, store in database`

**Status:** Partially fixed - now uses Vercel KV but has in-memory fallback.

**Fix Required:** Ensure Vercel KV is always available in production, or implement PostgreSQL fallback.

---

## 🟢 Low Priority - Documentation/Coming Soon Items

### 10. Coming Soon Features
These are documented as "coming soon" but not yet implemented:

| Feature | Location |
|---------|----------|
| Push notifications | `docs/USER-GUIDE.md` (line 193) |
| Raycast Store publishing | `raycast/README.md` (line 16) |
| Chrome Web Store publishing | `extension/README.md` (line 16) |
| Firefox extension | `extension/README.md` (line 84) |
| PHP SDK Composer package | `sdk/php/README.md` (line 13) |

---

### 11. Analytics Page "Coming Soon" Section
**Location:** `src/app/[locale]/analytics/page.tsx` (lines 149-153)

Contains placeholder "Coming Soon" section that should either be:
- Removed if not planned
- Replaced with actual feature
- Better explained with timeline

---

## 📋 API Keys Required for Full Functionality

The following features require API keys that may not be configured:

| Feature | Environment Variable | Current State |
|---------|---------------------|---------------|
| LunarCrush Social | `LUNARCRUSH_API_KEY` | Falls back to mock |
| Santiment Social | `SANTIMENT_API_KEY` | Falls back to mock |
| Etherscan Whale Alerts | `ETHERSCAN_API_KEY` | Limited without key |
| Discord Bot | `DISCORD_BOT_TOKEN` | Shows disabled |
| Telegram Bot | `TELEGRAM_BOT_TOKEN` | Shows disabled |

---

## ✅ Recently Fixed Items

The following items have been addressed:

- ✅ Portfolio price history API - Now uses real CoinGecko market_chart API
- ✅ FundingRates component - Removed mock fallback, shows proper error state
- ✅ Analytics usage API - Returns proper error when KV not configured
- ✅ Influencer tracker - Migrated to Vercel KV storage
- ✅ Whale alerts API - Uses real Blockchair/Etherscan/Blockchain.info APIs
- ✅ Fear & greed index - Uses real Alternative.me API

---

## 🛠️ Recommended Action Items

### Immediate (Critical for Production)
1. Fix Export API to use real data sources
2. Implement watchlist backend storage
3. Implement price alerts system

### Short Term
4. Remove mock data generators from social metrics
5. Add proper Parquet/SQLite export support
6. Create admin license API endpoint

### Long Term
7. Publish browser extension to stores
8. Publish Raycast extension
9. Add PHP SDK to Packagist
10. Implement push notifications

---

## Notes

- Mock data generators are acceptable for development/demo purposes
- Production deployments should have all required API keys configured
- Consider adding environment checks to warn about missing configurations
