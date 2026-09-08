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
import {
  queryArchiveV2,
  getArchiveV2Stats,
  getArchiveV2Index,
  getTrendingTickers,
  getMarketHistory,
  toNewsArticle,
} from '@/lib/archive-v2';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import {
  isDbAvailable,
  pgQueryArchive,
  pgGetArchiveStats,
  pgGetTrendingTickers,
  pgGetMarketHistory,
} from '@/lib/db/queries';

export const runtime = 'edge';

/**
 * GET /api/archive - Query historical news archive
 * 
 * Access 662,000+ crypto news articles from 2017-2025.
 * 
 * Query Parameters:
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 * - source: Filter by source name
 * - ticker: Filter by cryptocurrency ticker (BTC, ETH, etc.)
 * - q: Search query
 * - sentiment: Filter by sentiment (positive, negative, neutral)
 * - tags: Filter by tags (comma-separated)
 * - limit: Max results (default 50, max 200)
 * - offset: Pagination offset
 * - format: Response format (full, simple, minimal)
 * - lang: Language code for translation
 * - stats: If "true", return archive statistics only
 * - index: If "true", return archive index (by-source, by-ticker, by-date)
 * - trending: If "true", return trending tickers
 * - hours: Hours for trending (default 24, max 72)
 * - market: Get market history for month (YYYY-MM)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for stats-only request
    if (searchParams.get('stats') === 'true') {
      // Prefer Postgres stats, fall back to JSON archive
      const stats = isDbAvailable()
        ? await pgGetArchiveStats() ?? await getArchiveV2Stats()
        : await getArchiveV2Stats();
      
      if (!stats) {
        // 200, not 404: the endpoint exists and answered, the archive simply
        // has no content yet. A 404 here made every /archive page load print a
        // failed request in the console for a state the UI already handles.
        return NextResponse.json({
          success: false,
          stats: null,
          error: 'Archive not available',
          message: 'Historical archive has not been initialized yet'
        });
      }
      
      return NextResponse.json({
        success: true,
        stats
      });
    }
    
    // Check for index request
    if (searchParams.get('index') === 'true') {
      const indexType = searchParams.get('type') as 'by-source' | 'by-ticker' | 'by-date' || 'by-date';
      const index = await getArchiveV2Index(indexType);
      
      if (!index) {
        // 200 for the same reason as the stats branch above.
        return NextResponse.json({
          success: false,
          indexType,
          index: null,
          error: 'Archive index not available',
          message: 'Archive index has not been built yet'
        });
      }
      
      return NextResponse.json({
        success: true,
        indexType,
        index
      });
    }
    
    // Check for trending tickers request
    if (searchParams.get('trending') === 'true') {
      const hours = parseInt(searchParams.get('hours') || '24');
      const trending = isDbAvailable()
        ? await pgGetTrendingTickers(Math.min(hours, 72))
        : await getTrendingTickers(Math.min(hours, 72));
      
      return NextResponse.json({
        success: true,
        hours,
        tickers: trending
      });
    }
    
    // Check for market history request
    const marketMonth = searchParams.get('market');
    if (marketMonth) {
      const history = isDbAvailable()
        ? await pgGetMarketHistory(marketMonth)
        : await getMarketHistory(marketMonth);
      
      return NextResponse.json({
        success: true,
        month: marketMonth,
        data_points: history.length,
        history
      });
    }
    
    // Parse query parameters
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const source = searchParams.get('source') || undefined;
    const ticker = searchParams.get('ticker') || undefined;
    const search = searchParams.get('q') || undefined;
    const sentiment = searchParams.get('sentiment') as 'positive' | 'negative' | 'neutral' | undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const format = searchParams.get('format') || 'full';
    const lang = searchParams.get('lang') || 'en';
    
    // Validate language parameter
    if (lang !== 'en' && !isLanguageSupported(lang)) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported language',
        message: `Language '${lang}' is not supported`,
        supported: Object.keys(SUPPORTED_LANGUAGES)
      }, { status: 400 });
    }
    
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid start_date format',
        message: 'Use YYYY-MM-DD format'
      }, { status: 400 });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid end_date format',
        message: 'Use YYYY-MM-DD format'
      }, { status: 400 });
    }
    
    // Validate sentiment
    if (sentiment && !['positive', 'negative', 'neutral'].includes(sentiment)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sentiment value',
        message: 'Use positive, negative, or neutral'
      }, { status: 400 });
    }
    
    // Query archive — prefer Postgres, fall back to JSON/GitHub
    const result = isDbAvailable()
      ? await pgQueryArchive({
          startDate,
          endDate,
          source,
          ticker,
          search,
          sentiment,
          tags,
          limit,
          offset
        })
      : await queryArchiveV2({
          startDate,
          endDate,
          source,
          ticker,
          search,
          sentiment,
          tags,
          limit,
          offset
        });
    
    // Format response based on requested format
    let articles: unknown[];
    
    switch (format) {
      case 'minimal':
        // Just IDs and titles
        articles = result.articles.map(a => ({
          id: a.id,
          title: a.title,
          source: a.source,
          first_seen: a.first_seen,
          tickers: a.tickers,
          sentiment: a.sentiment.label
        }));
        break;
        
      case 'simple':
        // Backwards-compatible format
        articles = result.articles.map(a => toNewsArticle(a));
        break;
        
      case 'full':
      default:
        // Full enriched articles
        articles = result.articles;
        break;
    }
    
    // Translate articles if language is not English
    let translatedLang = 'en';
    
    if (lang !== 'en' && articles.length > 0) {
      try {
        articles = await translateArticles(articles as any, lang);
        translatedLang = lang;
      } catch (translateError) {
        console.error('Translation failed:', translateError);
        // Continue with original articles on translation failure
      }
    }
    
    return NextResponse.json({
      success: true,
      count: articles.length,
      total: result.total,
      pagination: result.pagination,
      lang: translatedLang,
      availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
      filters: {
        start_date: startDate || null,
        end_date: endDate || null,
        source: source || null,
        ticker: ticker || null,
        search: search || null,
        sentiment: sentiment || null,
        tags: tags || null
      },
      format,
      articles
    });
    
  } catch (error) {
    console.error('Archive API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query archive',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
