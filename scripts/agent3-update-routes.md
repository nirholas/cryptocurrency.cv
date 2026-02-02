# Agent 3: Route Updates Progress Report

## ✅ Completed Core Infrastructure

### 1. New Files Created
- ✅ `/src/lib/monitoring.ts` - Monitoring utilities for metrics collection
- ✅ `/src/app/api/health/route.ts` - Updated with Agent 3 specification
- ✅ `/src/app/api/metrics/route.ts` - New metrics endpoint

### 2. Routes Updated (3/62)
- ✅ `/src/app/api/summarize/route.ts`
- ✅ `/src/app/api/signals/route.ts`
- ✅ `/src/app/api/ai/summarize/route.ts` (partial)

## 📋 Remaining Routes (59 files)

### Update Pattern for Each File:

1. **Add imports:**
```typescript
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
```

2. **Replace console.error/log:**
```typescript
// OLD:
console.error('Error:', error);

// NEW:
const logger = createRequestLogger('/api/[route-path]');
logger.error('Error description', { error });
```

3. **Replace direct error responses:**
```typescript
// OLD:
return NextResponse.json({ error: 'Message' }, { status: 400 });

// NEW:
return ApiError.badRequest('Message');
```

### Files Needing Updates by Directory:

#### admin/ (5 files)
1. `/src/app/api/admin/route.ts`
2. `/src/app/api/admin/analytics/route.ts`
3. `/src/app/api/admin/keys/route.ts`
4. `/src/app/api/admin/licenses/route.ts`
5. `/src/app/api/admin/stats/route.ts`

#### ai/ (8 files)
6. `/src/app/api/ai/route.ts`
7. `/src/app/api/ai/agent/route.ts`
8. `/src/app/api/ai/brief/route.ts`
9. `/src/app/api/ai/counter/route.ts`
10. `/src/app/api/ai/debate/route.ts`
11. `/src/app/api/ai/entities/route.ts`
12. `/src/app/api/ai/oracle/route.ts`
13. `/src/app/api/ai/relationships/route.ts`

#### analytics/ (9 files)
14. `/src/app/api/analytics/anomalies/route.ts`
15. `/src/app/api/analytics/causality/route.ts`
16. `/src/app/api/analytics/credibility/route.ts`
17. `/src/app/api/analytics/forensics/route.ts`
18. `/src/app/api/analytics/gaps/route.ts`
19. `/src/app/api/analytics/headlines/route.ts`
20. `/src/app/api/analytics/influencers/route.ts`
21. `/src/app/api/analytics/news-onchain/route.ts`
22. `/src/app/api/analytics/usage/route.ts`

#### archive/ (4 files)
23. `/src/app/api/archive/route.ts`
24. `/src/app/api/archive/[id]/route.ts`
25. `/src/app/api/archive/search/route.ts`
26. `/src/app/api/archive/stats/route.ts`

#### billing/ (2 files)
27. `/src/app/api/billing/route.ts`
28. `/src/app/api/billing/checkout/route.ts`

#### citations/ (1 file)
29. `/src/app/api/citations/route.ts`

#### detect/ (1 file)
30. `/src/app/api/detect/route.ts`

#### export/ (3 files)
31. `/src/app/api/export/route.ts`
32. `/src/app/api/export/csv/route.ts`
33. `/src/app/api/export/jobs/[jobId]/route.ts`

#### integrations/ (1 file)
34. `/src/app/api/integrations/route.ts`

#### oracle/ (1 file)
35. `/src/app/api/oracle/route.ts`

#### portfolio/ (5 files)
36. `/src/app/api/portfolio/route.ts`
37. `/src/app/api/portfolio/history/route.ts`
38. `/src/app/api/portfolio/pnl/route.ts`
39. `/src/app/api/portfolio/sync/route.ts`
40. `/src/app/api/portfolio/transactions/route.ts`

#### predictions/ (1 file)
41. `/src/app/api/predictions/route.ts`

#### regulatory/ (1 file)
42. `/src/app/api/regulatory/route.ts`

#### social/ (6 files)
43. `/src/app/api/social/route.ts`
44. `/src/app/api/social/leaderboard/route.ts`
45. `/src/app/api/social/mentions/route.ts`
46. `/src/app/api/social/sentiment/route.ts`
47. `/src/app/api/social/trending/route.ts`
48. `/src/app/api/social/volume/route.ts`

#### stats/ (1 file)
49. `/src/app/api/stats/route.ts`

#### trading/ (3 files)
50. `/src/app/api/trading/route.ts`
51. `/src/app/api/trading/arbitrage/route.ts`
52. `/src/app/api/trading/signals/route.ts`

#### tradingview/ (1 file)
53. `/src/app/api/tradingview/route.ts`

#### watchlist/ (1 file)
54. `/src/app/api/watchlist/route.ts`

#### webhooks/ (4 files)
55. `/src/app/api/webhooks/route.ts`
56. `/src/app/api/webhooks/coinbase/route.ts`
57. `/src/app/api/webhooks/stripe/route.ts`
58. `/src/app/api/webhooks/verify/route.ts`

#### whale-alerts/ (1 file)
59. `/src/app/api/whale-alerts/route.ts`

## 🔧 Common Error Types to Replace

### ApiError Methods Available:
```typescript
ApiError.badRequest(message)           // 400
ApiError.unauthorized(message)         // 401
ApiError.forbidden(message)            // 403
ApiError.notFound(message)             // 404
ApiError.conflict(message)             // 409
ApiError.rateLimit(message, retryAfter)// 429
ApiError.internal(message, error)      // 500
ApiError.serviceUnavailable(message)   // 503
```

### Logger Methods Available:
```typescript
const logger = createRequestLogger('/api/path');

logger.debug(message, data)   // Development only
logger.info(message, data)    // General info
logger.warn(message, data)    // Warnings
logger.error(message, data)   // Errors
```

## ✅ Testing Checklist

After completing all updates:

1. **Health endpoint:** `curl http://localhost:3000/api/health`
2. **Metrics endpoint:** `curl -H "X-Admin-Key: $ADMIN_API_KEY" http://localhost:3000/api/metrics`
3. **Verify no console.log/error:** `grep -r "console\.(log|error)" src/app/api/`
4. **Verify all use ApiError:** `grep -r "ApiError" src/app/api/ | wc -l`
5. **Run tests:** `npm test`
6. **Check for errors:** `npm run build`

## 📊 Progress Tracking

- Core infrastructure: ✅ 100% (4/4)
- Route updates: 🔄 5% (3/62)
- Testing: ⏳ Pending
- Documentation: ✅ Complete

## 🚀 Next Steps

1. Continue updating remaining 59 routes following the pattern above
2. Test each updated route
3. Run full test suite
4. Verify metrics collection works
5. Update CHANGELOG with Agent 3 completion
