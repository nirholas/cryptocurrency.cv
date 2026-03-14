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
} from '@/lib/source-tiers';

describe('SOURCE_TIERS', () => {
  it('should have tier1 sources', () => {
    expect(SOURCE_TIERS.bloomberg).toBeDefined();
    expect(SOURCE_TIERS.bloomberg.tier).toBe('tier1');
    expect(SOURCE_TIERS.reuters.tier).toBe('tier1');
  });

  it('should have tier2 sources', () => {
    expect(SOURCE_TIERS.coindesk).toBeDefined();
    expect(SOURCE_TIERS.coindesk.tier).toBe('tier2');
    expect(SOURCE_TIERS.theblock.tier).toBe('tier2');
  });

  it('should have tier3 sources', () => {
    expect(SOURCE_TIERS.cointelegraph.tier).toBe('tier3');
    expect(SOURCE_TIERS.bitcoinmagazine.tier).toBe('tier3');
  });

  it('should have tier4 sources', () => {
    expect(SOURCE_TIERS.cryptonews.tier).toBe('tier4');
    expect(SOURCE_TIERS.ambcrypto.tier).toBe('tier4');
  });

  it('should have research sources', () => {
    expect(SOURCE_TIERS.messari.tier).toBe('research');
    expect(SOURCE_TIERS.nansen.tier).toBe('research');
  });

  it('should have fintech sources', () => {
    expect(SOURCE_TIERS.finextra.tier).toBe('fintech');
    expect(SOURCE_TIERS.pymnts.tier).toBe('fintech');
  });

  it('every source should have all required fields', () => {
    for (const [key, entry] of Object.entries(SOURCE_TIERS)) {
      expect(entry.tier).toBeTruthy();
      expect(entry.displayName).toBeTruthy();
      expect(entry.credibility).toBeGreaterThanOrEqual(0);
      expect(entry.credibility).toBeLessThanOrEqual(1);
      expect(entry.reputation).toBeGreaterThanOrEqual(0);
      expect(entry.reputation).toBeLessThanOrEqual(100);
    }
  });
});

describe('DEFAULT_CREDIBILITY', () => {
  it('should be 0.60', () => {
    expect(DEFAULT_CREDIBILITY).toBe(0.6);
  });
});

describe('DEFAULT_REPUTATION', () => {
  it('should be 50', () => {
    expect(DEFAULT_REPUTATION).toBe(50);
  });
});

describe('getSourceCredibility', () => {
  it('should return credibility for known source', () => {
    expect(getSourceCredibility('bloomberg')).toBe(0.98);
  });

  it('should be case-insensitive', () => {
    expect(getSourceCredibility('Bloomberg')).toBe(0.98);
  });

  it('should return default for unknown source', () => {
    expect(getSourceCredibility('unknown-source')).toBe(DEFAULT_CREDIBILITY);
  });

  it('should return correct values for different tiers', () => {
    expect(getSourceCredibility('coindesk')).toBe(0.95);
    expect(getSourceCredibility('cointelegraph')).toBe(0.78);
    expect(getSourceCredibility('finextra')).toBe(0.5);
  });
});

describe('getSourceReputation', () => {
  it('should return reputation for known source key', () => {
    expect(getSourceReputation('bloomberg')).toBe(100);
  });

  it('should match by display name', () => {
    expect(getSourceReputation('Bloomberg Crypto')).toBe(100);
  });

  it('should return default for unknown source', () => {
    expect(getSourceReputation('totally-unknown')).toBe(DEFAULT_REPUTATION);
  });

  it('should work with different case', () => {
    expect(getSourceReputation('COINDESK')).toBe(90);
  });
});

describe('getSourceTier', () => {
  it('should return tier for known source', () => {
    expect(getSourceTier('bloomberg')).toBe('tier1');
    expect(getSourceTier('coindesk')).toBe('tier2');
    expect(getSourceTier('cointelegraph')).toBe('tier3');
    expect(getSourceTier('cryptonews')).toBe('tier4');
  });

  it('should return null for unknown source', () => {
    expect(getSourceTier('nonexistent')).toBeNull();
  });

  it('should be case-insensitive', () => {
    expect(getSourceTier('Bloomberg')).toBe('tier1');
  });
});

describe('isFintechSource', () => {
  it('should return true for fintech sources by key', () => {
    expect(isFintechSource('finextra')).toBe(true);
    expect(isFintechSource('pymnts')).toBe(true);
  });

  it('should return false for non-fintech sources', () => {
    expect(isFintechSource('bloomberg')).toBe(false);
    expect(isFintechSource('coindesk')).toBe(false);
  });

  it('should detect fintech by keyword fallback', () => {
    expect(isFintechSource('some-fintech-outlet')).toBe(true);
    expect(isFintechSource('finextra-blog')).toBe(true);
  });

  it('should return false for unknown non-fintech sources', () => {
    expect(isFintechSource('random-news')).toBe(false);
  });
});

describe('SOURCE_REPUTATION_SCORES (backward compat)', () => {
  it('should map display names to reputation scores', () => {
    expect(SOURCE_REPUTATION_SCORES['Bloomberg Crypto']).toBe(100);
    expect(SOURCE_REPUTATION_SCORES['CoinDesk']).toBe(90);
  });

  it('should have a default entry', () => {
    expect(SOURCE_REPUTATION_SCORES['default']).toBe(DEFAULT_REPUTATION);
  });
});

describe('SOURCE_CREDIBILITY (backward compat)', () => {
  it('should map keys to credibility scores', () => {
    expect(SOURCE_CREDIBILITY['bloomberg']).toBe(0.98);
    expect(SOURCE_CREDIBILITY['coindesk']).toBe(0.95);
  });

  it('should have a default entry', () => {
    expect(SOURCE_CREDIBILITY['default']).toBe(DEFAULT_CREDIBILITY);
  });
});
