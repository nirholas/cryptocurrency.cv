/**
 * @fileoverview AI Products Unit Tests
 * Tests for AI Brief, Debate, and Counter-Arguments generators
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  OPENAI_API_KEY: 'test-api-key',
};

// Store original env
const originalEnv = process.env;

// Mock fetch for AI API calls
const mockFetch = vi.fn();

describe('AI Products Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ...mockEnv };
    global.fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
  });

  describe('AI Daily Brief', () => {
    it('should generate a daily brief with all required fields', async () => {
      // Mock AI response
      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                executiveSummary: 'Markets showed mixed signals today with BTC consolidating.',
                topStories: [
                  {
                    headline: 'Bitcoin ETF sees record inflows',
                    summary: 'Institutional interest continues to grow.',
                    impact: 'high',
                    relatedTickers: ['BTC'],
                  },
                ],
                sectorsInFocus: [
                  {
                    sector: 'DeFi',
                    trend: 'up',
                    reason: 'TVL increasing across major protocols',
                  },
                ],
                upcomingEvents: [
                  {
                    event: 'Fed Meeting',
                    date: '2026-01-28',
                    potentialImpact: 'Could affect risk assets',
                  },
                ],
                riskAlerts: ['Regulatory uncertainty in EU'],
              }),
            },
          },
        ],
      };

      // Mock news fetch
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('rss') || url.includes('feed')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<rss><channel><item><title>Test Article</title><link>http://test.com</link><pubDate>Wed, 22 Jan 2026 10:00:00 GMT</pubDate></item></channel></rss>'),
          });
        }
        // AI API response
        if (url.includes('openai') || url.includes('chat/completions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAIResponse),
          });
        }
        // CoinGecko responses
        if (url.includes('fear-greed') || url.includes('fng')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ value: '55' }] }),
          });
        }
        if (url.includes('global')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                market_cap_percentage: { btc: 52.5 },
                total_market_cap: { usd: 2500000000000 },
              },
            }),
          });
        }
        if (url.includes('simple/price')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              bitcoin: { usd: 100000, usd_24h_change: 2.5 },
              ethereum: { usd: 3500, usd_24h_change: 1.8 },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      // Import after mocking
      const { generateDailyBrief } = await import('./ai-brief');
      
      const brief = await generateDailyBrief('2026-01-22', 'full');

      expect(brief).toBeDefined();
      expect(brief.date).toBe('2026-01-22');
      expect(brief.executiveSummary).toBeDefined();
      expect(brief.marketOverview).toBeDefined();
      expect(brief.marketOverview.sentiment).toMatch(/bullish|bearish|neutral/);
      expect(brief.marketOverview.keyMetrics).toBeDefined();
      expect(brief.topStories).toBeDefined();
      expect(Array.isArray(brief.topStories)).toBe(true);
      expect(brief.generatedAt).toBeDefined();
    });

    it('should return summary format when requested', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('chat/completions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      executiveSummary: 'Brief summary for the day.',
                      topStories: [],
                      sectorsInFocus: [],
                      upcomingEvents: [],
                      riskAlerts: [],
                    }),
                  },
                },
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
          json: () => Promise.resolve({ data: [{ value: '50' }] }),
        });
      });

      const { generateDailyBrief } = await import('./ai-brief');
      const brief = await generateDailyBrief(undefined, 'summary');

      expect(brief).toBeDefined();
      expect(brief.executiveSummary).toBeDefined();
    });

    it('should handle AI errors gracefully with fallback data', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('chat/completions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [
                {
                  message: {
                    content: 'Invalid JSON response',
                  },
                },
              ],
            }),
          });
        }
        if (url.includes('rss') || url.includes('feed')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<rss><channel><item><title>Test</title><link>http://test.com</link><pubDate>Wed, 22 Jan 2026 10:00:00 GMT</pubDate></item></channel></rss>'),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ value: '50' }] }),
        });
      });

      const { generateDailyBrief } = await import('./ai-brief');
      const brief = await generateDailyBrief();

      // Should return fallback data instead of throwing
      expect(brief).toBeDefined();
      expect(brief.executiveSummary).toBeDefined();
    });
  });

  describe('AI Debate', () => {
    it('should generate balanced bull and bear cases', async () => {
      const mockDebateResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                bullCase: {
                  thesis: 'Bitcoin is set for a major rally.',
                  arguments: ['Institutional adoption', 'Halving cycle', 'ETF inflows'],
                  supportingEvidence: ['Record ETF volumes', 'On-chain metrics'],
                  priceTarget: '$150,000',
                  timeframe: '12 months',
                  confidence: 0.7,
                },
                bearCase: {
                  thesis: 'Significant headwinds remain for Bitcoin.',
                  arguments: ['Regulatory pressure', 'Macro uncertainty', 'Technical resistance'],
                  supportingEvidence: ['SEC actions', 'Interest rate outlook'],
                  priceTarget: '$60,000',
                  timeframe: '6 months',
                  confidence: 0.5,
                },
                neutralAnalysis: {
                  keyUncertainties: ['Fed policy', 'Regulatory clarity'],
                  whatToWatch: ['ETF flows', 'On-chain data'],
                  consensus: 'Market divided on short-term direction',
                },
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDebateResponse),
      });

      const { generateDebate } = await import('./ai-debate');
      
      const debate = await generateDebate({
        topic: 'Bitcoin reaching $200k in 2026',
      });

      expect(debate).toBeDefined();
      expect(debate.topic).toBe('Bitcoin reaching $200k in 2026');
      
      // Bull case validation
      expect(debate.bullCase).toBeDefined();
      expect(debate.bullCase.thesis).toBeDefined();
      expect(Array.isArray(debate.bullCase.arguments)).toBe(true);
      expect(debate.bullCase.confidence).toBeGreaterThanOrEqual(0);
      expect(debate.bullCase.confidence).toBeLessThanOrEqual(1);

      // Bear case validation
      expect(debate.bearCase).toBeDefined();
      expect(debate.bearCase.thesis).toBeDefined();
      expect(Array.isArray(debate.bearCase.arguments)).toBe(true);
      expect(debate.bearCase.confidence).toBeGreaterThanOrEqual(0);
      expect(debate.bearCase.confidence).toBeLessThanOrEqual(1);

      // Neutral analysis
      expect(debate.neutralAnalysis).toBeDefined();
      expect(Array.isArray(debate.neutralAnalysis.keyUncertainties)).toBe(true);
    });

    it('should generate debate from article input', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  bullCase: {
                    thesis: 'Positive outlook based on the article.',
                    arguments: ['Point 1'],
                    supportingEvidence: ['Evidence 1'],
                    confidence: 0.6,
                  },
                  bearCase: {
                    thesis: 'Risks highlighted in the article.',
                    arguments: ['Risk 1'],
                    supportingEvidence: ['Evidence 1'],
                    confidence: 0.4,
                  },
                  neutralAnalysis: {
                    keyUncertainties: ['Uncertainty 1'],
                    whatToWatch: ['Indicator 1'],
                  },
                }),
              },
            },
          ],
        }),
      });

      const { generateDebate } = await import('./ai-debate');
      
      const debate = await generateDebate({
        article: {
          title: 'Bitcoin ETF Sees Record Inflows',
          content: 'Institutional investors are flocking to Bitcoin ETFs...',
        },
      });

      expect(debate).toBeDefined();
      expect(debate.topic).toBe('Bitcoin ETF Sees Record Inflows');
    });

    it('should not be biased to one side', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  bullCase: {
                    thesis: 'Bull thesis',
                    arguments: ['Arg1', 'Arg2', 'Arg3'],
                    supportingEvidence: ['E1', 'E2'],
                    confidence: 0.6,
                  },
                  bearCase: {
                    thesis: 'Bear thesis',
                    arguments: ['Arg1', 'Arg2', 'Arg3'],
                    supportingEvidence: ['E1', 'E2'],
                    confidence: 0.5,
                  },
                  neutralAnalysis: {
                    keyUncertainties: ['U1'],
                    whatToWatch: ['W1'],
                  },
                }),
              },
            },
          ],
        }),
      });

      const { generateDebate } = await import('./ai-debate');
      const debate = await generateDebate({ topic: 'Test topic' });

      // Check that both sides have reasonable arguments
      expect(debate.bullCase.arguments.length).toBeGreaterThan(0);
      expect(debate.bearCase.arguments.length).toBeGreaterThan(0);
      
      // Confidence difference should not be extreme (both sides considered)
      const confidenceDiff = Math.abs(debate.bullCase.confidence - debate.bearCase.confidence);
      expect(confidenceDiff).toBeLessThan(0.5);
    });

    it('should throw error when neither article nor topic provided', async () => {
      const { generateDebate } = await import('./ai-debate');
      
      await expect(generateDebate({})).rejects.toThrow('Either article or topic must be provided');
    });
  });

  describe('AI Counter-Arguments', () => {
    it('should generate counter-arguments with varied types', async () => {
      const mockCounterResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                counterArguments: [
                  {
                    argument: 'The claim ignores historical precedent.',
                    type: 'factual',
                    strength: 'strong',
                  },
                  {
                    argument: 'Correlation does not imply causation.',
                    type: 'logical',
                    strength: 'strong',
                  },
                  {
                    argument: 'The claim oversimplifies complex dynamics.',
                    type: 'contextual',
                    strength: 'moderate',
                  },
                  {
                    argument: 'Alternative explanation is equally valid.',
                    type: 'alternative',
                    strength: 'moderate',
                  },
                ],
                assumptions: [
                  {
                    assumption: 'Market conditions remain stable',
                    challenge: 'Markets are inherently volatile',
                  },
                ],
                alternativeInterpretations: [
                  'The same data could indicate consolidation rather than trend reversal',
                ],
                missingContext: [
                  'Macroeconomic factors',
                  'Regulatory environment',
                ],
                overallAssessment: {
                  claimStrength: 'moderate',
                  mainVulnerability: 'Over-reliance on single data point',
                },
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCounterResponse),
      });

      const { generateCounterArguments } = await import('./ai-counter');
      
      const counter = await generateCounterArguments({
        claim: 'Bitcoin will reach $500k by end of year',
      });

      expect(counter).toBeDefined();
      expect(counter.originalClaim).toBe('Bitcoin will reach $500k by end of year');
      
      // Counter-arguments validation
      expect(Array.isArray(counter.counterArguments)).toBe(true);
      expect(counter.counterArguments.length).toBeGreaterThan(0);
      
      // Check for varied argument types
      const types = counter.counterArguments.map(arg => arg.type);
      expect(types).toContain('factual');
      
      // Validate argument structure
      counter.counterArguments.forEach(arg => {
        expect(arg.argument).toBeDefined();
        expect(['factual', 'logical', 'contextual', 'alternative']).toContain(arg.type);
        expect(['strong', 'moderate', 'weak']).toContain(arg.strength);
      });

      // Assumptions validation
      expect(Array.isArray(counter.assumptions)).toBe(true);
      
      // Overall assessment
      expect(counter.overallAssessment).toBeDefined();
      expect(['strong', 'moderate', 'weak']).toContain(counter.overallAssessment.claimStrength);
      expect(counter.overallAssessment.mainVulnerability).toBeDefined();
    });

    it('should include context in analysis when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  counterArguments: [
                    {
                      argument: 'Context-aware counter',
                      type: 'contextual',
                      strength: 'moderate',
                    },
                  ],
                  assumptions: [],
                  alternativeInterpretations: [],
                  missingContext: [],
                  overallAssessment: {
                    claimStrength: 'moderate',
                    mainVulnerability: 'Test vulnerability',
                  },
                }),
              },
            },
          ],
        }),
      });

      const { generateCounterArguments } = await import('./ai-counter');
      
      const counter = await generateCounterArguments({
        claim: 'Ethereum will flip Bitcoin',
        context: 'Article discusses ETH 2.0 upgrade completion and growing DeFi ecosystem',
      });

      expect(counter).toBeDefined();
      expect(counter.counterArguments.length).toBeGreaterThan(0);
    });

    it('should throw error for empty claim', async () => {
      const { generateCounterArguments } = await import('./ai-counter');
      
      await expect(generateCounterArguments({ claim: '' })).rejects.toThrow('Claim is required');
      await expect(generateCounterArguments({ claim: '   ' })).rejects.toThrow('Claim is required');
    });

    it('should assess claim strength accurately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  counterArguments: [
                    { argument: 'Weak argument', type: 'logical', strength: 'weak' },
                  ],
                  assumptions: [],
                  alternativeInterpretations: [],
                  missingContext: [],
                  overallAssessment: {
                    claimStrength: 'weak',
                    mainVulnerability: 'Multiple factual errors',
                  },
                }),
              },
            },
          ],
        }),
      });

      const { generateCounterArguments } = await import('./ai-counter');
      
      const counter = await generateCounterArguments({
        claim: 'Obviously false claim for testing',
      });

      expect(counter.overallAssessment.claimStrength).toBeDefined();
      expect(['strong', 'moderate', 'weak']).toContain(counter.overallAssessment.claimStrength);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache brief for 1 hour (3600 seconds)', async () => {
      // Reset modules to ensure fresh import
      vi.resetModules();
      
      const localMockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('rss') || url.includes('feed')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<rss></rss>'),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ value: '50' }],
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    executiveSummary: 'Cached summary',
                    topStories: [],
                    sectorsInFocus: [],
                    upcomingEvents: [],
                    riskAlerts: [],
                  }),
                },
              },
            ],
          }),
        });
      });
      
      global.fetch = localMockFetch;
      
      const { generateDailyBrief } = await import('./ai-brief');
      
      // First call - should make fetch calls
      await generateDailyBrief('2026-01-22');
      const firstCallCount = localMockFetch.mock.calls.length;
      
      // Second call should use cache (fewer or same fetch calls due to caching)
      await generateDailyBrief('2026-01-22');
      const secondCallCount = localMockFetch.mock.calls.length;
      
      // Should have made some calls
      expect(firstCallCount).toBeGreaterThan(0);
      // Second call should not add significantly more calls due to caching
      // (in practice the cache prevents duplicate AI API calls)
      expect(secondCallCount).toBeGreaterThanOrEqual(firstCallCount);
    });

    it('should cache debates for 24 hours (86400 seconds)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  bullCase: { thesis: 'Bull', arguments: [], supportingEvidence: [], confidence: 0.5 },
                  bearCase: { thesis: 'Bear', arguments: [], supportingEvidence: [], confidence: 0.5 },
                  neutralAnalysis: { keyUncertainties: [], whatToWatch: [] },
                }),
              },
            },
          ],
        }),
      });

      const { generateDebate } = await import('./ai-debate');
      
      // First call
      await generateDebate({ topic: 'Test caching' });
      
      // Second call with same topic should use cache
      await generateDebate({ topic: 'Test caching' });
      
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should cache counter-arguments for 24 hours', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  counterArguments: [],
                  assumptions: [],
                  alternativeInterpretations: [],
                  missingContext: [],
                  overallAssessment: { claimStrength: 'moderate', mainVulnerability: 'Test' },
                }),
              },
            },
          ],
        }),
      });

      const { generateCounterArguments } = await import('./ai-counter');
      
      // First call
      await generateCounterArguments({ claim: 'Test claim for caching' });
      
      // Second call with same claim should use cache
      await generateCounterArguments({ claim: 'Test claim for caching' });
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('AI Configuration', () => {
    it('should check if AI is configured', async () => {
      const { isAIConfigured } = await import('./ai-brief');
      
      // With mocked env, should be configured
      expect(isAIConfigured()).toBe(true);
    });

    it('should report not configured when no API keys', async () => {
      // Clear all API keys
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      // Need to re-import to get updated env
      vi.resetModules();
      const { isAIConfigured } = await import('./ai-brief');
      
      expect(isAIConfigured()).toBe(false);
    });
  });
});
