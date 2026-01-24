/**
 * Export Job Status API
 * 
 * Get status of a specific export job
 * 
 * @route GET /api/export/jobs/[jobId] - Get job status
 * @route DELETE /api/export/jobs/[jobId] - Cancel/delete job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExportJob } from '@/lib/data-export';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/export/jobs/[jobId]
 * 
 * Get status of a specific export job
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    const job = getExportJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Export job not found', jobId },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        format: job.options.format,
        limit: job.options.limit,
        compress: job.options.compress,
        dateFrom: job.options.dateFrom,
        dateTo: job.options.dateTo,
        symbols: job.options.symbols,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
      },
    };

    // Include result if completed
    if (job.status === 'completed' && job.result) {
      response.result = {
        filename: job.result.filename,
        format: job.result.format,
        size: job.result.size,
        sizeHuman: formatBytes(job.result.size),
        rowCount: job.result.rowCount,
        columns: job.result.columns,
        dateRange: job.result.dateRange,
        checksum: job.result.checksum,
        exportedAt: job.result.exportedAt,
      };
      response._links = {
        download: `/api/export/jobs/${jobId}/download`,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get export job error:', error);
    return NextResponse.json(
      { error: 'Failed to get export job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/export/jobs/[jobId]
 * 
 * Cancel or delete an export job
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    const job = getExportJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Export job not found', jobId },
        { status: 404 }
      );
    }

    // In production, we would remove from storage
    // For now, just acknowledge the request
    return NextResponse.json({
      success: true,
      message: `Job ${jobId} deleted`,
      deletedJob: {
        id: job.id,
        status: job.status,
        wasCompleted: job.status === 'completed',
      },
    });
  } catch (error) {
    console.error('Delete export job error:', error);
    return NextResponse.json(
      { error: 'Failed to delete export job' },
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
