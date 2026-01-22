import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyEvent,
  isClassifierConfigured,
  quickClassify,
  EventType,
} from './event-classifier';
import {
  extractClaims,
  isExtractorConfigured,
  hasSignificantClaims,
  extractQuickAttributions,
  analyzeClaimQuality,
  ClaimExtractionResult,
} from './claim-extractor';

// Mock fetch for AI API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Event Classifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('isClassifierConfigured', () => {
    it('returns false when no API key is set', () => {
      expect(isClassifierConfigured()).toBe(false);
    });

    it('returns true when Groq key is set', () => {
      process.env.GROQ_API_KEY = 'test-key';
      expect(isClassifierConfigured()).toBe(true);
    });

    it('returns true when OpenAI key is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(isClassifierConfigured()).toBe(true);
    });

    it('returns true when Anthropic key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      expect(isClassifierConfigured()).toBe(true);
    });

    it('returns true when OpenRouter key is set', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      expect(isClassifierConfigured()).toBe(true);
    });
  });

  describe('quickClassify', () => {
    it('classifies funding round events', () => {
      expect(quickClassify('Coinbase Raises $300M Series E')).toBe('funding_round');
      expect(quickClassify('Startup secures seed funding')).toBe('funding_round');
      expect(quickClassify('VC investment in DeFi protocol')).toBe('funding_round');
    });

    it('classifies hack/exploit events', () => {
      expect(quickClassify('DeFi Protocol Suffers $50M Hack')).toBe('hack_exploit');
      expect(quickClassify('Flash Loan Exploit Drains Liquidity')).toBe('hack_exploit');
      expect(quickClassify('Security Breach at Exchange')).toBe('hack_exploit');
    });

    it('classifies regulation events', () => {
      expect(quickClassify('SEC Proposes New Crypto Rules')).toBe('regulation');
      expect(quickClassify('Congress Debates Crypto Legislation')).toBe('regulation');
      expect(quickClassify('Country Bans Cryptocurrency Trading')).toBe('regulation');
    });

    it('classifies legal action events', () => {
      expect(quickClassify('SEC Sues Crypto Exchange')).toBe('legal_action');
      expect(quickClassify('Lawsuit Filed Against Protocol')).toBe('legal_action');
      expect(quickClassify('Enforcement Action Announced')).toBe('legal_action');
    });

    it('classifies product launch events', () => {
      expect(quickClassify('Protocol Launches New DeFi Platform')).toBe('product_launch');
      expect(quickClassify('Company Releases Mobile App')).toBe('product_launch');
      expect(quickClassify('New Feature Unveiled for Users')).toBe('product_launch');
    });

    it('classifies partnership events', () => {
      expect(quickClassify('Coinbase Partners with Visa')).toBe('partnership');
      expect(quickClassify('Strategic Alliance Formed')).toBe('partnership');
      expect(quickClassify('Companies Team Up for DeFi')).toBe('partnership');
    });

    it('classifies listing events', () => {
      expect(quickClassify('Binance Lists New Token')).toBe('listing');
      expect(quickClassify('Token Delisted from Exchange')).toBe('listing');
      expect(quickClassify('Coinbase Adds Support for Asset')).toBe('listing');
    });

    it('classifies airdrop events', () => {
      expect(quickClassify('Protocol Announces Airdrop')).toBe('airdrop');
      expect(quickClassify('Token Distribution to Users')).toBe('airdrop');
      expect(quickClassify('Claim Your Free Tokens Now')).toBe('airdrop');
    });

    it('classifies network upgrade events', () => {
      expect(quickClassify('Ethereum Hard Fork Scheduled')).toBe('network_upgrade');
      expect(quickClassify('Protocol Upgrade Goes Live')).toBe('network_upgrade');
      expect(quickClassify('Mainnet Migration Announced')).toBe('network_upgrade');
    });

    it('classifies market movement events', () => {
      expect(quickClassify('Bitcoin Price Surges to ATH')).toBe('market_movement');
      expect(quickClassify('Crypto Market Crash Continues')).toBe('market_movement');
      expect(quickClassify('Bullish Rally in DeFi Tokens')).toBe('market_movement');
    });

    it('classifies executive change events', () => {
      expect(quickClassify('New CEO Appointed at Exchange')).toBe('executive_change');
      expect(quickClassify('CTO Resigns from Protocol')).toBe('executive_change');
      expect(quickClassify('Company Hires Former Google Executive')).toBe('executive_change');
    });

    it('classifies acquisition events', () => {
      expect(quickClassify('Binance Acquires Rival Exchange')).toBe('acquisition');
      expect(quickClassify('Merger Creates Crypto Giant')).toBe('acquisition');
      expect(quickClassify('Buyout Deal Announced')).toBe('acquisition');
    });

    it('returns general for unclassified events', () => {
      expect(quickClassify('Some Random News Article')).toBe('general');
      expect(quickClassify('Opinion: The Future of Blockchain')).toBe('general');
    });
  });

  describe('classifyEvent', () => {
    it('calls AI API and returns classification', async () => {
      process.env.GROQ_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                eventType: 'funding_round',
                confidence: 0.95,
                subType: 'Series E',
                entities: {
                  primary: 'Coinbase',
                  secondary: ['Tiger Global'],
                },
                magnitude: {
                  value: 300000000,
                  unit: 'USD',
                },
                urgency: 'important',
                marketRelevance: 'high',
              }),
            },
          }],
        }),
      });

      const result = await classifyEvent(
        'Coinbase Raises $300M Series E',
        'Cryptocurrency exchange Coinbase announced today...'
      );

      expect(result.eventType).toBe('funding_round');
      expect(result.confidence).toBe(0.95);
      expect(result.subType).toBe('Series E');
      expect(result.entities.primary).toBe('Coinbase');
      expect(result.magnitude?.value).toBe(300000000);
      expect(result.urgency).toBe('important');
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('validates eventType and falls back to general', async () => {
      process.env.GROQ_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                eventType: 'invalid_type',
                confidence: 0.9,
                entities: { primary: 'Test' },
                urgency: 'routine',
                marketRelevance: 'low',
              }),
            },
          }],
        }),
      });

      const result = await classifyEvent('Test Article', 'Test content');
      expect(result.eventType).toBe('general');
    });

    it('handles malformed JSON gracefully', async () => {
      process.env.GROQ_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'not valid json',
            },
          }],
        }),
      });

      const result = await classifyEvent(
        'Coinbase News',
        'Some content about Coinbase'
      );

      expect(result.eventType).toBe('general');
      expect(result.confidence).toBe(0.3);
    });

    it('throws when no AI provider configured', async () => {
      await expect(
        classifyEvent('Test', 'Content')
      ).rejects.toThrow('No AI provider configured');
    });
  });
});

