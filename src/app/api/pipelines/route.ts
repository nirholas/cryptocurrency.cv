/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Data Pipeline API
 *
 * @route GET  /api/pipelines — List pipelines + freshness report
 * @route POST /api/pipelines — Trigger a pipeline execution
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getPipelineExecutor, generateFreshnessReport } from '@/lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min for pipeline execution

/**
 * GET /api/pipelines — Freshness dashboard
 */
export async function GET() {
  try {
    const executor = getPipelineExecutor();
    const report = await generateFreshnessReport(executor);
    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    });
  } catch (error) {
    console.error('pipelines route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate pipeline report', message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pipelines — Execute a pipeline
 * Body: { pipelineId: string }
 */
export async function POST(request: NextRequest) {
  // Require admin auth or cron secret
  const auth = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET ?? process.env.ADMIN_TOKEN;
  const isInternal = request.headers.get('x-internal-cron') === '1';

  if (!isInternal && (!cronSecret || auth !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pipelineId } = await request.json() as { pipelineId: string };
    if (!pipelineId) {
      return NextResponse.json({ error: 'Missing pipelineId' }, { status: 400 });
    }

    const executor = getPipelineExecutor();
    const result = await executor.execute(pipelineId);

    return NextResponse.json({
      success: result.status === 'success',
      ...result,
    });
  } catch (error) {
    console.error('pipelines route error:', error);
    return NextResponse.json(
      { error: 'Pipeline execution failed', message: 'Internal server error' },
      { status: 500 },
    );
  }
}
