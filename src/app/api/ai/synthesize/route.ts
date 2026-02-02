/**
 * News Synthesis API
 * 
 * Combines multiple articles about the same story into one authoritative summary.
 * 
 * POST /api/ai/synthesize
 * Body: { articles: NewsArticle[] } or { cluster: true } to auto-cluster
 * 
 * GET /api/ai/synthesize?auto=true&limit=5
 * Auto-detects duplicate stories and synthesizes them
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { 
  synthesizeStory, 
  clusterSimilarArticles,
  type NewsArticle 
} from '@/lib/ai-intelligence';
import { isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);
  const threshold = parseFloat(searchParams.get('threshold') || '0.4');

  try {
    // Fetch recent news
    const data = await getLatestNews(100);
    
    // Map to our article format
    const articles: NewsArticle[] = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      source: a.source,
      pubDate: a.pubDate,
      link: a.link,
      category: a.category,
    }));

    // Cluster similar articles
    const clusters = clusterSimilarArticles(articles, threshold);
    
    // Synthesize top clusters
    const syntheses = await Promise.all(
      clusters.slice(0, limit).map(async (cluster) => {
        try {
          return await synthesizeStory(cluster.articles);
        } catch (error) {
          console.error('Synthesis error:', error);
          return null;
        }
      })
    );

    return NextResponse.json({
      success: true,
      synthesizedStories: syntheses.filter(Boolean),
      clustersFound: clusters.length,
      articlesAnalyzed: articles.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Synthesis API error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize stories', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { articles } = body as { articles: NewsArticle[] };

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'articles array is required' },
        { status: 400 }
      );
    }

    const synthesis = await synthesizeStory(articles);

    return NextResponse.json({
      success: true,
      synthesis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Synthesis API error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize story', details: String(error) },
      { status: 500 }
    );
  }
}
