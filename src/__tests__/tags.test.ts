import { describe, it, expect } from 'vitest';
import { TAGS, type Tag } from '@/lib/tags';

describe('TAGS', () => {
  it('should export a non-empty record of tags', () => {
    const keys = Object.keys(TAGS);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should have bitcoin tag', () => {
    expect(TAGS['bitcoin']).toBeDefined();
    expect(TAGS['bitcoin'].name).toBe('Bitcoin');
    expect(TAGS['bitcoin'].category).toBe('asset');
    expect(TAGS['bitcoin'].priority).toBe(100);
  });

  it('should have ethereum tag', () => {
    expect(TAGS['ethereum']).toBeDefined();
    expect(TAGS['ethereum'].name).toBe('Ethereum');
    expect(TAGS['ethereum'].category).toBe('asset');
  });

  it('should have solana tag', () => {
    expect(TAGS['solana']).toBeDefined();
    expect(TAGS['solana'].category).toBe('asset');
  });

  it('every tag should have required fields', () => {
    for (const [key, tag] of Object.entries(TAGS)) {
      expect(tag.slug).toBeTruthy();
      expect(tag.name).toBeTruthy();
      expect(tag.description).toBeTruthy();
      expect(tag.icon).toBeTruthy();
      expect(tag.category).toBeTruthy();
      expect(tag.keywords).toBeDefined();
      expect(tag.keywords.length).toBeGreaterThan(0);
      expect(typeof tag.priority).toBe('number');
    }
  });

  it('tag slugs should match their keys', () => {
    for (const [key, tag] of Object.entries(TAGS)) {
      expect(tag.slug).toBe(key);
    }
  });

  it('should have different category types', () => {
    const tagCategories = new Set(Object.values(TAGS).map((t) => t.category));
    expect(tagCategories.has('asset')).toBe(true);
    expect(tagCategories.has('topic')).toBe(true);
  });

  it('should have tags with relatedTags', () => {
    const btc = TAGS['bitcoin'];
    expect(btc.relatedTags).toBeDefined();
    expect(btc.relatedTags!.length).toBeGreaterThan(0);
  });

  it('priority should be a positive number', () => {
    for (const tag of Object.values(TAGS)) {
      expect(tag.priority).toBeGreaterThan(0);
    }
  });

  it('keywords should be lowercase', () => {
    for (const tag of Object.values(TAGS)) {
      for (const kw of tag.keywords) {
        expect(kw).toBe(kw.toLowerCase());
      }
    }
  });

  it('should have at least 20 tags', () => {
    expect(Object.keys(TAGS).length).toBeGreaterThanOrEqual(20);
  });
});
