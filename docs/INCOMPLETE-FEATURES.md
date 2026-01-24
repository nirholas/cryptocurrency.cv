# Incomplete Features & TODOs

This document tracks features that are not yet fully implemented or still use mock/placeholder data.

**Last Updated:** January 24, 2026

---

## ✅ Recently Fixed

### 1. Export API (`src/app/api/export/route.ts`)
**Status:** ✅ FIXED - Uses real data sources
- Now uses `getLatestNews()` for real news articles
- Uses `getTopCoins()` for real market data
- Uses `getRecentPredictions()` for real predictions
- Uses `getSocialTrends()` for real social metrics

---

### 2. Social Metrics Service (`src/lib/social/metrics.ts`)
**Status:** ✅ FIXED - Returns null/empty when API keys not configured
- Removed mock data fallbacks
- Returns `null` for missing metrics instead of fake data
- Returns empty array for trends when API keys not set
- UI should handle empty states appropriately

---

### 3. Admin License Panel (`src/app/[locale]/admin/AdminLicensePanel.tsx`)
**Status:** ✅ FIXED - Now uses real API data
- Removed second useEffect that overwrote API data with mock
- Now exclusively uses `/api/admin/licenses` endpoint
- Endpoint uses Vercel KV for real data storage

---

### 4. Premium Whale Tracking (`src/lib/premium-whales.ts`)
**Status:** ✅ FIXED - Uses real blockchain APIs
- Replaced `generateMockWhaleTransactions()` with real Blockchair/Etherscan API calls
- `analyzeWallet()` now fetches real balance and transaction data from Etherscan
- `getSmartMoney()` derives insights from real whale transaction data

---

### 5. Watchlist Feature
**Status:** ✅ ALREADY IMPLEMENTED
- Full implementation in `src/lib/watchlist.ts`
- WatchlistProvider context in `src/components/watchlist/`
- Dedicated watchlist page at `/watchlist`
- Uses localStorage for persistence
- Integrated in coin pages via `handleWatchlistToggle`

---

### 6. Price Alerts Feature
**Status:** ✅ ALREADY IMPLEMENTED
- Full implementation in `src/lib/alerts.ts`
- API endpoints at `/api/alerts` (GET, POST, DELETE)
- Supports price threshold and keyword alerts
- In-memory storage (use external DB for production persistence)
- Integrated in coin pages via `handleCreateAlert`

---

## 🟡 Medium Priority - Remaining Items

### 1. Export Service Formats (`src/lib/exports/service.ts`)
**Status:** Parquet and SQLite formats are placeholders
- Parquet format needs `parquet-wasm` integration
- SQLite format needs `sql.js` integration
- JSON and CSV formats work correctly

**Fix Required:** Install and integrate format libraries for Parquet and SQLite.

---

### 2. Alerts Persistence
**Status:** Alerts use in-memory storage
- Works for demo/development
- Data lost on server restart

**Fix Required:** Integrate with Vercel KV or external database for persistent storage.

------

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
