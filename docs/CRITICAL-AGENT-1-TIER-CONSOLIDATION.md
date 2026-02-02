# 🚨 CRITICAL AGENT 1: Tier Configuration Consolidation

**Mission**: Fix duplicate tier definitions causing inconsistent rate limits across endpoints

**Priority**: CRITICAL - Customers see different rate limits depending on which endpoint they hit

**Estimated Time**: 45 minutes

**Dependencies**: None - can start immediately

---

## 🔥 THE PROBLEM

**You have TWO separate tier configuration objects:**

1. `/src/lib/api-keys.ts` - Lines 97-115: `API_KEY_TIERS`
2. `/src/lib/x402/pricing.ts` - Lines 463-506: `API_TIERS`

**Both define the same tiers but are maintained separately.**

### Current State (BROKEN):

```typescript
// File: src/lib/api-keys.ts
export const API_KEY_TIERS = {
  free: {
    requestsPerDay: 100,
    requestsPerMinute: 10,
  },
  pro: {
    requestsPerDay: 10000,
    requestsPerMinute: 100,
  },
  enterprise: {
    requestsPerDay: -1,
    requestsPerMinute: 1000,
  },
}

// File: src/lib/x402/pricing.ts
export const API_TIERS: Record<string, TierConfig> = {
  free: {
    id: 'free',
    requestsPerDay: 100,
    requestsPerMinute: 10,
    features: [...],
  },
  pro: {
    id: 'pro',
    requestsPerDay: 10000,
    requestsPerMinute: 100,
    features: [...],
  },
  enterprise: {
    id: 'enterprise',
    requestsPerDay: -1,
    requestsPerMinute: 1000,
    features: [...],
  },
}
```

**Impact:**
- Different routes import different configs
- If you update one, the other stays stale
- Customers get inconsistent rate limits
- Support tickets you can't debug

---

## 🎯 THE SOLUTION

**Single Source of Truth**: Keep ONLY `API_TIERS` in `/src/lib/x402/pricing.ts`

### Step 1: Update `/src/lib/api-keys.ts`

**DELETE** lines 97-115 (the entire `API_KEY_TIERS` definition)

**ADD** import and re-export at the top of the file:

```typescript
// File: src/lib/api-keys.ts
// ... existing imports ...
import { API_TIERS } from '@/lib/x402/pricing';

// Re-export as API_KEY_TIERS for backward compatibility
export { API_TIERS as API_KEY_TIERS };

// Now all tier access goes through the same config
```

### Step 2: Find All Imports

Search codebase for imports of `API_KEY_TIERS`:

```bash
grep -r "import.*API_KEY_TIERS" src/
```

**Expected locations:**
- `src/app/api/v1/usage/route.ts`
- `src/app/api/upgrade/route.ts`
- `src/lib/api-keys.ts` (various functions)

### Step 3: Verify No Breaking Changes

These files should continue working because we're re-exporting:

```typescript
// OLD CODE (still works):
import { API_KEY_TIERS } from '@/lib/api-keys';
const tier = API_KEY_TIERS['pro'];

// NEW BEHAVIOR:
// - Imports API_KEY_TIERS (name unchanged)
// - But now it's actually API_TIERS from pricing.ts
// - Zero breaking changes!
```

### Step 4: Update Type References

Find any TypeScript types referencing the old config:

```typescript
// If you see this pattern:
type Tier = keyof typeof API_KEY_TIERS;

// Change to:
import { ApiTier } from '@/lib/x402/pricing';
type Tier = ApiTier;
```

---

## 📝 EXACT FILE CHANGES

### Change 1: `/src/lib/api-keys.ts`

**FIND (lines ~1-20):**
```typescript
import { kv } from '@vercel/kv';
import { sendWebhook, webhookPayloads } from './webhooks';
import {
  checkRateLimit as checkUpstashRateLimit,
  isRedisConfigured,
  type RateLimitResult as UpstashRateLimitResult,
} from './ratelimit';
```

**REPLACE WITH:**
```typescript
import { kv } from '@vercel/kv';
import { sendWebhook, webhookPayloads } from './webhooks';
import {
  checkRateLimit as checkUpstashRateLimit,
  isRedisConfigured,
  type RateLimitResult as UpstashRateLimitResult,
} from './ratelimit';
import { API_TIERS } from '@/lib/x402/pricing';

// Re-export as API_KEY_TIERS for backward compatibility
export { API_TIERS as API_KEY_TIERS };
```

**FIND (lines ~97-125):**
```typescript
// ============================================================================
// Configuration
// ============================================================================

export const API_KEY_TIERS = {
  free: {
    name: 'Free',
    requestsPerDay: 100,
    requestsPerMinute: 10,
    features: ['market:read', 'trending:read', 'search:read'],
  },
  pro: {
    name: 'Pro',
    requestsPerDay: 10000,
    requestsPerMinute: 100,
    features: ['market:read', 'market:premium', 'defi:read', 'historical:read', 'export:json'],
  },
  enterprise: {
    name: 'Enterprise',
    requestsPerDay: -1, // Unlimited
    requestsPerMinute: 1000,
    features: ['*'], // All permissions
  },
} as const;
```

