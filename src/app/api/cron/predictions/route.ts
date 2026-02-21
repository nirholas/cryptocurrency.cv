/**
 * AI Price Prediction Cron Job
 *
 * Runs daily at midnight UTC (configured in vercel.json).
 * 1. Fetches current prices for BTC, ETH, SOL, XRP from CoinGecko.
 * 2. Uses AI to generate 24h and 7d price predictions with reasoning.
 * 3. Writes archive/predictions/YYYY-MM-DD.json.
 * 4. Scores yesterday's predictions against today's actual prices and
 *    updates yesterday's file with a "results" field.
 *
 * Archive file schema:
 * {
 *   date: string,
 *   predictions: AIPrediction[],
 *   results?: ScoredResult[]   // populated the next day
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { COINGECKO_BASE } from '@/lib/constants';
import { getAIConfigOrNull, aiComplete } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIPrediction {
  coin: string;
  coingecko_id: string;
  current_price: number;
  predicted_24h: number;
  predicted_7d: number;
  reasoning: string;
  confidence: number; // 0–1
  model: string;
  timestamp: string;
}

export interface ScoredResult {
  coin: string;
  coingecko_id: string;
  predicted_price_24h: number;
  actual_price: number;
  delta_pct: number;
  direction_correct: boolean;
  scored_at: string;
}

export interface DailyPredictionFile {
  date: string;
  predictions: AIPrediction[];
  results?: ScoredResult[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'ripple', symbol: 'XRP' },
];

const ARCHIVE_DIR = path.join(process.cwd(), 'archive', 'predictions');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function archivePath(date: string): string {
  return path.join(ARCHIVE_DIR, `${date}.json`);
}

async function readDailyFile(date: string): Promise<DailyPredictionFile | null> {
  try {
    const raw = await fs.readFile(archivePath(date), 'utf-8');
    return JSON.parse(raw) as DailyPredictionFile;
  } catch {
    return null;
  }
}

async function writeDailyFile(data: DailyPredictionFile): Promise<void> {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.writeFile(archivePath(data.date), JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Fetch live prices from CoinGecko
// ---------------------------------------------------------------------------

async function fetchPrices(): Promise<Record<string, number>> {
  const ids = COINS.map(c => c.id).join(',');
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json() as Record<string, { usd: number }>;
  return Object.fromEntries(
    Object.entries(data).map(([id, v]) => [id, v.usd])
  );
}

// ---------------------------------------------------------------------------
// Generate AI predictions
// ---------------------------------------------------------------------------

async function generatePredictions(
  prices: Record<string, number>,
  config: NonNullable<ReturnType<typeof getAIConfigOrNull>>
): Promise<AIPrediction[]> {
  const now = new Date().toISOString();
  const priceLines = COINS.map(c => `${c.symbol} (${c.id}): $${prices[c.id]?.toLocaleString() ?? 'N/A'}`).join('\n');

  const systemPrompt = `You are a quantitative crypto analyst. Your task is to produce short-term price predictions. Reply ONLY with valid JSON — no markdown, no commentary. The JSON must be an array of prediction objects.`;

  const userPrompt = `Current prices (UTC ${now}):
${priceLines}

For each coin, predict:
- predicted_24h: price after 24 hours
- predicted_7d: price after 7 days
- reasoning: 1-2 sentences of technical/macro rationale
- confidence: float 0.0–1.0

Respond ONLY with this JSON array (no markdown):
[
  {
    "coin": "BTC",
    "coingecko_id": "bitcoin",
    "current_price": 0,
    "predicted_24h": 0,
    "predicted_7d": 0,
    "reasoning": "...",
    "confidence": 0.0
  },
  ...
]`;

  const raw = await aiComplete(systemPrompt, userPrompt, {
    maxTokens: 800,
    temperature: 0.4,
    jsonMode: true,
  });

  // Extract JSON array from response (handle possible markdown fences)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    coin: string;
    coingecko_id: string;
    current_price: number;
    predicted_24h: number;
    predicted_7d: number;
    reasoning: string;
    confidence: number;
  }>;

  return parsed.map(p => ({
    coin: p.coin,
    coingecko_id: p.coingecko_id,
    current_price: prices[p.coingecko_id] ?? p.current_price,
    predicted_24h: p.predicted_24h,
    predicted_7d: p.predicted_7d,
    reasoning: p.reasoning,
    confidence: Math.min(1, Math.max(0, p.confidence ?? 0.5)),
    model: config.model,
    timestamp: now,
  }));
}

// ---------------------------------------------------------------------------
// Score yesterday's predictions
// ---------------------------------------------------------------------------

async function scoreYesterdayPredictions(
  currentPrices: Record<string, number>
): Promise<void> {
  const yesterday = isoDate(new Date(Date.now() - 86_400_000));
  const file = await readDailyFile(yesterday);
  if (!file) return; // No file to score
  if (file.results && file.results.length > 0) return; // Already scored

  const scoredAt = new Date().toISOString();

  const results: ScoredResult[] = file.predictions
    .filter(p => currentPrices[p.coingecko_id] !== undefined)
    .map(p => {
      const actual = currentPrices[p.coingecko_id];
      const delta_pct = ((actual - p.predicted_24h) / p.predicted_24h) * 100;
      // Direction correct: if predicted > current (was bullish), actual > current_at_prediction
      const predictedUp = p.predicted_24h > p.current_price;
      const actualUp = actual > p.current_price;
      return {
        coin: p.coin,
        coingecko_id: p.coingecko_id,
        predicted_price_24h: p.predicted_24h,
        actual_price: actual,
        delta_pct: Math.round(delta_pct * 100) / 100,
        direction_correct: predictedUp === actualUp,
        scored_at: scoredAt,
      };
    });

  file.results = results;
  await writeDailyFile(file);
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Authenticate in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today = isoDate(new Date());

  try {
    // 1. Fetch current prices
    const prices = await fetchPrices();

    // 2. Score yesterday's predictions (before writing today's)
    await scoreYesterdayPredictions(prices);

    // 3. Check if today's file already exists (idempotent)
    const existing = await readDailyFile(today);
    if (existing && existing.predictions.length > 0) {
      return NextResponse.json({
        success: true,
        date: today,
        message: 'Predictions already written for today',
        predictions: existing.predictions.length,
      });
    }

    // 4. Get AI config
    const aiConfig = getAIConfigOrNull(true); // prefer Groq for speed
    if (!aiConfig) {
      return NextResponse.json(
        { success: false, error: 'No AI provider configured' },
        { status: 503 }
      );
    }

    // 5. Generate predictions
    const predictions = await generatePredictions(prices, aiConfig);

    // 6. Write today's file
    const dailyFile: DailyPredictionFile = {
      date: today,
      predictions,
    };
    await writeDailyFile(dailyFile);

    return NextResponse.json({
      success: true,
      date: today,
      predictions: predictions.length,
      coins: predictions.map(p => p.coin),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/predictions]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
