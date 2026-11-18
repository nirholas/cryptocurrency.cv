/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

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
  sourcePassesQuality,
  getTiersForQuality,
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
    const validTiers: SourceTier[] = ['tier1', 'tier2', 'tier3', 'research'];
    for (const entry of Object.values(SOURCE_TIERS)) {
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
    expect(SOURCE_TIERS['bloomberg'].credibility).toBeGreaterThanOrEqual(0.9);
    expect(SOURCE_TIERS['bloomberg'].reputation).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_CREDIBILITY / DEFAULT_REPUTATION
// ---------------------------------------------------------------------------

describe('defaults', () => {
  it('DEFAULT_CREDIBILITY is 0.60', () => {
    expect(DEFAULT_CREDIBILITY).toBe(0.6);
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

  it('returns null for removed sources', () => {
    expect(getSourceTier('finextra')).toBeNull();
    expect(getSourceTier('coinedition')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getSourceTier('Bloomberg')).toBe('tier1');
  });

  it('returns null for unknown source', () => {
    expect(getSourceTier('unknownsource')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getTiersForQuality
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// sourcePassesQuality
// ---------------------------------------------------------------------------

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
