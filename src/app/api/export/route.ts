/**
 * Data Export API
 * 
 * Export data in multiple formats: JSON, CSV, Parquet, SQLite
 * 
 * @route GET /api/export - Export data synchronously
 * @route POST /api/export - Create async export job
 * @route GET /api/export/[jobId] - Check export job status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exportData,
  createExportJob,
  getExportJob,
  listExportJobs,
  NEWS_SCHEMA,
  MARKET_DATA_SCHEMA,
  PREDICTIONS_SCHEMA,
  SOCIAL_METRICS_SCHEMA,
  type ExportFormat,
  type ExportOptions,
  type ExportSchema,
} from '@/lib/data-export';

export const runtime = 'edge';

// Schema mapping
const SCHEMAS: Record<string, ExportSchema> = {
  news: NEWS_SCHEMA,
  market: MARKET_DATA_SCHEMA,
  predictions: PREDICTIONS_SCHEMA,
  social: SOCIAL_METRICS_SCHEMA,
};

// Mock data generators for demonstration
// In production, these would fetch from actual data sources
function generateMockNewsData(limit: number): Record<string, unknown>[] {
  return Array.from({ length: limit }, (_, i) => ({
    id: `news_${Date.now()}_${i}`,
    title: `Sample Crypto News Article ${i + 1}`,
    description: 'This is a sample article for export demonstration',
    content: 'Full article content would be here...',
    url: `https://example.com/news/${i}`,
    source: ['CoinDesk', 'CoinTelegraph', 'The Block'][i % 3],
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    collectedAt: new Date().toISOString(),
    sentiment: Math.random() * 2 - 1,
    tickers: ['BTC', 'ETH', 'SOL'].slice(0, (i % 3) + 1),
    entities: ['Bitcoin', 'Ethereum Foundation'],
    categories: ['market', 'technology'],
    aiSummary: 'AI-generated summary of the article.',
  }));
}

function generateMockMarketData(limit: number): Record<string, unknown>[] {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
  return symbols.slice(0, Math.min(limit, symbols.length)).map((symbol, i) => ({
    timestamp: new Date().toISOString(),
    symbol,
    price: [42000, 2800, 98, 310, 0.52, 0.45, 0.08, 35][i],
    volume24h: Math.random() * 1e10,
    marketCap: Math.random() * 1e12,
    priceChange24h: (Math.random() - 0.5) * 20,
    high24h: [43000, 2900, 102, 320, 0.55, 0.48, 0.09, 37][i],
    low24h: [41000, 2700, 95, 300, 0.50, 0.42, 0.07, 33][i],
    circulatingSupply: Math.random() * 1e9,
    totalSupply: Math.random() * 1e10,
  }));
}

function generateMockPredictions(limit: number): Record<string, unknown>[] {
  return Array.from({ length: limit }, (_, i) => ({
    id: `pred_${Date.now()}_${i}`,
    userId: `user_${Math.floor(Math.random() * 100)}`,
    type: ['price_above', 'price_below', 'percentage_up'][i % 3],
    symbol: ['BTC', 'ETH', 'SOL'][i % 3],
    targetPrice: 50000 + Math.random() * 10000,
    targetDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * i).toISOString(),
    status: ['pending', 'correct', 'incorrect'][i % 3],
    outcome: i % 3 === 0 ? null : 'resolved',
    accuracy: i % 3 === 0 ? null : Math.random() * 100,
  }));
}

function generateMockSocialData(limit: number): Record<string, unknown>[] {
  const symbols = ['BTC', 'ETH', 'SOL', 'DOGE'];
  return Array.from({ length: limit }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    symbol: symbols[i % symbols.length],
    source: ['twitter', 'reddit', 'telegram'][i % 3],
    mentions: Math.floor(Math.random() * 10000),
    sentiment: Math.random() * 2 - 1,
    volume: Math.floor(Math.random() * 50000),
    engagement: Math.random() * 100,
    influencerMentions: Math.floor(Math.random() * 50),
  }));
}

/**
 * GET /api/export
 * 
 * Synchronous data export (for smaller datasets)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const dataType = searchParams.get('type') || 'news';
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 10000);
    const dateFrom = searchParams.get('from') || undefined;
    const dateTo = searchParams.get('to') || undefined;
    const download = searchParams.get('download') === 'true';

    // Validate format
    const validFormats: ExportFormat[] = ['json', 'csv', 'parquet', 'sqlite', 'ndjson'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { 
          error: `Invalid format: ${format}`,
          validFormats,
        },
        { status: 400 }
      );
    }

    // Validate data type
    if (!SCHEMAS[dataType]) {
      return NextResponse.json(
        {
          error: `Invalid data type: ${dataType}`,
          validTypes: Object.keys(SCHEMAS),
        },
        { status: 400 }
      );
    }

    // Generate mock data (in production, fetch from database)
    let data: Record<string, unknown>[];
    switch (dataType) {
      case 'market':
        data = generateMockMarketData(limit);
        break;
      case 'predictions':
        data = generateMockPredictions(limit);
        break;
      case 'social':
        data = generateMockSocialData(limit);
        break;
      case 'news':
      default:
        data = generateMockNewsData(limit);
    }

    const options: ExportOptions = {
      format,
      dateFrom,
      dateTo,
      limit,
      schema: SCHEMAS[dataType],
    };

    const result = await exportData(data, options);

    // If download requested, return file
    if (download && result.data) {
      const contentTypes: Record<ExportFormat, string> = {
        json: 'application/json',
        csv: 'text/csv',
        ndjson: 'application/x-ndjson',
        parquet: 'application/json', // Actually parquet-json
        sqlite: 'application/sql',
      };

      const body = typeof result.data === 'string' 
        ? result.data 
        : new TextDecoder().decode(result.data);

      return new NextResponse(body, {
        headers: {
          'Content-Type': contentTypes[format],
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'X-Row-Count': String(result.rowCount),
          'X-Checksum': result.checksum,
        },
      });
    }

    // Return metadata and inline data
    return NextResponse.json({
      success: true,
      export: {
        format: result.format,
        filename: result.filename,
        size: result.size,
        sizeHuman: formatBytes(result.size),
        rowCount: result.rowCount,
        columns: result.columns,
        dateRange: result.dateRange,
        checksum: result.checksum,
        exportedAt: result.exportedAt,
      },
      data: result.data,
      _links: {
        download: `/api/export?type=${dataType}&format=${format}&limit=${limit}&download=true`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export
 * 
 * Create async export job for large datasets
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const {
      type = 'news',
      format = 'json',
      dateFrom,
      dateTo,
      symbols,
      limit = 100000,
      compress = false,
    } = body as {
      type?: string;
      format?: ExportFormat;
      dateFrom?: string;
      dateTo?: string;
      symbols?: string[];
      limit?: number;
      compress?: boolean;
    };

    // Validate
    if (!SCHEMAS[type]) {
      return NextResponse.json(
        { error: `Invalid type: ${type}`, validTypes: Object.keys(SCHEMAS) },
        { status: 400 }
      );
    }

    // Create job
    const jobId = createExportJob({
      format,
      dateFrom,
      dateTo,
      symbols,
      limit,
      compress,
      schema: SCHEMAS[type],
    });

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        status: 'pending',
        message: 'Export job created. Check status at /api/export/jobs/{jobId}',
      },
      _links: {
        status: `/api/export/jobs/${jobId}`,
        list: '/api/export/jobs',
      },
    }, { status: 202 });
  } catch (error) {
    console.error('Create export job error:', error);
    return NextResponse.json(
      { error: 'Failed to create export job' },
      { status: 500 }
    );
  }
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
