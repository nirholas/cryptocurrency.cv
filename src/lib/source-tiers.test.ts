/**
 * Tests for lib/source-tiers.ts
 * Covers SOURCE_TIERS data integrity, helper functions, derived records
 */

import { describe, it, expect } from 'vitest';
import {
  SOURCE_TIERS,
  DEFAULT_CREDIBILITY,
  DEFAULT_REPUTATION,
  getSourceCredibility,
  getSourceReputation,
  getSourceTier,
  isFintechSource,
  SOURCE_REPUTATION_SCORES,
  SOURCE_CREDIBILITY,
  type SourceTier,
} from '@/lib/source-tiers';

// ---------------------------------------------------------------------------
// SOURCE_TIERS data integrity
// ---------------------------------------------------------------------------

describe('SOURCE_TIERS catalog', () => {
  it('contains more than 20 sources', () => {
    expect(Object.keys(SOURCE_TIERS).length).toBeGreaterThan(20);
  });

  it('every entry has required fields with correct types', () => {
    const validTiers: SourceTier[] = ['tier1', 'tier2', 'tier3', 'tier4', 'research', 'fintech'];
    for (const [key, entry] of Object.entries(SOURCE_TIERS)) {
      expect(validTiers).toContain(entry.tier);
      expect(typeof entry.displayName).toBe('string');
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.credibility).toBeGreaterThanOrEqual(0);
      expect(entry.credibility).toBeLessThanOrEqual(1);
      expect(entry.reputation).toBeGreaterThanOrEqual(0);
      expect(entry.reputation).toBeLessThanOrEqual(100);
    }
  });

  it('all source keys are lowercase', () => {
    for (const key of Object.keys(SOURCE_TIERS)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it('flagship sources exist: bloomberg, reuters, coindesk, cointelegraph', () => {
    for (const src of ['bloomberg', 'reuters', 'coindesk', 'cointelegraph']) {
      expect(SOURCE_TIERS[src], `${src} not found`).toBeDefined();
    }
  });

  it('bloomberg is tier1 with high credibility', () => {
    expect(SOURCE_TIERS['bloomberg'].tier).toBe('tier1');
    expect(SOURCE_TIERS['bloomberg'].credibility).toBeGreaterThanOrEqual(0.90);
    expect(SOURCE_TIERS['bloomberg'].reputation).toBe(100);
  });

  it('fintech sources have lower credibility than tier1', () => {
    const fintech = Object.values(SOURCE_TIERS).filter(e => e.tier === 'fintech');
    const tier1 = Object.values(SOURCE_TIERS).filter(e => e.tier === 'tier1');
    const avgFintech = fintech.reduce((s, e) => s + e.credibility, 0) / fintech.length;
    const avgTier1 = tier1.reduce((s, e) => s + e.credibility, 0) / tier1.length;
    expect(avgFintech).toBeLessThan(avgTier1);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_CREDIBILITY / DEFAULT_REPUTATION
// ---------------------------------------------------------------------------

describe('defaults', () => {
  it('DEFAULT_CREDIBILITY is 0.60', () => {
    expect(DEFAULT_CREDIBILITY).toBe(0.60);
  });

  it('DEFAULT_REPUTATION is 50', () => {
    expect(DEFAULT_REPUTATION).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// getSourceCredibility
// ---------------------------------------------------------------------------

describe('getSourceCredibility', () => {
  it('returns the credibility for a known source', () => {
    expect(getSourceCredibility('bloomberg')).toBe(SOURCE_TIERS['bloomberg'].credibility);
  });

  it('is case-insensitive', () => {
    expect(getSourceCredibility('Bloomberg')).toBe(SOURCE_TIERS['bloomberg'].credibility);
    expect(getSourceCredibility('COINDESK')).toBe(SOURCE_TIERS['coindesk'].credibility);
  });

  it('returns DEFAULT_CREDIBILITY for unknown source', () => {
    expect(getSourceCredibility('unknownsource123')).toBe(DEFAULT_CREDIBILITY);
  });

  it('returns a value between 0 and 1 for all known sources', () => {
    for (const key of Object.keys(SOURCE_TIERS)) {
      const cred = getSourceCredibility(key);
      expect(cred).toBeGreaterThanOrEqual(0);
      expect(cred).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// getSourceReputation
// ---------------------------------------------------------------------------

describe('getSourceReputation', () => {
  it('returns reputation for a known source key', () => {
    expect(getSourceReputation('bloomberg')).toBe(SOURCE_TIERS['bloomberg'].reputation);
  });

  it('falls back to display-name match', () => {
    const bloomberg = SOURCE_TIERS['bloomberg'];
    expect(getSourceReputation(bloomberg.displayName)).toBe(bloomberg.reputation);
  });

  it('returns DEFAULT_REPUTATION for unknown source', () => {
    expect(getSourceReputation('totallyfake')).toBe(DEFAULT_REPUTATION);
  });

  it('returns a value 0-100 for all known sources', () => {
    for (const key of Object.keys(SOURCE_TIERS)) {
      const rep = getSourceReputation(key);
      expect(rep).toBeGreaterThanOrEqual(0);
      expect(rep).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// getSourceTier
// ---------------------------------------------------------------------------

describe('getSourceTier', () => {
  it('returns the correct tier for bloomberg', () => {
    expect(getSourceTier('bloomberg')).toBe('tier1');
  });

  it('returns tier2 for coindesk', () => {
    expect(getSourceTier('coindesk')).toBe('tier2');
  });

  it('returns tier3 for cointelegraph', () => {
    expect(getSourceTier('cointelegraph')).toBe('tier3');
  });

  it('returns fintech for fintech sources', () => {
    expect(getSourceTier('finextra')).toBe('fintech');
  });

  it('is case-insensitive', () => {
    expect(getSourceTier('Bloomberg')).toBe('tier1');
  });

  it('returns null for unknown source', () => {
    expect(getSourceTier('unknownsource')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isFintechSource
// ---------------------------------------------------------------------------

describe('isFintechSource', () => {
  it('returns true for finextra', () => {
    expect(isFintechSource('finextra')).toBe(true);
  });

  it('returns true for pymnts', () => {
    expect(isFintechSource('pymnts')).toBe(true);
  });

  it('returns false for bloomberg (tier1)', () => {
    expect(isFintechSource('bloomberg')).toBe(false);
  });

  it('returns false for coindesk (tier2)', () => {
    expect(isFintechSource('coindesk')).toBe(false);
  });

  it('returns false for unknown source not matching fintech keywords', () => {
    expect(isFintechSource('randomnews')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Derived records: SOURCE_REPUTATION_SCORES, SOURCE_CREDIBILITY
// ---------------------------------------------------------------------------

describe('SOURCE_REPUTATION_SCORES', () => {
  it('includes Bloomberg Crypto with reputation 100', () => {
    expect(SOURCE_REPUTATION_SCORES['Bloomberg Crypto']).toBe(100);
  });

  it('has a "default" key', () => {
    expect(SOURCE_REPUTATION_SCORES['default']).toBe(DEFAULT_REPUTATION);
  });

  it('all values are 0-100 numbers', () => {
    for (const [k, v] of Object.entries(SOURCE_REPUTATION_SCORES)) {
      if (k === 'default') continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('SOURCE_CREDIBILITY', () => {
  it('includes bloomberg with correct credibility', () => {
    expect(SOURCE_CREDIBILITY['bloomberg']).toBe(SOURCE_TIERS['bloomberg'].credibility);
  });

  it('has a "default" key', () => {
    expect(SOURCE_CREDIBILITY['default']).toBe(DEFAULT_CREDIBILITY);
  });

  it('all values are 0-1 numbers', () => {
    for (const [k, v] of Object.entries(SOURCE_CREDIBILITY)) {
      if (k === 'default') continue;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
