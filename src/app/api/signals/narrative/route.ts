import { NextRequest, NextResponse } from 'next/server';
import { aiComplete, getAIConfigOrNull } from '@/lib/ai-provider';

export const runtime = 'edge';

interface TradingSignal {
  ticker: string;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  timeframe: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  newsEvents?: string[];
  catalysts?: string[];
}

interface PerSignalExplanation {
  signal_id: string;
  explanation: string;
}

interface NarrativeResponse {
  narrative: string;
  per_signal: PerSignalExplanation[];
  generated_at: string;
  model_used: string;
}

interface AIResult {
  narrative: string;
  per_signal: PerSignalExplanation[];
}

// In-memory cache: fingerprint -> { data, expires }
const cache = new Map<string, { data: NarrativeResponse; expires: number }>();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Deterministic fingerprint of a signal array */
function fingerprintSignals(signals: TradingSignal[]): string {
  const key = signals
    .map(s => `${s.ticker}:${s.signal}:${s.confidence}:${s.timeframe}`)
    .sort()
    .join('|');
  return key;
}

const SYSTEM_PROMPT = `You are a concise crypto market analyst. Given a list of trading signals, produce:
1. A unified 3-4 sentence market narrative synthesising ALL signals together.
2. A short plain-English explanation (1-2 sentences) for EACH individual signal.

Rules:
- Be factual and grounded; avoid hype.
- Use plain English — no markdown, no bullet points.
- Do NOT give financial advice; frame insights as observations.

Respond ONLY with valid JSON matching this schema exactly:
{
  "narrative": "<3-4 sentences>",
  "per_signal": [
    { "signal_id": "<ticker>", "explanation": "<1-2 sentences>" }
  ]
}`;

async function generateNarrative(signals: TradingSignal[]): Promise<NarrativeResponse> {
  const fingerprint = fingerprintSignals(signals);

  // Check cache first
  const cached = cache.get(fingerprint);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const config = getAIConfigOrNull(/* preferGroq */ true);
  if (!config) {
    throw new Error('No AI provider configured');
  }

  const signalSummary = signals.map(s => ({
    ticker: s.ticker,
    signal: s.signal,
    confidence: s.confidence,
    timeframe: s.timeframe,
    reasoning: s.reasoning,
    riskLevel: s.riskLevel,
    ...(s.newsEvents?.length ? { newsEvents: s.newsEvents.slice(0, 3) } : {}),
    ...(s.catalysts?.length ? { catalysts: s.catalysts.slice(0, 2) } : {}),
  }));

  const userPrompt = `Here are the current trading signals:\n${JSON.stringify(signalSummary, null, 2)}\n\nGenerate the market narrative and per-signal explanations.`;

  const raw = await aiComplete(SYSTEM_PROMPT, userPrompt, {
    maxTokens: 800,
    temperature: 0.4,
    jsonMode: true,
    title: 'Crypto Market Narrative',
  }, /* preferGroq */ true);

  let parsed: AIResult;
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }

  const result: NarrativeResponse = {
    narrative: parsed.narrative || '',
    per_signal: Array.isArray(parsed.per_signal) ? parsed.per_signal : [],
    generated_at: new Date().toISOString(),
    model_used: config.model,
  };

  cache.set(fingerprint, { data: result, expires: Date.now() + CACHE_TTL_MS });

  // Evict stale entries to prevent unbounded growth
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expires <= now) cache.delete(k);
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const signalsParam = searchParams.get('signals');

  let signals: TradingSignal[];

  if (signalsParam) {
    try {
      signals = JSON.parse(decodeURIComponent(signalsParam));
      if (!Array.isArray(signals) || signals.length === 0) {
        return NextResponse.json({ error: 'signals must be a non-empty array' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signals JSON' }, { status: 400 });
    }
  } else {
    // Fetch from the signals API directly
    try {
      const baseUrl = request.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/signals?limit=10`, {
        headers: { 'x-internal': '1' },
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 502 });
      }
      const data = await res.json();
      signals = data.signals || [];
    } catch {
      return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 502 });
    }

    if (signals.length === 0) {
      return NextResponse.json({ error: 'No signals available' }, { status: 404 });
    }
  }

  try {
    const result = await generateNarrative(signals);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
