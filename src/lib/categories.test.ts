/**
 * Tests for lib/categories.ts
 * Covers category data integrity, getCategoryBySlug, matchArticleToCategories
 */

import { describe, it, expect } from 'vitest';
import {
  categories,
  getCategoryBySlug,
  matchArticleToCategories,
  type Category,
} from '@/lib/categories';

// ---------------------------------------------------------------------------
// categories array data integrity
// ---------------------------------------------------------------------------

describe('categories array', () => {
  it('is non-empty', () => {
    expect(categories.length).toBeGreaterThan(5);
  });

  it('every category has required fields', () => {
    for (const cat of categories) {
      expect(cat.slug, `${cat.slug}: slug`).toBeTruthy();
      expect(cat.name, `${cat.slug}: name`).toBeTruthy();
      expect(cat.icon, `${cat.slug}: icon`).toBeTruthy();
      expect(cat.description, `${cat.slug}: description`).toBeTruthy();
      expect(Array.isArray(cat.keywords), `${cat.slug}: keywords`).toBe(true);
      expect(cat.keywords.length, `${cat.slug}: no keywords`).toBeGreaterThan(0);
      expect(cat.color, `${cat.slug}: color`).toBeTruthy();
      expect(cat.bgColor, `${cat.slug}: bgColor`).toBeTruthy();
    }
  });

  it('all slugs are unique', () => {
    const slugs = categories.map(c => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('core categories exist: bitcoin, ethereum, defi, regulation, trading', () => {
    const slugs = categories.map(c => c.slug);
    for (const expected of ['bitcoin', 'ethereum', 'defi', 'regulation', 'trading']) {
      expect(slugs).toContain(expected);
    }
  });

  it('all keywords are lowercase strings', () => {
    for (const cat of categories) {
      for (const kw of cat.keywords) {
        expect(typeof kw).toBe('string');
        expect(kw).toBe(kw.toLowerCase());
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getCategoryBySlug
// ---------------------------------------------------------------------------

describe('getCategoryBySlug', () => {
  it('returns the correct category for a known slug', () => {
    const cat = getCategoryBySlug('bitcoin');
    expect(cat).toBeDefined();
    expect(cat?.name).toBe('Bitcoin');
  });

  it('returns the ethereum category', () => {
    expect(getCategoryBySlug('ethereum')?.slug).toBe('ethereum');
  });

  it('returns undefined for unknown slug', () => {
    expect(getCategoryBySlug('not-a-category')).toBeUndefined();
  });

  it('is exact-match (slug must be correct case)', () => {
    expect(getCategoryBySlug('Bitcoin')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// matchArticleToCategories
// ---------------------------------------------------------------------------

describe('matchArticleToCategories', () => {
  it('returns bitcoin for a BTC article', () => {
    const cats = matchArticleToCategories('Bitcoin breaks $100k', 'BTC price surges');
    expect(cats).toContain('bitcoin');
  });

  it('returns ethereum for ETH content', () => {
    const cats = matchArticleToCategories('Ethereum gas fees drop on L2');
    expect(cats).toContain('ethereum');
  });

  it('returns regulation for SEC content', () => {
    const cats = matchArticleToCategories('SEC sues crypto exchange');
    expect(cats).toContain('regulation');
  });

  it('returns defi for DeFi content', () => {
    const cats = matchArticleToCategories('DeFi protocol hits $10B TVL');
    expect(cats).toContain('defi');
  });

  it('returns trading for price and market content', () => {
    const cats = matchArticleToCategories('Crypto market rally', 'Price surges');
    expect(cats).toContain('trading');
  });

  it('can match multiple categories', () => {
    const cats = matchArticleToCategories('Bitcoin and Ethereum DeFi rally on regulation news');
    expect(cats.length).toBeGreaterThan(1);
  });

  it('returns empty array for unrelated content', () => {
    const cats = matchArticleToCategories('Local bakery opens new branch downtown');
    expect(cats).toEqual([]);
  });

  it('is case-insensitive (keywords are checked against lowercased text)', () => {
    const cats = matchArticleToCategories('BITCOIN HALVING INCOMING');
    expect(cats).toContain('bitcoin');
  });

  it('works without description argument', () => {
    const cats = matchArticleToCategories('Ethereum upgrade complete');
    expect(cats).toContain('ethereum');
  });
});
