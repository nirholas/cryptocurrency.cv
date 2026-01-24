/**
 * Source Network Forensics API
 *
 * Endpoints for analyzing source relationships, detecting coordination,
 * and tracing content origins.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  createForensicsAnalyzer,
  createSourceGraph,
  type ArticleForTracing,
  type ForensicsReport,
  type CoordinationPattern,
  type OriginTrace,
  type NetworkSummary,
  traceStoryOrigin,
  detectCoordinatedPublishing,
  type PublishEvent,
} from '@/lib/source-forensics';

export const runtime = 'edge';

// Fetch real articles for forensics analysis
async function getRealArticles(): Promise<ArticleForTracing[]> {
  try {
    // Fetch from our actual news API
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${baseUrl}/api/news?limit=100`, {
      next: { revalidate: 300 },
    });
    
    if (response.ok) {
      const data = await response.json();
      const articles = data.articles || [];
      
      return articles.map((article: {
        id: string;
        sourceKey?: string;
        source?: string;
        title: string;
        description?: string;
        pubDate?: string;
        publishedAt?: string;
      }) => ({
        id: article.id,
        sourceId: article.sourceKey || article.source?.toLowerCase().replace(/\s+/g, '') || 'unknown',
        title: article.title,
        content: article.description || '',
        publishedAt: new Date(article.pubDate || article.publishedAt || Date.now()),
      }));
    }
  } catch (error) {
    console.error('Failed to fetch articles for forensics:', error);
  }
  
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'report';
    const sourceId = searchParams.get('source');
    const articleId = searchParams.get('article');

    const analyzer = createForensicsAnalyzer();
    const articles = await getRealArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles available for forensics analysis',
      }, { status: 404 });
    }

    switch (action) {
      case 'report': {
        // Full forensics report
        const report = analyzer.runAnalysis(articles, {
          start: new Date(Date.now() - 86400000),
          end: new Date(),
        });
        return NextResponse.json({
          success: true,
          data: report,
        });
      }

      case 'network': {
        // Network analysis only
        const report = analyzer.runAnalysis(articles, {
          start: new Date(Date.now() - 86400000),
          end: new Date(),
        });
        return NextResponse.json({
          success: true,
          data: {
            summary: report.networkSummary,
            nodeCount: report.totalSources,
            edgeCount: report.networkSummary.edgeCount,
          },
        });
      }

      case 'coordination': {
        // Detect coordination patterns
        const events: PublishEvent[] = articles.map((a) => ({
          articleId: a.id,
          sourceId: a.sourceId,
          publishedAt: a.publishedAt,
          title: a.title,
          topics: ['crypto', 'bitcoin'],
        }));
        const patterns = detectCoordinatedPublishing(events);
        return NextResponse.json({
          success: true,
          data: {
            patterns,
            count: patterns.length,
            highConfidence: patterns.filter((p) => p.confidence > 0.8).length,
          },
        });
      }

      case 'trace': {
        // Trace article origin
        if (!articleId) {
          return NextResponse.json(
            { success: false, error: 'Article ID required' },
            { status: 400 }
          );
        }
        const targetArticle = articles.find((a) => a.id === articleId);
        if (!targetArticle) {
          return NextResponse.json(
            { success: false, error: 'Article not found' },
            { status: 404 }
          );
        }
        const trace = traceStoryOrigin(
          targetArticle,
          articles.filter((a) => a.id !== articleId)
        );
        return NextResponse.json({
          success: true,
          data: trace,
        });
      }

      case 'source': {
        // Source-specific analysis
        if (!sourceId) {
          return NextResponse.json(
            { success: false, error: 'Source ID required' },
            { status: 400 }
          );
        }
        const report = analyzer.runAnalysis(articles, {
          start: new Date(Date.now() - 86400000),
          end: new Date(),
        });
        const sourceRanking = report.influenceRankings.find(
          (r) => r.sourceId === sourceId
        );
        const sourcePatterns = report.coordinationAlerts.filter(
          (p) => p.sources.includes(sourceId)
        );
        return NextResponse.json({
          success: true,
          data: {
            sourceId,
            ranking: sourceRanking,
            coordinationPatterns: sourcePatterns,
            suspiciousActivity: report.suspiciousPatterns.filter(
              (p) => p.sources.includes(sourceId)
            ),
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Forensics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, articles, events } = body;

    switch (action) {
      case 'analyze': {
        // Analyze custom articles
        if (!articles || !Array.isArray(articles)) {
          return NextResponse.json(
            { success: false, error: 'Articles array required' },
            { status: 400 }
          );
        }

        const parsedArticles: ArticleForTracing[] = articles.map((a: {
          id: string;
          sourceId: string;
          title: string;
          content: string;
          publishedAt: string;
          citations?: string[];
        }) => ({
          id: a.id,
          sourceId: a.sourceId,
          title: a.title,
          content: a.content,
          publishedAt: new Date(a.publishedAt),
          citations: a.citations,
        }));

        const analyzer = createForensicsAnalyzer();
        const report = analyzer.runAnalysis(parsedArticles, {
          start: new Date(
            Math.min(...parsedArticles.map((a) => a.publishedAt.getTime()))
          ),
          end: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: report,
        });
      }

      case 'detect-coordination': {
        // Detect coordination in custom events
        if (!events || !Array.isArray(events)) {
          return NextResponse.json(
            { success: false, error: 'Events array required' },
            { status: 400 }
          );
        }

        const parsedEvents: PublishEvent[] = events.map((e: {
          articleId: string;
          sourceId: string;
          publishedAt: string;
          title: string;
          topics?: string[];
        }) => ({
          articleId: e.articleId,
          sourceId: e.sourceId,
          publishedAt: new Date(e.publishedAt),
          title: e.title,
          topics: e.topics || [],
        }));

        const patterns = detectCoordinatedPublishing(parsedEvents);

        return NextResponse.json({
          success: true,
          data: {
            patterns,
            count: patterns.length,
            analysis: {
              highConfidence: patterns.filter((p) => p.confidence > 0.8).length,
              mediumConfidence: patterns.filter(
                (p) => p.confidence > 0.5 && p.confidence <= 0.8
              ).length,
              lowConfidence: patterns.filter((p) => p.confidence <= 0.5).length,
            },
          },
        });
      }

      case 'trace-origin': {
        // Trace origin for a specific article
        const { target, candidates } = body;
        if (!target || !candidates) {
          return NextResponse.json(
            { success: false, error: 'Target and candidates required' },
            { status: 400 }
          );
        }

        const targetArticle: ArticleForTracing = {
          id: target.id,
          sourceId: target.sourceId,
          title: target.title,
          content: target.content,
          publishedAt: new Date(target.publishedAt),
          citations: target.citations,
        };

        const candidateArticles: ArticleForTracing[] = candidates.map(
          (c: {
            id: string;
            sourceId: string;
            title: string;
            content: string;
            publishedAt: string;
            citations?: string[];
          }) => ({
            id: c.id,
            sourceId: c.sourceId,
            title: c.title,
            content: c.content,
            publishedAt: new Date(c.publishedAt),
            citations: c.citations,
          })
        );

        const trace = traceStoryOrigin(targetArticle, candidateArticles);

        return NextResponse.json({
          success: true,
          data: trace,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Forensics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
