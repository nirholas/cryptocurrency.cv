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

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { 
  detectNarratives, 
  predictNarrativeTrajectory,
  identifyMarketCycle,
  type Narrative 
} from '@/lib/narrative-tracker';
import { isAIConfigured, isAIUnavailableError } from '@/lib/ai-provider';
import { aiAuthErrorResponse, aiNotConfiguredResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// In-memory narrative history (replace with DB in production)
const narrativeHistory: Narrative[] = [];

export async function GET(request: NextRequest) {
  if (!isAIConfigured()) {
    return aiNotConfiguredResponse();
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
    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to analyze narratives', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