describe('Claim Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('isExtractorConfigured', () => {
    it('returns false when no API key is set', () => {
      expect(isExtractorConfigured()).toBe(false);
    });

    it('returns true when Groq key is set', () => {
      process.env.GROQ_API_KEY = 'test-key';
      expect(isExtractorConfigured()).toBe(true);
    });
  });

  describe('hasSignificantClaims', () => {
    it('detects dollar amounts', () => {
      expect(hasSignificantClaims('Company raises $50 million')).toBe(true);
      expect(hasSignificantClaims('Protocol valued at $1B')).toBe(true);
    });

    it('detects percentages', () => {
      expect(hasSignificantClaims('Bitcoin up 15%')).toBe(true);
      expect(hasSignificantClaims('Volume increased by 200%')).toBe(true);
    });

    it('detects financial events', () => {
      expect(hasSignificantClaims('Company acquired for large sum')).toBe(true);
      expect(hasSignificantClaims('Fund invested in protocol')).toBe(true);
    });

    it('detects official statements', () => {
      expect(hasSignificantClaims('CEO announced new product')).toBe(true);
      expect(hasSignificantClaims('Company confirmed merger')).toBe(true);
    });

    it('detects predictions', () => {
      expect(hasSignificantClaims('Analyst expects price increase')).toBe(true);
      expect(hasSignificantClaims('Expert predicts market crash')).toBe(true);
    });

    it('returns false for generic content', () => {
      expect(hasSignificantClaims('General news about blockchain')).toBe(false);
    });
  });

  describe('extractQuickAttributions', () => {
    it('extracts "according to" attributions', () => {
      const content = 'According to John Smith, the market is bullish.';
      const attributions = extractQuickAttributions(content);
      expect(attributions).toContain('John Smith');
    });

    it('extracts title-based attributions', () => {
      const content = 'Jane Doe, CEO of Crypto Corp, stated that...';
      const attributions = extractQuickAttributions(content);
      expect(attributions.some(a => a.includes('Jane'))).toBe(true);
    });

    it('returns empty array when no attributions found', () => {
      const content = 'Generic article with no quotes or sources.';
      const attributions = extractQuickAttributions(content);
      expect(attributions).toEqual([]);
    });
  });

  describe('analyzeClaimQuality', () => {
    it('calculates quality score correctly', () => {
      const result: ClaimExtractionResult = {
        claims: [
          {
            claim: 'Company raised $50M',
            attribution: { source: 'CEO', role: 'CEO', organization: 'Company' },
            type: 'fact',
            verifiability: 'verifiable',
            relatedEntities: ['Company'],
          },
          {
            claim: 'Market will grow',
            attribution: { source: 'Analyst' },
            type: 'prediction',
            verifiability: 'future',
            relatedEntities: [],
          },
        ],
        primaryNarrative: 'Test narrative',
        conflictingClaims: false,
      };

      const quality = analyzeClaimQuality(result);

      expect(quality.totalClaims).toBe(2);
      expect(quality.verifiableClaims).toBe(1);
      expect(quality.hasAttribution).toBe(2);
      expect(quality.qualityScore).toBeGreaterThan(0);
    });

    it('handles empty claims', () => {
      const result: ClaimExtractionResult = {
        claims: [],
        primaryNarrative: 'No claims found',
        conflictingClaims: false,
      };

      const quality = analyzeClaimQuality(result);

      expect(quality.totalClaims).toBe(0);
      expect(quality.qualityScore).toBe(0);
    });

    it('reduces score for conflicting claims', () => {
      const baseResult: ClaimExtractionResult = {
        claims: [
          {
            claim: 'Fact 1',
            attribution: { source: 'Source 1' },
            type: 'fact',
            verifiability: 'verifiable',
            relatedEntities: [],
          },
        ],
        primaryNarrative: 'Test',
        conflictingClaims: false,
      };

      const conflictingResult: ClaimExtractionResult = {
        ...baseResult,
        conflictingClaims: true,
      };

      const baseQuality = analyzeClaimQuality(baseResult);
      const conflictingQuality = analyzeClaimQuality(conflictingResult);

      expect(baseQuality.qualityScore).toBeGreaterThan(conflictingQuality.qualityScore);
    });
  });

  describe('extractClaims', () => {
    it('calls AI API and returns claims', async () => {
      process.env.GROQ_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                claims: [
                  {
                    claim: 'SEC approved spot Bitcoin ETF',
                    attribution: {
                      source: 'article author',
                      organization: 'SEC',
                    },
                    type: 'fact',
                    verifiability: 'verifiable',
                    relatedEntities: ['SEC', 'Bitcoin ETF'],
                  },
                  {
                    claim: 'ETF will democratize Bitcoin access',
                    attribution: {
                      source: 'Larry Fink',
                      role: 'CEO',
                      organization: 'BlackRock',
                    },
                    type: 'opinion',
                    verifiability: 'subjective',
                    relatedEntities: ['BlackRock', 'Bitcoin'],
                  },
                ],
                primaryNarrative: 'SEC approved Bitcoin ETF with industry reactions.',
                conflictingClaims: false,
              }),
            },
          }],
        }),
      });

      const result = await extractClaims(
        'Bitcoin ETF Approved',
        'The SEC approved the spot Bitcoin ETF...'
      );

      expect(result.claims).toHaveLength(2);
      expect(result.claims[0].claim).toBe('SEC approved spot Bitcoin ETF');
      expect(result.claims[1].attribution.source).toBe('Larry Fink');
      expect(result.primaryNarrative).toContain('Bitcoin ETF');
      expect(result.conflictingClaims).toBe(false);
    });

    it('handles malformed response gracefully', async () => {
      process.env.GROQ_API_KEY = 'test-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'invalid json response',
            },
          }],
        }),
      });

      const result = await extractClaims('Test Title', 'Test content');

      expect(result.claims).toEqual([]);
      expect(result.primaryNarrative).toContain('Test Title');
      expect(result.conflictingClaims).toBe(false);
    });

    it('throws when no AI provider configured', async () => {
      await expect(
        extractClaims('Test', 'Content')
      ).rejects.toThrow('No AI provider configured');
    });
  });
});

