/**
 * Export Job Status and Download API
 * 
 * GET /api/exports/[id] - Get export job status
 * GET /api/exports/[id]/download - Download export result
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExportJob, getExportResult, getMonthlyArchive } from '@/lib/exports';

// =============================================================================
// GET - Job status or download
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get('download') === 'true';
  
  try {
    // Check if it's a monthly archive
    if (id.startsWith('archive_')) {
      const archive = getMonthlyArchive(id);
      
      if (!archive) {
        return NextResponse.json(
          { success: false, error: 'Archive not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        archive,
      });
    }
    
    // Get export job
    const job = getExportJob(id);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Export job not found' },
        { status: 404 }
      );
    }
    
    // Handle download request
    if (isDownload) {
      if (job.status !== 'completed') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Export not ready',
            status: job.status,
            progress: job.progress,
          },
          { status: 400 }
        );
      }
      
      const result = getExportResult(id);
      
      if (!result || !result.data) {
        return NextResponse.json(
          { success: false, error: 'Export data not available' },
          { status: 404 }
        );
      }
      
      // Determine content type
      const contentTypes: Record<string, string> = {
        json: 'application/json',
        csv: 'text/csv',
        parquet: 'application/octet-stream',
        sqlite: 'application/vnd.sqlite3',
      };
      
      const fileExtensions: Record<string, string> = {
        json: 'json',
        csv: 'csv',
        parquet: 'parquet',
        sqlite: 'db',
      };
      
      const contentType = contentTypes[result.format] || 'application/octet-stream';
      const extension = fileExtensions[result.format] || 'dat';
      const filename = `export_${job.dataType}_${Date.now()}.${extension}`;
      
      // Convert Buffer or string to valid body type
      const body = typeof result.data === 'string' 
        ? result.data 
        : new Uint8Array(result.data).buffer;

      return new NextResponse(body as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': result.byteSize.toString(),
          'X-Checksum-SHA256': result.checksum,
          'X-Record-Count': result.recordCount.toString(),
          'X-Schema-Version': result.schemaVersion,
        },
      });
    }
    
    // Return job status
    return NextResponse.json({
      success: true,
      job,
      isReady: job.status === 'completed',
      downloadUrl: job.status === 'completed' 
        ? `/api/exports/${id}?download=true` 
        : null,
    });
  } catch (error) {
    console.error('Export status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get export status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
