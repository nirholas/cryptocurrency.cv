/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { jobQueue } from '@/lib/scale/index';

export const runtime = 'nodejs';

/**
 * GET /api/admin/queue — Queue metrics (pending, active, failed, dead)
 * GET /api/admin/queue?view=dead — List dead letter jobs
 */
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'dead') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000);
      const jobs = await jobQueue.getDeadLetterJobs(limit);
      return NextResponse.json({ deadLetterJobs: jobs, count: jobs.length });
    }

    const metrics = await jobQueue.getMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/queue — Queue management actions
 * Body: { action: 'retry', jobId: string } — Retry a dead letter job
 * Body: { action: 'purge' }               — Purge all dead letter jobs
 */
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as { action?: string; jobId?: string };
    const { action, jobId } = body;

    if (action === 'retry') {
      if (!jobId || typeof jobId !== 'string') {
        return NextResponse.json({ error: 'jobId is required for retry action' }, { status: 400 });
      }
      await jobQueue.retryDeadLetterJob(jobId);
      return NextResponse.json({ success: true, retried: jobId });
    }

    if (action === 'purge') {
      const count = await jobQueue.purgeDeadLetter();
      return NextResponse.json({ success: true, purged: count });
    }

    return NextResponse.json({ error: 'Unknown action. Use "retry" or "purge".' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