describe('Event Classification - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GROQ_API_KEY;
  });

  describe('Multiple event types in one article', () => {
    it('quickClassify returns first matching type', () => {
      // Article about hack and regulation
      const title = 'SEC Investigates Exchange Following $100M Hack';
      const result = quickClassify(title);
      // Should match hack_exploit first based on our pattern order
      expect(['hack_exploit', 'regulation', 'legal_action']).toContain(result);
    });
  });

  describe('Ambiguous content', () => {
    it('returns general for ambiguous titles', () => {
      expect(quickClassify('Thoughts on Crypto Future')).toBe('general');
      expect(quickClassify('What Happened This Week')).toBe('general');
    });
  });

  describe('Case sensitivity', () => {
    it('handles uppercase titles', () => {
      expect(quickClassify('BITCOIN PRICE SURGES TO NEW HIGH')).toBe('market_movement');
    });

    it('handles mixed case', () => {
      expect(quickClassify('CoInBaSe RaIsEs FuNdInG')).toBe('funding_round');
    });
  });

  describe('Special characters', () => {
    it('handles titles with special characters', () => {
      expect(quickClassify('Protocol Raises $50M+ in Series A!')).toBe('funding_round');
      expect(quickClassify('Breaking: Exchange Hacked!!!')).toBe('hack_exploit');
    });
  });
});

