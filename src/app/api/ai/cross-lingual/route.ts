/**
 * Cross-Lingual Intelligence API
 * 
 * Detects when Asian/European sources break news before Western sources.
 * Identifies regional sentiment divergence and alpha opportunities.
 * 
 * GET /api/ai/cross-lingual
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeRegionalSentiment, 
  getRegionFromLanguage,
  type Region,
  type RegionalArticle 
} from '@/lib/cross-lingual-intelligence';
import { isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// Mock function - in production this would fetch from international sources
async function fetchInternationalNews(): Promise<RegionalArticle[]> {
  // This would call the international news API
  try {
    const response = await fetch('https://cryptocurrency.cv/api/news/international?limit=100&translate=true');
    if (!response.ok) throw new Error('Failed to fetch international news');
    
    const data = await response.json();
    return (data.articles || []).map((a: Record<string, unknown>) => ({
      title: a.title as string,
      titleEnglish: a.titleEnglish as string || a.title as string,
      description: a.description as string,
      source: a.source as string,
      language: a.language as string || 'en',
      region: getRegionFromLanguage(a.language as string || 'en'),
      pubDate: a.pubDate as string,
      link: a.link as string,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  try {
    // Fetch international news
    const articles = await fetchInternationalNews();

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No international news available',
        hint: 'International news API may be unavailable',
      });
    }

    // Group by region
    const byRegion: Record<Region, RegionalArticle[]> = {
      asia: [],
      europe: [],
      latam: [],
      mena: [],
      anglosphere: [],
    };

    for (const article of articles) {
      byRegion[article.region].push(article);
    }

    // Analyze regional sentiment
    const analysis = await analyzeRegionalSentiment(byRegion);

    return NextResponse.json({
      success: true,
      ...analysis,
      articleCounts: {
        asia: byRegion.asia.length,
        europe: byRegion.europe.length,
        latam: byRegion.latam.length,
        mena: byRegion.mena.length,
        anglosphere: byRegion.anglosphere.length,
        total: articles.length,
      },
    });
  } catch (error) {
    console.error('Cross-lingual API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze cross-lingual intelligence', details: String(error) },
      { status: 500 }
    );
  }
}
