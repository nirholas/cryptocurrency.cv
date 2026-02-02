import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  summarizeArticle,
  analyzeSentiment,
  extractFacts,
  factCheck,
  generateQuestions,
  categorizeArticle,
  isAIConfigured,
  getAIProviderInfo,
} from './ai-enhanced';

// Mock fetch for AI API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Enhanced Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('isAIConfigured', () => {
    it('returns false when no API key is set', () => {
      expect(isAIConfigured()).toBe(false);
    });

    it('returns true when OpenAI key is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(isAIConfigured()).toBe(true);
    });

    it('returns true when Anthropic key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      expect(isAIConfigured()).toBe(true);
    });

    it('returns true when Groq key is set', () => {
      process.env.GROQ_API_KEY = 'test-key';
      expect(isAIConfigured()).toBe(true);
    });

    it('returns true when OpenRouter key is set', () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      expect(isAIConfigured()).toBe(true);
    });
  });

  describe('getAIProviderInfo', () => {
    it('returns null when no provider configured', () => {
      expect(getAIProviderInfo()).toBeNull();
    });

    it('returns OpenAI info when configured', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const info = getAIProviderInfo();
      expect(info?.provider).toBe('openai');
      expect(info?.model).toBe('gpt-4o-mini');
    });

    it('returns custom model when set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4';
      const info = getAIProviderInfo();
      expect(info?.model).toBe('gpt-4');
    });

    it('prioritizes OpenAI over other providers', () => {
      process.env.OPENAI_API_KEY = 'openai-key';
      process.env.ANTHROPIC_API_KEY = 'anthropic-key';
      const info = getAIProviderInfo();
      expect(info?.provider).toBe('openai');
    });
  });

  describe('summarizeArticle', () => {
    it('calls AI API and returns summary', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'This is a summary of Bitcoin reaching new highs.' } }],
        }),
      });

      const summary = await summarizeArticle(
        'Bitcoin Reaches New All-Time High',
        'Bitcoin has surged past $100,000 for the first time in history...'
      );

      expect(summary).toBe('This is a summary of Bitcoin reaching new highs.');
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('uses correct length parameter', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Short summary.' } }],
        }),
      });

      await summarizeArticle('Title', 'Content', { length: 'short' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[1].content).toContain('1-2 sentences');
    });
  });

  describe('analyzeSentiment', () => {
    it('parses sentiment response correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                sentiment: 'bullish',
                confidence: 0.85,
                reasoning: 'Price increase and positive market momentum',
                marketImpact: 'high',
                affectedAssets: ['BTC', 'ETH'],
              }),
            },
          }],
        }),
      });

      const result = await analyzeSentiment(
        'Bitcoin Surges',
        'Bitcoin has increased by 20%...'
      );

      expect(result.sentiment).toBe('bullish');
      expect(result.confidence).toBe(0.85);
      expect(result.affectedAssets).toContain('BTC');
    });

    it('returns neutral on parse error', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Invalid response without JSON' } }],
        }),
      });

      const result = await analyzeSentiment('Title', 'Content');

      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('extractFacts', () => {
    it('extracts entities and numbers', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                keyPoints: ['Bitcoin reached $100K', 'Institutional adoption increases'],
                entities: [
                  { name: 'Bitcoin', type: 'crypto' },
                  { name: 'MicroStrategy', type: 'company' },
                ],
                numbers: [{ value: '$100,000', context: 'BTC price' }],
                dates: [{ date: '2024-12-15', event: 'ATH reached' }],
              }),
            },
          }],
        }),
      });

      const result = await extractFacts('BTC Hits 100K', 'Content...');

      expect(result.keyPoints.length).toBe(2);
      expect(result.entities.find(e => e.name === 'Bitcoin')).toBeDefined();
    });
  });

  describe('factCheck', () => {
    it('returns fact check results', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                claims: [
                  { claim: 'Bitcoin is at ATH', verdict: 'verified', explanation: 'Confirmed by market data' },
                ],
                overallCredibility: 'high',
                warnings: [],
              }),
            },
          }],
        }),
      });

      const result = await factCheck('Title', 'Content');

      expect(result.overallCredibility).toBe('high');
      expect(result.claims[0].verdict).toBe('verified');
    });
  });

  describe('generateQuestions', () => {
    it('returns array of questions', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '1. What caused Bitcoin to reach this price level?\n2. How will this affect altcoins?\n3. Is this rally sustainable?',
            },
          }],
        }),
      });

      const questions = await generateQuestions('BTC Rally', 'Content...');

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('?');
    });
  });

  describe('categorizeArticle', () => {
    it('categorizes article correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                primaryCategory: 'bitcoin',
                secondaryCategories: ['market'],
                tags: ['price', 'ath', 'rally'],
                topics: ['price movement', 'market analysis'],
              }),
            },
          }],
        }),
      });

      const result = await categorizeArticle('BTC Price', 'Content...');

      expect(result.primaryCategory).toBe('bitcoin');
      expect(result.tags).toContain('price');
    });
  });

  describe('Anthropic provider', () => {
    it('uses Anthropic API format', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic summary' }],
        }),
      });

      // Use unique title to avoid cache hits from previous tests
      const result = await summarizeArticle('Anthropic Test Title ' + Date.now(), 'Anthropic Content');

      expect(result).toBe('Anthropic summary');
      expect(mockFetch.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
    });
  });

  describe('Error handling', () => {
    it('throws error when no AI provider configured', async () => {
      // Use unique title to avoid cache hits
      await expect(summarizeArticle('No Provider Test ' + Date.now(), 'Content'))
        .rejects.toThrow('No AI provider configured');
    });

    it('throws error on API failure', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      });

      // Use unique title to avoid cache hits
      await expect(summarizeArticle('API Failure Test ' + Date.now(), 'Content'))
        .rejects.toThrow('AI API error');
    });
  });
});
