import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as ai from './ai-provider';
import { analyzeChart, analyzeOHLCData, ChartAnalysisNotConfiguredError } from './ai-chart-analysis';

const KEYS = ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const saved: Partial<Record<(typeof KEYS)[number], string>> = {};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('ai-chart-analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  describe('analyzeChart', () => {
    it('throws ChartAnalysisNotConfiguredError when no vision key is set', async () => {
      await expect(analyzeChart('AAAA', 'image/png')).rejects.toBeInstanceOf(ChartAnalysisNotConfiguredError);
    });

    it('fails over to the next provider and returns its analysis', async () => {
      process.env.ANTHROPIC_API_KEY = 'a';
      process.env.OPENAI_API_KEY = 'o';
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(jsonResponse({ error: 'quota' }, 429))
        .mockResolvedValueOnce(
          jsonResponse({ choices: [{ message: { content: JSON.stringify({ bias: 'bullish', confidence: 80 }) } }] }),
        );

      const result = await analyzeChart('AAAA', 'image/png', 'BTC', '1d');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.bias).toBe('bullish');
      expect(result.confidence).toBe(80);
    });

    it('reports quota and outages on every provider as AIAllProvidersUnavailableError', async () => {
      process.env.ANTHROPIC_API_KEY = 'a';
      process.env.OPENAI_API_KEY = 'o';
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(jsonResponse({}, 402))
        .mockResolvedValueOnce(jsonResponse({}, 503));

      const error = await analyzeChart('AAAA', 'image/png').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ai.AIAllProvidersUnavailableError);
      expect(ai.isAIUnavailableError(error)).toBe(true);
    });

    it('rethrows a failure that is not a provider refusal', async () => {
      process.env.OPENAI_API_KEY = 'o';
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({}, 400));

      const error = await analyzeChart('AAAA', 'image/png').catch((e: unknown) => e);
      expect(ai.isAIUnavailableError(error)).toBe(false);
      expect((error as Error).message).toBe('OpenAI vision error: 400');
    });
  });

  describe('analyzeOHLCData', () => {
    const candles = [
      { timestamp: 1_700_000_000_000, open: 1, high: 2, low: 0.5, close: 0 },
      { timestamp: 1_700_086_400_000, open: 1, high: 2, low: 0.5, close: 1.5 },
    ];

    it('throws ChartAnalysisNotConfiguredError when no provider is configured', async () => {
      vi.spyOn(ai, 'getAIConfigOrNull').mockReturnValue(null);
      await expect(analyzeOHLCData(candles, 'BTC', '1d')).rejects.toBeInstanceOf(ChartAnalysisNotConfiguredError);
    });

    it('builds a prompt without NaN when the previous close is zero', async () => {
      vi.spyOn(ai, 'getAIConfigOrNull').mockReturnValue({ provider: 'groq', model: 'm', apiKey: 'k' });
      const complete = vi.spyOn(ai, 'aiComplete').mockResolvedValue(JSON.stringify({ bias: 'bearish' }));

      const result = await analyzeOHLCData(candles, 'BTC', '1d');
      expect(result.bias).toBe('bearish');
      expect(complete.mock.calls[0][1]).toContain('CHANGE: n/a');
      expect(complete.mock.calls[0][1]).not.toContain('NaN');
    });

    it('throws SyntaxError when the model returns something other than a JSON object', async () => {
      vi.spyOn(ai, 'getAIConfigOrNull').mockReturnValue({ provider: 'groq', model: 'm', apiKey: 'k' });
      vi.spyOn(ai, 'aiComplete').mockResolvedValueOnce('not json').mockResolvedValueOnce('null');

      await expect(analyzeOHLCData(candles, 'BTC', '1d')).rejects.toBeInstanceOf(SyntaxError);
      await expect(analyzeOHLCData(candles, 'BTC', '1d')).rejects.toBeInstanceOf(SyntaxError);
    });
  });
});
