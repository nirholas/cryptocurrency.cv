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
 * Data Export API
 * 
 * Export data in multiple formats: JSON, CSV, Parquet, SQLite
 * Uses real data sources from our aggregation services.
 * 
 * @route GET /api/export - Export data synchronously
 * @route POST /api/export - Create async export job
 * @route GET /api/export/[jobId] - Check export job status
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  exportData,
  createExportJob,
  NEWS_SCHEMA,
  MARKET_DATA_SCHEMA,
  PREDICTIONS_SCHEMA,
  SOCIAL_METRICS_SCHEMA,
  type ExportFormat,
  type ExportOptions,
  type ExportSchema,
} from '@/lib/data-export';

// Import real data sources
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';
import { getTopCoins, type TokenPrice } from '@/lib/market-data';
import { getSocialTrends, type SocialTrend } from '@/lib/social-intelligence';
import { intParam } from '@/lib/query-params';
import { 
  getRecentPredictions, 
  type Prediction,
} from '@/lib/predictions/registry';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';

// Schema mapping
const SCHEMAS: Record<string, ExportSchema> = {
  news: NEWS_SCHEMA,
  market: MARKET_DATA_SCHEMA,
  predictions: PREDICTIONS_SCHEMA,
  social: SOCIAL_METRICS_SCHEMA,
};

/**
 * Fetch real news data from RSS feeds
 */
async function fetchNewsData(
  limit: number,
  dateFrom?: string,
  dateTo?: string
): Promise<Record<string, unknown>[]> {
  try {
    const response = await getLatestNews(limit, undefined, { 
      from: dateFrom, 
      to: dateTo 
    });
    
    return response.articles.map((article: NewsArticle) => ({
      id: `news_${Buffer.from(article.link).toString('base64').slice(0, 16)}`,
      title: article.title,
      description: article.description || '',
      url: article.link,
      source: article.source,
      sourceKey: article.sourceKey,
      category: article.category,
      publishedAt: article.pubDate,
      collectedAt: new Date().toISOString(),
      timeAgo: article.timeAgo,
    }));
  } catch (error) {
    console.error('Failed to fetch news data:', error);
    return [];
  }
}

/**
 * Fetch real market data from CoinGecko
 */
async function fetchMarketData(limit: number): Promise<Record<string, unknown>[]> {
  try {
    const coins = await getTopCoins(Math.min(limit, 250));
    
    return coins.map((coin: TokenPrice) => ({
      timestamp: coin.last_updated,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      coinId: coin.id,
      price: coin.current_price,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      priceChange24h: coin.price_change_percentage_24h,
      priceChange7d: coin.price_change_percentage_7d_in_currency || null,
      high24h: coin.ath, // ATH as proxy (CoinGecko doesn't provide 24h high in this endpoint)
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      athChangePercentage: coin.ath_change_percentage,
      image: coin.image,
    }));
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return [];
  }
}

/**
 * Fetch real prediction data from the prediction registry
 */
async function fetchPredictionData(limit: number): Promise<Record<string, unknown>[]> {
  try {
    const predictions = await getRecentPredictions(limit);
    
    return predictions.map((pred: Prediction) => ({
      id: pred.id,
      hash: pred.hash,
      predictorId: pred.predictorId,
      predictorName: pred.predictorName,
      predictorType: pred.predictorType,
      title: pred.title,
      description: pred.description,
      category: pred.category,
      tags: pred.tags,
      targetAsset: pred.targetAsset || null,
      targetMetric: pred.targetMetric || null,
      targetValue: pred.targetValue || null,
      targetCondition: pred.targetCondition || null,
      deadline: pred.deadline,
      createdAt: pred.createdAt,
      resolvedAt: pred.resolvedAt || null,
      status: pred.status,
      confidence: pred.confidence,
      confidencePercent: pred.confidencePercent,
      outcomeValue: pred.outcome?.actualValue || null,
      outcomeAccuracy: pred.outcome?.accuracyPercent || null,
      isVerified: pred.isVerified,
      upvotes: pred.upvotes,
      downvotes: pred.downvotes,
    }));
  } catch (error) {
    console.error('Failed to fetch prediction data:', error);
    return [];
  }
}

/**
 * Fetch real social metrics from our aggregation services
 */
async function fetchSocialData(limit: number): Promise<Record<string, unknown>[]> {
  try {
    const trends = await getSocialTrends();
    
    return trends.slice(0, limit).map((trend: SocialTrend, index: number) => ({
      timestamp: new Date().toISOString(),
      ticker: trend.ticker,
      name: trend.name,
      source: 'aggregated',
      mentions: trend.mentions,
      mentionChange24h: trend.mentionChange24h,
      uniqueAuthors: trend.uniqueAuthors,
      sentiment: trend.sentiment,
      sentimentChange24h: trend.sentimentChange24h,
      peakHour: trend.peakHour || null,
      relatedTickers: trend.relatedTickers,
      topChannels: trend.topChannels,
      topInfluencers: trend.topInfluencers.map(inf => inf.name),
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Failed to fetch social data:', error);
    return [];
  }
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
    const limit = intParam(searchParams, 'limit', { fallback: 100, min: 1, max: 10000 });
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

    // Fetch real data from our aggregation services
    let data: Record<string, unknown>[];
    switch (dataType) {
      case 'market':
        data = await fetchMarketData(limit);
        break;
      case 'predictions':
        data = await fetchPredictionData(limit);
        break;
      case 'social':
        data = await fetchSocialData(limit);
        break;
      case 'news':
      default:
        data = await fetchNewsData(limit, dateFrom, dateTo);
    }

    // Return empty result with message if no data
    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No data available for the requested parameters',
        export: {
          format,
          rowCount: 0,
          exportedAt: new Date().toISOString(),
        },
        data: [],
      });
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
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    
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

    // Cap limit to prevent abuse (10K max, same as GET)
    const cappedLimit = Math.min(limit, 10_000);

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
      limit: cappedLimit,
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
