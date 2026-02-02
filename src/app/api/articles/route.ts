/**
 * Archive Articles API
 * 
 * RESTful API for accessing archived articles from Vercel KV.
 * 
 * @route GET /api/articles
 * @route GET /api/articles?slug={slug}
 * @route GET /api/articles?id={id}
 * @route GET /api/articles?date={YYYY-MM-DD}
 * @route GET /api/articles?ticker={ticker}
 * @route GET /api/articles?source={source}
 * @route GET /api/articles?q={query}
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getArticleById,
  getArticleBySlug,
  getRecentArticles,
  getArticlesByDate,
  getArticlesByTicker,
  getArticlesBySource,
  searchArticles,
  getArchiveStats,
  type ArchivedArticle,
} from '@/lib/archive-service';

export const runtime = 'edge';
export const revalidate = 60; // Cache for 1 minute

interface ArticleResponse {
  id: string;
  slug: string;
  title: string;
  link: string;
  description: string;
  source: string;
  sourceKey: string;
  pubDate: string;
  tickers: string[];
  tags: string[];
  sentiment: {
    label: string;
    score: number;
  };
}

function formatArticle(article: ArchivedArticle): ArticleResponse {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    link: article.link,
    description: article.description,
    source: article.source,
    sourceKey: article.sourceKey,
    pubDate: article.pubDate,
    tickers: article.tickers,
    tags: article.tags,
    sentiment: {
      label: article.sentiment.label,
      score: article.sentiment.score,
    },
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  
  try {
    // Single article by slug
    const slug = searchParams.get('slug');
    if (slug) {
      const article = await getArticleBySlug(slug);
      
      if (!article) {
        return NextResponse.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        article: formatArticle(article),
        duration: Date.now() - startTime,
      });
    }
    
    // Single article by ID
    const id = searchParams.get('id');
    if (id) {
      const article = await getArticleById(id);
      
      if (!article) {
        return NextResponse.json(
          { success: false, error: 'Article not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        article: formatArticle(article),
        duration: Date.now() - startTime,
      });
    }
    
    // Stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getArchiveStats();
      return NextResponse.json({
        success: true,
        stats,
        duration: Date.now() - startTime,
      });
    }
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    
    // Articles by date
    const date = searchParams.get('date');
    if (date) {
      const articles = await getArticlesByDate(date, limit);
      return NextResponse.json({
        success: true,
        count: articles.length,
        articles: articles.map(formatArticle),
        duration: Date.now() - startTime,
      });
    }
    
    // Articles by ticker
    const ticker = searchParams.get('ticker');
    if (ticker) {
      const articles = await getArticlesByTicker(ticker, limit);
      return NextResponse.json({
        success: true,
        ticker: ticker.toUpperCase(),
        count: articles.length,
        articles: articles.map(formatArticle),
        duration: Date.now() - startTime,
      });
    }
    
    // Articles by source
    const source = searchParams.get('source');
    if (source) {
      const articles = await getArticlesBySource(source, limit);
      return NextResponse.json({
        success: true,
        source,
        count: articles.length,
        articles: articles.map(formatArticle),
        duration: Date.now() - startTime,
      });
    }
    
    // Search
    const query = searchParams.get('q');
    if (query) {
      const articles = await searchArticles(query, limit);
      return NextResponse.json({
        success: true,
        query,
        count: articles.length,
        articles: articles.map(formatArticle),
        duration: Date.now() - startTime,
      });
    }
    
    // Default: recent articles
    const articles = await getRecentArticles(limit);
    return NextResponse.json({
      success: true,
      count: articles.length,
      articles: articles.map(formatArticle),
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error('Articles API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
