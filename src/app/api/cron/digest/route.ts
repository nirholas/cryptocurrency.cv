/**
 * Cron Job: AI Daily Digest Generation
 *
 * GET /api/cron/digest — Build and persist today's AI digest
 *
 * Schedule (add to vercel.json manually):
 *   { "path": "/api/cron/digest", "schedule": "0 8 * * *" }
 *
 * Security:
 *   - If CRON_SECRET is set → requires `Authorization: Bearer <secret>`
 *     or `?secret=<secret>` query param (Vercel native cron passes the header)
 *   - If CRON_SECRET is NOT set → endpoint is public (zero-config dev mode)
 *
 * Optional env vars:
 *   NEWSLETTER_WEBHOOK — URL to POST digest metadata to after generation
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // public in zero-config mode
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  const querySecret = request.nextUrl.searchParams.get('secret');
  return querySecret === secret;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const baseUrl = getBaseUrl();

    // ── 1. Fetch the AI digest from the digest route ────────────────────────
    const digestRes = await fetch(`${baseUrl}/api/digest?format=ai-digest`, {
      // Pass auth so the cron secret isn't required on the digest route
      headers: { 'x-internal-cron': '1' },
      // Bust any edge cache so we always get a fresh result for the new day
      cache: 'no-store',
    });

    if (!digestRes.ok) {
      const details = await digestRes.text().catch(() => String(digestRes.status));
      return NextResponse.json(
        { error: 'Digest fetch failed', details },
        { status: 502 }
      );
    }

    const digest = await digestRes.json();
    const date: string = digest.date ?? new Date().toISOString().slice(0, 10);

    // ── 2. Persist to archive/meta/ ─────────────────────────────────────────
    const filename = `daily-digest-${date}.json`;
    const filepath = path.join(process.cwd(), 'archive', 'meta', filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(digest, null, 2), 'utf-8');

    // ── 3. Optionally notify newsletter webhook ──────────────────────────────
    const webhookUrl = process.env.NEWSLETTER_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'daily-digest',
            date,
            sections_generated: digest.sections?.length ?? 0,
            digest_url: `${baseUrl}/api/digest?format=ai-digest`,
            generated_at: digest.generated_at,
          }),
        });
      } catch (webhookErr) {
        // Non-fatal — log but continue
        console.warn('Newsletter webhook failed:', String(webhookErr));
      }
    }

    return NextResponse.json({
      success: true,
      sections_generated: digest.sections?.length ?? 0,
      saved_to: `archive/meta/${filename}`,
    });
  } catch (error) {
    console.error('Cron digest error:', error);
    return NextResponse.json(
      { error: 'Cron digest failed', details: String(error) },
      { status: 500 }
    );
  }
}