describe('Claim Extraction - Edge Cases', () => {
  describe('Multi-source articles', () => {
    it('detects multiple attributions', () => {
      const content = `
        According to John Smith, the market is bullish.
        Jane Doe, CEO of CryptoCorp, believes otherwise.
        "We expect growth," said Mike Johnson.
      `;
      const attributions = extractQuickAttributions(content);
      expect(attributions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Claim quality edge cases', () => {
    it('handles all unattributed claims', () => {
      const result: ClaimExtractionResult = {
        claims: [
          {
            claim: 'Some claim',
            attribution: { source: 'Unknown' },
            type: 'fact',
            verifiability: 'verifiable',
            relatedEntities: [],
          },
        ],
        primaryNarrative: 'Test',
        conflictingClaims: false,
      };

      const quality = analyzeClaimQuality(result);
      expect(quality.hasAttribution).toBe(0);
    });

    it('handles all subjective claims', () => {
      const result: ClaimExtractionResult = {
        claims: [
          {
            claim: 'Opinion 1',
            attribution: { source: 'Expert' },
            type: 'opinion',
            verifiability: 'subjective',
            relatedEntities: [],
          },
          {
            claim: 'Opinion 2',
            attribution: { source: 'Analyst' },
            type: 'opinion',
            verifiability: 'subjective',
            relatedEntities: [],
          },
        ],
        primaryNarrative: 'Opinions',
        conflictingClaims: false,
      };

      const quality = analyzeClaimQuality(result);
      expect(quality.verifiableClaims).toBe(0);
    });
  });
});
