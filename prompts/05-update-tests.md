# Prompt 05: Update Tests for Source Cleanup and Quality Filter

## Goal
Fix all broken tests after the source removals (prompt 01) and add new tests for the quality filter (prompt 02) and tier metadata (prompt 03).

## Context
After prompts 01-04, the following test files will have failures:
- `src/lib/source-tiers.test.ts` — references `tier4`, `fintech`, `finextra`, `pymnts` which no longer exist
- `src/__tests__/validation.test.ts` — `newsQuerySchema` now has `quality` param and no `fintech` category
- Any other test files that reference removed sources

## Changes

### 1. `src/lib/source-tiers.test.ts` — Update for removed tiers

**Update the `SourceTier` type test** (around line 43):
- Change the `validTiers` array from `['tier1', 'tier2', 'tier3', 'tier4', 'research', 'fintech']` to `['tier1', 'tier2', 'tier3', 'research']`

**Remove the fintech credibility comparison test** (around line 66-76):
- Delete the `it('fintech sources have lower credibility than tier1')` test entirely — there are no fintech sources anymore

**Update `getSourceTier` tests** (around line 160-170):
- Remove: `it('returns fintech for fintech sources', () => { expect(getSourceTier('finextra')).toBe('fintech'); })`
- Add: `it('returns null for removed sources', () => { expect(getSourceTier('finextra')).toBeNull(); expect(getSourceTier('coinedition')).toBeNull(); })`

**Remove or rewrite the entire `isFintechSource` describe block** (around line 178-199):
- If `isFintechSource` was removed from the codebase entirely: delete the entire describe block and remove it from the imports
- If `isFintechSource` was kept (checking for legacy data): update it to return false for everything since no fintech sources exist in SOURCE_TIERS

**Add new tests for `sourcePassesQuality` and `getTiersForQuality`** (new helper functions from prompt 02):

```typescript
import { sourcePassesQuality, getTiersForQuality } from '@/lib/source-tiers';

describe('getTiersForQuality', () => {
  it('returns all tiers for undefined/all', () => {
    const tiers = getTiersForQuality();
    expect(tiers.has('tier1')).toBe(true);
    expect(tiers.has('tier2')).toBe(true);
    expect(tiers.has('tier3')).toBe(true);
    expect(tiers.has('research')).toBe(true);
  });

  it('returns all tiers for "all"', () => {
    const tiers = getTiersForQuality('all');
    expect(tiers.size).toBe(4);
  });

  it('returns tier1+tier2+research for "high"', () => {
    const tiers = getTiersForQuality('high');
    expect(tiers.has('tier1')).toBe(true);
    expect(tiers.has('tier2')).toBe(true);
    expect(tiers.has('research')).toBe(true);
    expect(tiers.has('tier3')).toBe(false);
  });

  it('returns tier1+research for "premium"', () => {
    const tiers = getTiersForQuality('premium');
    expect(tiers.has('tier1')).toBe(true);
    expect(tiers.has('research')).toBe(true);
    expect(tiers.has('tier2')).toBe(false);
    expect(tiers.has('tier3')).toBe(false);
  });
});

describe('sourcePassesQuality', () => {
  it('bloomberg passes all quality levels', () => {
    expect(sourcePassesQuality('bloomberg')).toBe(true);
    expect(sourcePassesQuality('bloomberg', 'all')).toBe(true);
    expect(sourcePassesQuality('bloomberg', 'high')).toBe(true);
    expect(sourcePassesQuality('bloomberg', 'premium')).toBe(true);
  });

  it('coindesk (tier2) passes high but not premium', () => {
    expect(sourcePassesQuality('coindesk', 'high')).toBe(true);
    expect(sourcePassesQuality('coindesk', 'premium')).toBe(false);
  });

  it('cointelegraph (tier3) only passes all/undefined', () => {
    expect(sourcePassesQuality('cointelegraph')).toBe(true);
    expect(sourcePassesQuality('cointelegraph', 'all')).toBe(true);
    expect(sourcePassesQuality('cointelegraph', 'high')).toBe(false);
    expect(sourcePassesQuality('cointelegraph', 'premium')).toBe(false);
  });

  it('messari (research) passes all quality levels', () => {
    expect(sourcePassesQuality('messari', 'premium')).toBe(true);
    expect(sourcePassesQuality('messari', 'high')).toBe(true);
  });

  it('unknown source passes unless premium', () => {
    expect(sourcePassesQuality('unknownsource')).toBe(true);
    expect(sourcePassesQuality('unknownsource', 'high')).toBe(true);
    expect(sourcePassesQuality('unknownsource', 'premium')).toBe(false);
  });
});
```

### 2. `src/__tests__/validation.test.ts` — Update schema tests

**Add a test for the quality parameter:**
```typescript
it('should validate quality parameter', () => {
  const valid = newsQuerySchema.safeParse({ quality: 'high' });
  expect(valid.success).toBe(true);
  
  const premium = newsQuerySchema.safeParse({ quality: 'premium' });
  expect(premium.success).toBe(true);
  
  const invalid = newsQuerySchema.safeParse({ quality: 'ultra' });
  expect(invalid.success).toBe(false);
});
```

**Add a test that `fintech` category is rejected** (if it was removed from the enum):
```typescript
it('should reject fintech category', () => {
  const result = newsQuerySchema.safeParse({ category: 'fintech' });
  expect(result.success).toBe(false);
});
```

### 3. Any other test files referencing removed sources

Run `grep -r "finextra\|pymnts\|fintechfutures\|coinedition\|bitcoinworld\|invezz\|zycrypto\|dailycoin\|coinpedia\|coingape\|blockonomi\|thecoinrepublic\|ambcrypto\|cryptopotato\|cryptonews" src/ --include="*.test.*"` to find any remaining test references. Update or remove them.

## Verification
- `bun run test` — all tests pass
- `bun run build` — no type errors
- No references to removed sources in test files

## Commit message
`test: update tests for source cleanup and quality filter`
