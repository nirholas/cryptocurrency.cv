/**
 * Internal Snapshot Writer
 *
 * POST /api/internal/snapshot
 *
 * Persists "last known good" API data to `public/fallback/*.json` so it
 * survives process restarts and deploys. These static files are the
 * penultimate fallback layer (before emergency hardcoded data).
 *
 * Called automatically from successful API responses via fire-and-forget
 * fetch, or from a cron job.
 *
 * Body: { type: "news" | "prices", data: <payload> }
 *
 * Security: Only accepts requests from the same origin (internal call)
 * or with CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Force Node runtime — we need fs access
export const runtime = 'nodejs';

const FALLBACK_DIR = join(process.cwd(), 'public', 'fallback');
const VALID_TYPES = ['news', 'prices'] as const;

export async function POST(request: NextRequest) {
  // Simple security: internal marker or cron secret
  const isInternal = request.headers.get('x-internal-snapshot') === '1';
  const cronSecret = process.env.CRON_SECRET;
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const isAuthed = isInternal || (cronSecret && authToken === cronSecret);

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { type?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, data } = body;
  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid "data"' }, { status: 400 });
  }

  try {
    await mkdir(FALLBACK_DIR, { recursive: true });

    const payload = {
      ...(data as Record<string, unknown>),
      _fallbackTimestamp: new Date().toISOString(),
      _fallbackType: type,
    };

    const filePath = join(FALLBACK_DIR, `${type}.json`);
    await writeFile(filePath, JSON.stringify(payload, null, 0), 'utf-8');

    return NextResponse.json({
      ok: true,
      type,
      file: `/fallback/${type}.json`,
      timestamp: payload._fallbackTimestamp,
    });
  } catch (err) {
    console.error('[snapshot] Failed to write fallback file:', err);
    return NextResponse.json(
      { error: 'Failed to write snapshot', details: (err as Error).message },
      { status: 500 },
    );
  }
}
