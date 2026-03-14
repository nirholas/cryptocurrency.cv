import { describe, it, expect } from 'vitest';
import {
  categories,
  getCategoryBySlug,
  matchArticleToCategories,
} from '@/lib/categories';

describe('categories', () => {
  it('should have 9 categories', () => {
    expect(categories).toHaveLength(9);
  });

  it('should include bitcoin category', () => {
    const btc = categories.find((c) => c.slug === 'bitcoin');
    expect(btc).toBeDefined();
    expect(btc?.name).toBe('Bitcoin');
    expect(btc?.icon).toBe('₿');
  });

  it('should include ethereum category', () => {
    const eth = categories.find((c) => c.slug === 'ethereum');
    expect(eth).toBeDefined();
    expect(eth?.name).toBe('Ethereum');
  });

  it('should include all expected categories', () => {
    const slugs = categories.map((c) => c.slug);
    expect(slugs).toContain('bitcoin');
    expect(slugs).toContain('ethereum');
    expect(slugs).toContain('defi');
    expect(slugs).toContain('nft');
    expect(slugs).toContain('regulation');
    expect(slugs).toContain('altcoins');
    expect(slugs).toContain('trading');
    expect(slugs).toContain('technology');
    expect(slugs).toContain('geopolitical');
  });

  it('every category should have required fields', () => {
    for (const cat of categories) {
      expect(cat.slug).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(cat.keywords.length).toBeGreaterThan(0);
      expect(cat.color).toBeTruthy();
      expect(cat.bgColor).toBeTruthy();
    }
  });
});

describe('getCategoryBySlug', () => {
  it('should return category for valid slug', () => {
    const result = getCategoryBySlug('bitcoin');
    expect(result).toBeDefined();
    expect(result?.slug).toBe('bitcoin');
  });

  it('should return undefined for invalid slug', () => {
    expect(getCategoryBySlug('nonexistent')).toBeUndefined();
  });

  it('should return correct category data', () => {
    const defi = getCategoryBySlug('defi');
    expect(defi?.name).toBe('DeFi');
    expect(defi?.icon).toBe('🏦');
  });
});

describe('matchArticleToCategories', () => {
  it('should match bitcoin articles', () => {
    const result = matchArticleToCategories('Bitcoin hits $100k all-time high');
    expect(result).toContain('bitcoin');
  });

  it('should match ethereum articles', () => {
    const result = matchArticleToCategories('Ethereum merge upgrade complete');
    expect(result).toContain('ethereum');
  });

  it('should match defi articles', () => {
    const result = matchArticleToCategories('Aave DeFi protocol launches new lending pool');
    expect(result).toContain('defi');
  });

  it('should match nft articles', () => {
    const result = matchArticleToCategories('Bored Ape NFT collection floor price crashes');
    expect(result).toContain('nft');
  });

  it('should match regulation articles', () => {
    const result = matchArticleToCategories('SEC lawsuit against crypto exchange');
    expect(result).toContain('regulation');
  });

  it('should match multiple categories', () => {
    const result = matchArticleToCategories('Bitcoin price rally makes SEC regulation unlikely');
    expect(result).toContain('bitcoin');
    expect(result).toContain('regulation');
    expect(result).toContain('trading');
  });

  it('should use description for matching too', () => {
    const result = matchArticleToCategories(
      'Major update announced',
      'Ethereum developers confirm the merge upgrade',
    );
    expect(result).toContain('ethereum');
  });

  it('should return empty array for unmatched articles', () => {
    const result = matchArticleToCategories('Weather forecast for tomorrow');
    expect(result).toEqual([]);
  });

  it('should be case-insensitive', () => {
    const result = matchArticleToCategories('BITCOIN ETHEREUM DEFI');
    expect(result).toContain('bitcoin');
    expect(result).toContain('ethereum');
    expect(result).toContain('defi');
  });

  it('should match altcoins', () => {
    const result = matchArticleToCategories('Solana SOL price surges 20%');
    expect(result).toContain('altcoins');
  });
});
