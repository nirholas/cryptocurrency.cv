/**
 * AI Prediction History API
 * GET /api/predictions/history
 *
 * Reads the last 30 daily AI prediction files from archive/predictions/
 * and returns accuracy stats per coin plus raw daily data.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/** Daily prediction file shape (defined locally since cron route may not exist) */
interface DailyPredictionFile {
  date: string;
  predictions: { coin: string; direction: string; confidence: number; [key: string]: unknown }[];
  results?: { coin: string; direction_correct: boolean; [key: string]: unknown }[];
  [key: string]: unknown;
}

export const revalidate = 3600; // Re-validate every hour

const ARCHIVE_DIR = path.join(process.cwd(), 'archive', 'predictions');
const DAILY_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CoinAccuracy {
  coin: string;
  correct: number;
  total: number;
  accuracy_pct: number;
  /** True/false per day, newest-last */
  sparkline: (boolean | null)[];
}

export interface PredictionHistoryResponse {
  days: DailyPredictionFile[];
  accuracy: Record<string, CoinAccuracy>;
  latest: DailyPredictionFile | null;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // List all daily files
    let entries: string[] = [];
    try {
      entries = await fs.readdir(ARCHIVE_DIR);
    } catch {
      // Directory doesn't exist yet
    }

    const dailyFiles = entries
      .filter(f => DAILY_FILE_RE.test(f))
      .sort() // lexicographic == date order
      .slice(-30); // last 30 days

    // Read files in parallel
    const days: DailyPredictionFile[] = (
      await Promise.all(
        dailyFiles.map(async f => {
          try {
            const raw = await fs.readFile(path.join(ARCHIVE_DIR, f), 'utf-8');
            return JSON.parse(raw) as DailyPredictionFile;
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean) as DailyPredictionFile[];

    // Build per-coin accuracy using scored results
    const coinsSet = new Set<string>();
    days.forEach((d: DailyPredictionFile) => d.predictions.forEach((p: { coin: string }) => coinsSet.add(p.coin)));

    const accuracy: Record<string, CoinAccuracy> = {};

    for (const coin of coinsSet) {
      const sparkline: (boolean | null)[] = days.map(day => {
        const result = day.results?.find((r: { coin: string; direction_correct: boolean }) => r.coin === coin);
        if (!result) return null;
        return result.direction_correct;
      });

      const scored = sparkline.filter(v => v !== null) as boolean[];
      const correct = scored.filter(Boolean).length;

      accuracy[coin] = {
        coin,
        correct,
        total: scored.length,
        accuracy_pct: scored.length > 0 ? Math.round((correct / scored.length) * 100) : 0,
        sparkline,
      };
    }

    const latest = days.length > 0 ? days[days.length - 1] : null;

    const response: PredictionHistoryResponse = {
      days,
      accuracy,
      latest,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[predictions/history]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
