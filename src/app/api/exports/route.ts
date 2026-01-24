/**
 * Data Exports API
 * 
 * Endpoints for exporting data in various formats:
 * - JSON, CSV, Parquet, SQLite
 * - Streaming exports for large datasets
 * - Monthly archives
 * 
 * GET /api/exports - List export jobs
 * GET /api/exports?schema=true - Get available schemas
 * GET /api/exports/[id] - Get export job status
 * GET /api/exports/[id]/download - Download export
 * POST /api/exports - Create new export job
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createExportJob,
  listExportJobs,
  getAllSchemas,
  listMonthlyArchives,
  createMonthlyArchive,
  type ExportFormat,
  type DataType,
  type CompressionType,
} from '@/lib/exports';

// =============================================================================
// GET - List exports or schemas
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    // Return schemas
    if (searchParams.get('schema') === 'true') {
      const schemas = getAllSchemas();
      
      return NextResponse.json({
        success: true,
        schemaVersion: '1.0.0',
        schemas,
        formats: ['json', 'csv', 'parquet', 'sqlite'],
        compression: ['none', 'gzip', 'zstd'],
      });
    }
    
    // Return monthly archives
    if (searchParams.get('archives') === 'true') {
      const archives = listMonthlyArchives();
      
      return NextResponse.json({
        success: true,
        archives,
        count: archives.length,
      });
    }
    
    // List export jobs
    const jobs = listExportJobs();
    
    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Export list error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list exports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create export job
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      dataType,
      format = 'json',
      compression = 'none',
      startDate,
      endDate,
      limit,
      fields,
      includeMetadata = true,
      createArchive = false,
      archiveYear,
      archiveMonth,
    } = body;
    
    // Validate data type
    const validDataTypes: DataType[] = [
      'news', 'prices', 'predictions', 'alerts', 
      'influencers', 'sentiment', 'social', 'gas', 'defi', 'all'
    ];
    
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data type',
          validTypes: validDataTypes,
        },
        { status: 400 }
      );
    }
    
    // Validate format
    const validFormats: ExportFormat[] = ['json', 'csv', 'parquet', 'sqlite'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid format',
          validFormats,
        },
        { status: 400 }
      );
    }
    
    // Handle monthly archive creation
    if (createArchive) {
      if (!archiveYear || !archiveMonth) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'archiveYear and archiveMonth required for archive creation',
          },
          { status: 400 }
        );
      }
      
      const archive = await createMonthlyArchive(
        archiveYear,
        archiveMonth,
        Array.isArray(dataType) ? dataType : [dataType]
      );
      
      return NextResponse.json({
        success: true,
        archive,
        message: 'Monthly archive created',
      });
    }
    
    // Create export job
    const job = await createExportJob(dataType, {
      format,
      compression: compression as CompressionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      fields: Array.isArray(fields) ? fields : undefined,
      includeMetadata,
    });
    
    return NextResponse.json({
      success: true,
      job,
      message: 'Export job created',
      statusUrl: `/api/exports/${job.id}`,
      downloadUrl: `/api/exports/${job.id}/download`,
    });
  } catch (error) {
    console.error('Export creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create export',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
