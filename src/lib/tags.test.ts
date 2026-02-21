/**
 * Tests for lib/tags.ts
 * Covers TAGS catalog, helper functions, and tag extraction
 */

import { describe, it, expect } from 'vitest';
import {
  TAGS,
  getAllTags,
  getTagsByCategory,
  getTagBySlug,
  extractTagsFromText,
  extractTagsFromArticle,
  getRelatedTags,
  getTagUrl,
  generateTagStructuredData,
  generateTagsSitemapEntries,
  type Tag,
} from '@/lib/tags';

// ---------------------------------------------------------------------------
// TAGS catalog sanity checks
// ---------------------------------------------------------------------------

describe('TAGS catalog', () => {
  it('contains more than 50 tags', () => {
    expect(Object.keys(TAGS).length).toBeGreaterThan(50);
  });

  it('every tag has required fields', () => {
    for (const [slug, tag] of Object.entries(TAGS)) {
      expect(tag.slug, `${slug}: slug missing`).toBeTruthy();
      expect(tag.name, `${slug}: name missing`).toBeTruthy();
      expect(tag.description, `${slug}: description missing`).toBeTruthy();
      expect(tag.icon, `${slug}: icon missing`).toBeTruthy();
      expect(['asset', 'topic', 'event', 'technology', 'entity', 'sentiment']).toContain(tag.category);
      expect(Array.isArray(tag.keywords), `${slug}: keywords not array`).toBe(true);
      expect(tag.keywords.length, `${slug}: no keywords`).toBeGreaterThan(0);
      expect(typeof tag.priority, `${slug}: priority not number`).toBe('number');
    }
  });

  it('tag slug matches TAGS key', () => {
    for (const [key, tag] of Object.entries(TAGS)) {
      expect(tag.slug).toBe(key);
    }
  });

  it('high-priority tags exist: bitcoin, ethereum, etf, regulation', () => {
    expect(TAGS['bitcoin']).toBeDefined();
    expect(TAGS['ethereum']).toBeDefined();
    expect(TAGS['etf']).toBeDefined();
    expect(TAGS['regulation']).toBeDefined();
  });

  it('bitcoin has priority 100', () => {
    expect(TAGS['bitcoin'].priority).toBe(100);
  });

  it('relatedTags (if set) reference valid slugs', () => {
    for (const tag of Object.values(TAGS)) {
      if (tag.relatedTags) {
        for (const related of tag.relatedTags) {
          expect(TAGS[related], `${tag.slug} related tag "${related}" not found`).toBeDefined();
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getAllTags
// ---------------------------------------------------------------------------

describe('getAllTags', () => {
  it('returns all tags as an array', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(Object.keys(TAGS).length);
  });

  it('sorts by priority descending', () => {
    const tags = getAllTags();
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i - 1].priority).toBeGreaterThanOrEqual(tags[i].priority);
    }
  });

  it('first tag is bitcoin (highest priority)', () => {
    expect(getAllTags()[0].slug).toBe('bitcoin');
  });
});

// ---------------------------------------------------------------------------
// getTagsByCategory
// ---------------------------------------------------------------------------

describe('getTagsByCategory', () => {
  const categories: Tag['category'][] = ['asset', 'topic', 'event', 'technology', 'entity', 'sentiment'];

  for (const cat of categories) {
    it(`returns only ${cat} tags`, () => {
      const tags = getTagsByCategory(cat);
      expect(tags.every(t => t.category === cat)).toBe(true);
    });
  }

  it('returns tags sorted by priority descending', () => {
    const tags = getTagsByCategory('asset');
    expect(tags.length).toBeGreaterThan(0);
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i - 1].priority).toBeGreaterThanOrEqual(tags[i].priority);
    }
  });

  it('returns empty array for unknown category', () => {
    // @ts-expect-error — testing runtime edge case
    expect(getTagsByCategory('nonexistent')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTagBySlug
// ---------------------------------------------------------------------------

describe('getTagBySlug', () => {
  it('returns the correct tag for a known slug', () => {
    const tag = getTagBySlug('bitcoin');
    expect(tag).toBeDefined();
    expect(tag?.name).toBe('Bitcoin');
  });

  it('returns undefined for unknown slug', () => {
    expect(getTagBySlug('not-a-real-tag')).toBeUndefined();
  });

  it('is case-sensitive (slug must be lowercase)', () => {
    expect(getTagBySlug('Bitcoin')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractTagsFromText
// ---------------------------------------------------------------------------

describe('extractTagsFromText', () => {
  it('extracts bitcoin tag from text containing "bitcoin"', () => {
    const tags = extractTagsFromText('Bitcoin reaches new all time high');
    expect(tags.some(t => t.slug === 'bitcoin')).toBe(true);
  });

  it('extracts multiple tags', () => {
    const tags = extractTagsFromText('Ethereum DeFi hack exploit drains $50M');
    const slugs = tags.map(t => t.slug);
    expect(slugs).toContain('ethereum');
    expect(slugs.some(s => s === 'hack' || s === 'exploit')).toBe(true);
    expect(slugs.some(s => s === 'defi')).toBe(true);
  });

  it('is case-insensitive', () => {
    const tags = extractTagsFromText('BITCOIN ETF APPROVED');
    expect(tags.some(t => t.slug === 'bitcoin')).toBe(true);
  });

  it('returns at most 10 tags', () => {
    const tags = extractTagsFromText(
      'bitcoin ethereum solana defi nft regulation sec etf hack exploit arbitrage trading staking rwa layer-2 zk bridge'
    );
    expect(tags.length).toBeLessThanOrEqual(10);
  });

  it('returns tags sorted by priority', () => {
    const tags = extractTagsFromText('bitcoin ethereum solana XRP trading regulation etf');
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i - 1].priority).toBeGreaterThanOrEqual(tags[i].priority);
    }
  });

  it('returns empty array for text with no matching keywords', () => {
    const tags = extractTagsFromText('The quick brown fox jumps over the lazy dog');
    expect(tags).toEqual([]);
  });

  it('matches keyword exactly (word boundaries)', () => {
    // "eth" should not match in "weather"
    const tags = extractTagsFromText('The weather is great today in bitcoin country');
    const slugs = tags.map(t => t.slug);
    expect(slugs).not.toContain('ethereum'); // "eth" substring shouldn't trigger
  });

  it('each tag appears at most once', () => {
    const tags = extractTagsFromText('btc bitcoin BTC satoshi');
    const bitcoinTags = tags.filter(t => t.slug === 'bitcoin');
    expect(bitcoinTags.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// extractTagsFromArticle
// ---------------------------------------------------------------------------

describe('extractTagsFromArticle', () => {
  it('extracts from title and description combined', () => {
    const tags = extractTagsFromArticle({
      title: 'Major Bitcoin rally',
      description: 'Ethereum DeFi protocols see record volume',
    });
    const slugs = tags.map(t => t.slug);
    expect(slugs).toContain('bitcoin');
    expect(slugs).toContain('ethereum');
  });

  it('works with description undefined', () => {
    const tags = extractTagsFromArticle({ title: 'Bitcoin halving in 2024' });
    expect(tags.some(t => t.slug === 'bitcoin')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getRelatedTags
// ---------------------------------------------------------------------------

describe('getRelatedTags', () => {
  it('returns related tags for bitcoin', () => {
    const related = getRelatedTags('bitcoin');
    expect(related.length).toBeGreaterThan(0);
    expect(related.every(t => t !== undefined)).toBe(true);
  });

  it('returns empty array for tag with no relatedTags', () => {
    // Find a tag with no relatedTags (or mock one)
    const result = getRelatedTags('not-a-slug');
    expect(result).toEqual([]);
  });

  it('all returned tags are fully defined Tag objects', () => {
    const related = getRelatedTags('ethereum');
    for (const tag of related) {
      expect(tag.slug).toBeTruthy();
      expect(tag.name).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// getTagUrl
// ---------------------------------------------------------------------------

describe('getTagUrl', () => {
  it('returns the correct URL path', () => {
    expect(getTagUrl('bitcoin')).toBe('/tags/bitcoin');
    expect(getTagUrl('defi')).toBe('/tags/defi');
  });

  it('uses the slug as-is', () => {
    expect(getTagUrl('my-custom-slug')).toBe('/tags/my-custom-slug');
  });
});

// ---------------------------------------------------------------------------
// generateTagStructuredData
// ---------------------------------------------------------------------------

describe('generateTagStructuredData', () => {
  it('returns a schema.org CollectionPage', () => {
    const bitcoin = TAGS['bitcoin'];
    const data = generateTagStructuredData(bitcoin, 42) as Record<string, unknown>;
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('CollectionPage');
  });

  it('includes the tag name in the title', () => {
    const ethereum = TAGS['ethereum'];
    const data = generateTagStructuredData(ethereum, 10) as Record<string, unknown>;
    expect((data['name'] as string)).toContain('Ethereum');
  });

  it('includes the article count in mainEntity', () => {
    const tag = TAGS['defi'];
    const data = generateTagStructuredData(tag, 77) as Record<string, unknown>;
    const mainEntity = data['mainEntity'] as Record<string, unknown>;
    expect(mainEntity['numberOfItems']).toBe(77);
  });
});

// ---------------------------------------------------------------------------
// generateTagsSitemapEntries
// ---------------------------------------------------------------------------

describe('generateTagsSitemapEntries', () => {
  it('returns an entry for every tag', () => {
    const entries = generateTagsSitemapEntries();
    expect(entries.length).toBe(Object.keys(TAGS).length);
  });

  it('each entry has url and priority', () => {
    const entries = generateTagsSitemapEntries();
    for (const entry of entries) {
      expect(entry.url).toMatch(/^\/tags\//);
      expect(entry.priority).toBeGreaterThanOrEqual(0.5);
      expect(entry.priority).toBeLessThanOrEqual(0.9);
    }
  });
});
