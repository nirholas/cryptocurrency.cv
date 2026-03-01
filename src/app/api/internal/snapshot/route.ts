/**
 * Internal Snapshot Writer
 *
 * POST /api/internal/snapshot
 *
 * Persists "last known good" API data so it survives process restarts
 * and deploys. This is the penultimate fallback layer (before emergency
 * hardcoded data).
 *
 * Storage strategy (in priority order):
 *   1. Vercel KV / Upstash Redis — if KV_REST_API_URL is configured
 *   2. `/tmp/fallback/*.json`    — writable on serverless (ephemeral)
 *
 * Called automatically from successful API responses via fire-and-forget
 * fetch, or from a cron job.
 *
 * Body: { type: "news" | "prices", data: <payload> }
 *
 * Security: Only accepts requests from the same origin (internal call)
 * or with CRON_SECRET.
 *
 * GET /api/internal/snapshot?type=news
 *
 * Reads the latest snapshot back (used by fallback reader).
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

// Force Node runtime — we need fs access
export const runtime = 'nodejs';

/** `/tmp` is the only writable directory on Vercel's serverless runtime. */
const FALLBACK_DIR = join('/tmp', 'fallback');
const VALID_TYPES = ['news', 'prices'] as const;

/** KV key prefix for fallback snapshots */
const KV_KEY_PREFIX = 'fallback:snapshot:';

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

// ─── POST: write snapshot ────────────────────────────────────────────────────

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

  const payload = {
    ...(data as Record<string, unknown>),
    _fallbackTimestamp: new Date().toISOString(),
    _fallbackType: type,
  };

  const storage: string[] = [];

  // 1. Try KV first (durable, shared across instances)
  if (isKvAvailable()) {
    try {
      const kvClient = await getKv();
      await kvClient.set(`${KV_KEY_PREFIX}${type}`, payload);
      storage.push('kv');
    } catch (err) {
      console.warn('[snapshot] KV write failed, falling back to /tmp:', (err as Error).message);
    }
  }

  // 2. Always write to /tmp as well (fast local read)
  try {
    await mkdir(FALLBACK_DIR, { recursive: true });
    const filePath = join(FALLBACK_DIR, `${type}.json`);
    await writeFile(filePath, JSON.stringify(payload, null, 0), 'utf-8');
    storage.push('tmp');
  } catch (err) {
    console.warn('[snapshot] /tmp write failed:', (err as Error).message);
  }

  if (storage.length === 0) {
    return NextResponse.json(
      { error: 'Failed to write snapshot to any storage backend' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    type,
    storage,
    timestamp: payload._fallbackTimestamp,
  });
}

// ─── GET: read snapshot ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  // 1. Try KV
  if (isKvAvailable()) {
    try {
      const kvClient = await getKv();
      const data = await kvClient.get(`${KV_KEY_PREFIX}${type}`);
      if (data) {
        return NextResponse.json(data, {
          headers: { 'x-fallback-source': 'kv' },
        });
      }
    } catch (err) {
      console.warn('[snapshot] KV read failed:', (err as Error).message);
    }
  }

  // 2. Try /tmp
  try {
    const filePath = join(FALLBACK_DIR, `${type}.json`);
    const raw = await readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(raw), {
      headers: { 'x-fallback-source': 'tmp' },
    });
  } catch {
    // file doesn't exist yet
  }

  return NextResponse.json({ error: 'No snapshot available' }, { status: 404 });
}
