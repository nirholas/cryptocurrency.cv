/**
 * Narrative Tracker API
 * 
 * Tracks crypto narratives through their lifecycle:
 * - Emerging: New narratives gaining traction
 * - Active: Currently driving market attention
 * - Declining: Fading narratives
 * 
 * GET /api/ai/narratives
 * GET /api/ai/narratives?predict=bitcoin-etf
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { 
  detectNarratives, 
  predictNarrativeTrajectory,
  identifyMarketCycle,
  type Narrative 
} from '@/lib/narrative-tracker';
import { isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// In-memory narrative history (replace with DB in production)
const narrativeHistory: Narrative[] = [];

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const predictNarrative = searchParams.get('predict');

  try {
    // Fetch recent news
    const data = await getLatestNews(100);
    const headlines = data.articles.map(a => a.title);

    // If predicting specific narrative
    if (predictNarrative) {
      const narrative = narrativeHistory.find(n => 
        n.id === predictNarrative || 
        n.name.toLowerCase().includes(predictNarrative.toLowerCase())
      );

      if (!narrative) {
        return NextResponse.json({
          success: false,
          error: `Narrative "${predictNarrative}" not found`,
          availableNarratives: narrativeHistory.map(n => ({ id: n.id, name: n.name })),
        });
      }

      const relevantHeadlines = headlines.filter(h => 
        h.toLowerCase().includes(predictNarrative.toLowerCase())
      );

      const prediction = await predictNarrativeTrajectory(narrative, relevantHeadlines);

      return NextResponse.json({
        success: true,
        narrative: {
          id: narrative.id,
          name: narrative.name,
          currentPhase: narrative.lifecycle,
          strength: narrative.strength,
        },
        prediction,
        generatedAt: new Date().toISOString(),
      });
    }

    // Detect all narratives
    const analysis = await detectNarratives(headlines, narrativeHistory);

    // Update history
    for (const narrative of [...analysis.activeNarratives, ...analysis.emergingNarratives]) {
      const existing = narrativeHistory.findIndex(n => n.id === narrative.id);
      if (existing >= 0) {
        narrativeHistory[existing] = narrative;
      } else {
        narrativeHistory.push(narrative);
      }
    }

    // Identify market cycle
    const allNarratives = [
      ...analysis.activeNarratives,
      ...analysis.emergingNarratives,
      ...analysis.decliningNarratives,
    ];
    const marketCycle = identifyMarketCycle(allNarratives);

    return NextResponse.json({
      success: true,
      ...analysis,
      marketCycle,
      headlinesAnalyzed: headlines.length,
    });
  } catch (error) {
    console.error('Narratives API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze narratives', details: String(error) },
      { status: 500 }
    );
  }
}
