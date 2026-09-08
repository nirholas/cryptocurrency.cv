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
 * Export Jobs API
 * 
 * List and manage export jobs
 * 
 * @route GET /api/export/jobs - List all export jobs
 */

import { type NextRequest, NextResponse } from 'next/server';
import { listExportJobs, cleanupOldJobs } from '@/lib/data-export';

export const runtime = 'edge';

/**
 * GET /api/export/jobs
 * 
 * List all export jobs
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | undefined;
    const cleanup = searchParams.get('cleanup') === 'true';
    
    // Optionally cleanup old jobs
    if (cleanup) {
      const maxAgeMs = parseInt(searchParams.get('maxAge') || '3600000'); // 1 hour default
      cleanupOldJobs(maxAgeMs);
    }

    const jobs = listExportJobs(status);

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        format: job.options.format,
        limit: job.options.limit,
        compress: job.options.compress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
        result: job.result ? {
          filename: job.result.filename,
          size: job.result.size,
          sizeHuman: formatBytes(job.result.size),
          rowCount: job.result.rowCount,
          checksum: job.result.checksum,
          exportedAt: job.result.exportedAt,
        } : undefined,
      })),
      _links: {
        create: { method: 'POST', href: '/api/export' },
      },
    });
  } catch (error) {
    console.error('List export jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to list export jobs' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