**REPLACE WITH:**
```typescript
// ============================================================================
// Configuration
// ============================================================================

// API_KEY_TIERS is now imported from @/lib/x402/pricing.ts
// This ensures a single source of truth for tier configurations
// See import at top of file: export { API_TIERS as API_KEY_TIERS }
```

### Change 2: Add Validation to `/src/lib/x402/pricing.ts`

**FIND (after API_TIERS definition, around line 508):**
```typescript
export type ApiTier = keyof typeof API_TIERS;
```

**ADD AFTER:**
```typescript
export type ApiTier = keyof typeof API_TIERS;

// Validate tier configuration at module load
Object.entries(API_TIERS).forEach(([tierName, config]) => {
  if (typeof config.requestsPerMinute !== 'number') {
    throw new Error(
      `FATAL: Tier '${tierName}' is missing requestsPerMinute. ` +
      `This will cause rate limiters to fail with NaN limits.`
    );
  }
  if (typeof config.requestsPerDay !== 'number') {
    throw new Error(
      `FATAL: Tier '${tierName}' is missing requestsPerDay. ` +
      `This will cause rate limiters to fail with NaN limits.`
    );
  }
  if (config.requestsPerDay !== -1 && config.requestsPerDay < config.requestsPerMinute) {
    console.warn(
      `WARNING: Tier '${tierName}' has requestsPerDay (${config.requestsPerDay}) ` +
      `less than requestsPerMinute (${config.requestsPerMinute}). This may cause issues.`
    );
  }
});
```

---

## ✅ TESTING CHECKLIST

### Test 1: Verify Import Still Works
```bash
# Run type check
npm run type-check

# Should have ZERO errors related to API_KEY_TIERS
```

### Test 2: Verify Runtime Behavior
```typescript
// Create test file: src/__tests__/tier-consolidation.test.ts
import { API_KEY_TIERS } from '@/lib/api-keys';
import { API_TIERS } from '@/lib/x402/pricing';

describe('Tier Consolidation', () => {
  it('should have API_KEY_TIERS reference same object as API_TIERS', () => {
    expect(API_KEY_TIERS).toBe(API_TIERS);
  });
  
  it('should have all required fields', () => {
    Object.entries(API_KEY_TIERS).forEach(([tier, config]) => {
      expect(config.requestsPerDay).toBeDefined();
      expect(config.requestsPerMinute).toBeDefined();
      expect(typeof config.requestsPerMinute).toBe('number');
    });
  });
});
```

### Test 3: Verify API Routes Work
```bash
# Start dev server
npm run dev

# Test authenticated endpoint
curl -H "X-API-Key: cda_free_test123" http://localhost:3000/api/v1/coins

# Should see rate limit headers
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
```

### Test 4: Check for Breaking Changes
```bash
# Search for any remaining references to old pattern
grep -r "API_KEY_TIERS\[" src/

# All should still work because we re-exported
```

---

## 📊 SUCCESS METRICS

After completion:
- [ ] Only ONE tier definition exists (`API_TIERS` in pricing.ts)
- [ ] `API_KEY_TIERS` still works (re-exported)
- [ ] Zero TypeScript errors
- [ ] All existing routes still work
- [ ] Validation prevents missing fields
- [ ] Tests pass

---

## 🚀 DELIVERABLES

1. ✅ Updated `/src/lib/api-keys.ts` - Import and re-export
2. ✅ Deleted duplicate `API_KEY_TIERS` definition
3. ✅ Added validation to `/src/lib/x402/pricing.ts`
4. ✅ Tests verifying consolidation works
5. ✅ Zero breaking changes to existing code

---

## 💬 WHAT THIS FIXES

**Before:**
- Update `API_TIERS.free.requestsPerMinute = 20`
- Routes using `API_KEY_TIERS` still see `10`
- Customer confused why limits differ
- 2 objects to maintain

**After:**
- Update `API_TIERS.free.requestsPerMinute = 20`
- ALL routes see the change instantly
- Consistent rate limiting everywhere
- 1 object to maintain

---

## 🎯 NEXT STEPS

After Agent 1 completes:
- **Agent 2** will consolidate rate limiting implementations
- **Agent 3** will fix duplicate `getRateLimitHeaders` exports
- **Agent 4** will remove deprecated security vulnerabilities
- **Agent 5** will add monitoring to prevent config drift

---

## 🚨 CRITICAL: DO NOT SKIP VALIDATION

The validation code is ESSENTIAL. It will catch:
- Missing `requestsPerMinute` (causes NaN limits)
- Missing `requestsPerDay` (causes NaN limits)
- Invalid configurations at startup

**This prevents silent failures in production.**

---

## 🚀 READY TO START?

**Agent 1, your mission is simple but critical:**

1. Delete duplicate tier config
2. Add import and re-export
3. Add validation
4. Test everything still works

**This fixes the #1 source of inconsistent rate limiting. Go! 🎯**
