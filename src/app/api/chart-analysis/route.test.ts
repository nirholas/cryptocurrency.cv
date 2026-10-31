import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as chart from '@/lib/ai-chart-analysis';
import * as ai from '@/lib/ai-provider';
import * as market from '@/lib/market-data';

import { GET, POST } from './route';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function post(body: unknown): NextRequest {
  return new NextRequest('https://example.test/api/chart-analysis', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function get(query: string): NextRequest {
  return new NextRequest(`https://example.test/api/chart-analysis${query}`);
}

const candle = { timestamp: 1_700_000_000_000, open: 1, high: 2, low: 0.5, close: 1.5 };
const analysis = { id: 'a', summary: 'ok' } as unknown as chart.ChartAnalysis;

describe('/api/chart-analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST', () => {
    it('analyzes a data-URL image, taking the mime type from the URL', async () => {
      const analyze = vi.spyOn(chart, 'analyzeChart').mockResolvedValue(analysis);
      const res = await POST(post({ image: `data:image/png;base64,${PNG_BASE64}`, symbol: 'BTC', timeframe: '4H' }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ analysis });
      expect(analyze).toHaveBeenCalledWith(PNG_BASE64, 'image/png', 'BTC', '4H');
    });

    it('rejects malformed input with 400 before calling a provider', async () => {
      const analyze = vi.spyOn(chart, 'analyzeChart');
      const cases: unknown[] = [
        'not json',
        [],
        { mimeType: 'image/png' },
        { image: 42, mimeType: 'image/png' },
        { image: PNG_BASE64 },
        { image: PNG_BASE64, mimeType: 'application/pdf' },
        { image: 'not base64!', mimeType: 'image/png' },
        { image: PNG_BASE64, mimeType: 'image/png', symbol: { $ne: 1 } },
        { image: PNG_BASE64, mimeType: 'image/png', timeframe: 'x'.repeat(100) },
      ];
      for (const body of cases) {
        const res = await POST(post(body));
        expect(res.status, JSON.stringify(body)).toBe(400);
      }
      expect(analyze).not.toHaveBeenCalled();
    });

    it('rejects images over 10 MB with 413', async () => {
      const res = await POST(post({ image: 'A'.repeat(14 * 1024 * 1024), mimeType: 'image/png' }));
      expect(res.status).toBe(413);
    });

    it('maps exhausted providers to a generic 503', async () => {
      vi.spyOn(chart, 'analyzeChart').mockRejectedValue(
        new ai.AIAllProvidersUnavailableError(['Claude vision rate-limited / out of quota: 429']),
      );
      const res = await POST(post({ image: PNG_BASE64, mimeType: 'image/png' }));
      expect(res.status).toBe(503);
      expect((await res.json()).error).toBe(ai.AI_UNAVAILABLE_MESSAGE);
    });

    it('maps a missing provider key to 503 and hides unexpected errors behind a generic 500', async () => {
      vi.spyOn(chart, 'analyzeChart').mockRejectedValueOnce(new chart.ChartAnalysisNotConfiguredError('no keys'));
      expect((await POST(post({ image: PNG_BASE64, mimeType: 'image/png' }))).status).toBe(503);

      vi.spyOn(chart, 'analyzeChart').mockRejectedValueOnce(new Error('secret upstream detail'));
      const res = await POST(post({ image: PNG_BASE64, mimeType: 'image/png' }));
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain('secret');
    });
  });

  describe('GET', () => {
    it('clamps days and analyzes the candles', async () => {
      const ohlc = vi.spyOn(market, 'getOHLC').mockResolvedValue([candle]);
      const analyze = vi.spyOn(chart, 'analyzeOHLCData').mockResolvedValue(analysis);

      expect((await GET(get('?symbol=ethereum&days=abc'))).status).toBe(200);
      expect(ohlc).toHaveBeenLastCalledWith('ethereum', 30);
      expect(analyze).toHaveBeenLastCalledWith([candle], 'ETHEREUM', '1d');

      await GET(get('?symbol=ethereum&days=99999'));
      expect(ohlc).toHaveBeenLastCalledWith('ethereum', 365);
      await GET(get('?symbol=ethereum&days=-5'));
      expect(ohlc).toHaveBeenLastCalledWith('ethereum', 1);
    });

    it('rejects symbols that are not coin ids before fetching market data', async () => {
      const ohlc = vi.spyOn(market, 'getOHLC');
      for (const symbol of ['../../simple/price', 'bit coin', 'x'.repeat(101)]) {
        expect((await GET(get(`?symbol=${encodeURIComponent(symbol)}`))).status).toBe(400);
      }
      expect(ohlc).not.toHaveBeenCalled();
    });

    it('returns 404 when no valid candles come back', async () => {
      vi.spyOn(market, 'getOHLC').mockResolvedValue([{ ...candle, close: Number.NaN }]);
      const analyze = vi.spyOn(chart, 'analyzeOHLCData');
      expect((await GET(get('?symbol=bitcoin'))).status).toBe(404);
      expect(analyze).not.toHaveBeenCalled();
    });

    it('maps market-data failures to 502, provider refusals to 503 and bad model JSON to 502', async () => {
      vi.spyOn(market, 'getOHLC').mockRejectedValueOnce(new Error('binance down'));
      expect((await GET(get('?symbol=bitcoin'))).status).toBe(502);

      vi.spyOn(market, 'getOHLC').mockResolvedValue([candle]);
      const analyze = vi.spyOn(chart, 'analyzeOHLCData');

      analyze.mockRejectedValueOnce(new ai.AIAllProvidersUnavailableError(['Groq rate-limited']));
      const unavailable = await GET(get('?symbol=bitcoin'));
      expect(unavailable.status).toBe(503);
      expect(unavailable.headers.get('Cache-Control')).toBe('no-store');

      analyze.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
      expect((await GET(get('?symbol=bitcoin'))).status).toBe(502);
    });
  });
});
