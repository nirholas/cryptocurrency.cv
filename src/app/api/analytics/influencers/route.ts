import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJsonCached, isGroqConfigured } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 600; // 10 minute cache

/**
 * Influencer Accuracy Scoring API
 * 
 * Analyzes crypto influencers mentioned in news and scores them by:
 * - Prediction accuracy (historical)
 * - Credibility indicators
 * - Reach and engagement
 * - Topic expertise
 */

interface InfluencerPrediction {
  prediction: string;
  date: string;
  asset?: string;
  outcome?: 'correct' | 'incorrect' | 'pending' | 'partial';
  targetPrice?: string;
  actualPrice?: string;
}

interface Influencer {
  name: string;
  handle?: string;
  platform: 'twitter' | 'youtube' | 'linkedin' | 'substack' | 'blog' | 'podcast' | 'unknown';
  category: 'analyst' | 'trader' | 'developer' | 'vc' | 'founder' | 'journalist' | 'educator';
  mentionCount: number;
  recentMentions: string[];
  credibilityScore: number;
  accuracyScore: number;
  expertise: string[];
  predictions: InfluencerPrediction[];
  sentiment: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trustFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
}

interface InfluencerResponse {
  influencers: Partial<Influencer>[];
}

const SYSTEM_PROMPT = `You are an influencer analysis system specialized in cryptocurrency.

Identify crypto influencers mentioned in news articles and analyze their credibility.

For each influencer found, provide:

1. Name: Full name or known handle
2. Handle: Twitter/X handle if known (without @)
3. Platform: Primary platform (twitter, youtube, linkedin, substack, blog, podcast, unknown)
4. Category: analyst, trader, developer, vc, founder, journalist, educator
5. Expertise: Areas of expertise (e.g., ["DeFi", "Bitcoin", "Technical Analysis"])
6. Credibility indicators:
   - Have they been accurate before?
   - Do they have skin in the game (disclosed positions)?
   - Are they affiliated with legitimate organizations?
   - Do they cite sources?

Assign scores (0-100):
- credibilityScore: Overall trustworthiness (based on track record, transparency, affiliations)
- accuracyScore: Historical prediction accuracy (if known)

Identify sentiment of their recent statements: bullish/bearish/neutral counts.

Respond with JSON: { "influencers": [...] }`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const minCredibility = parseInt(searchParams.get('min_credibility') || '0');
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');
  const sortBy = searchParams.get('sort') || 'credibility'; // credibility, accuracy, mentions

  if (!isGroqConfigured()) return groqNotConfiguredResponse();

  try {
    const data = await getLatestNews(limit);

    if (data.articles.length === 0) {
      return NextResponse.json({ 
        influencers: [], 
        message: 'No articles to analyze' 
      });
    }

    const articlesText = data.articles
      .map((a, i) => `[${i + 1}] "${a.title}" (${a.source})\n${a.description || ''}`)
      .join('\n\n');

    const userPrompt = `Identify and analyze all crypto influencers mentioned in these ${data.articles.length} news articles:

${articlesText}

For each influencer, analyze their credibility and provide scores.`;

    const result = await promptGroqJsonCached<InfluencerResponse>(
      'influencers',
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000 }
    );

    // Process and enhance influencer data
    let influencers: Influencer[] = (result.influencers || []).map(inf => ({
      name: inf.name || 'Unknown',
      handle: inf.handle,
      platform: inf.platform || 'unknown',
      category: inf.category || 'analyst',
      mentionCount: inf.mentionCount || 1,
      recentMentions: inf.recentMentions || [],
      credibilityScore: inf.credibilityScore || 50,
      accuracyScore: inf.accuracyScore || 50,
      expertise: inf.expertise || [],
      predictions: inf.predictions || [],
      sentiment: inf.sentiment || { bullish: 0, bearish: 0, neutral: 1 },
      trustFactors: generateTrustFactors(inf),
    }));

    // Apply filters
    if (minCredibility > 0) {
      influencers = influencers.filter(i => i.credibilityScore >= minCredibility);
    }

    if (category) {
      influencers = influencers.filter(i => i.category === category);
    }

    if (platform) {
      influencers = influencers.filter(i => i.platform === platform);
    }

    // Sort
    switch (sortBy) {
      case 'accuracy':
        influencers.sort((a, b) => b.accuracyScore - a.accuracyScore);
        break;
      case 'mentions':
        influencers.sort((a, b) => b.mentionCount - a.mentionCount);
        break;
      case 'credibility':
      default:
        influencers.sort((a, b) => b.credibilityScore - a.credibilityScore);
    }

    // Calculate aggregated stats
    const stats = {
      totalInfluencers: influencers.length,
      avgCredibility: Math.round(
        influencers.reduce((sum, i) => sum + i.credibilityScore, 0) / Math.max(influencers.length, 1)
      ),
      avgAccuracy: Math.round(
        influencers.reduce((sum, i) => sum + i.accuracyScore, 0) / Math.max(influencers.length, 1)
      ),
      byCategory: influencers.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPlatform: influencers.reduce((acc, i) => {
        acc[i.platform] = (acc[i.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topExpertise: getTopExpertise(influencers),
    };

    // Tiers
    const tiers = {
      trusted: influencers.filter(i => i.credibilityScore >= 80).length,
      moderate: influencers.filter(i => i.credibilityScore >= 50 && i.credibilityScore < 80).length,
      lowCredibility: influencers.filter(i => i.credibilityScore < 50).length,
    };

    return NextResponse.json({
      influencers,
      stats,
      tiers,
      filters: {
        min_credibility: minCredibility,
        category,
        platform,
        sort: sortBy,
        limit,
      },
      generatedAt: new Date().toISOString(),
      disclaimer: 'Credibility scores are AI-generated estimates based on news mentions and should not be taken as definitive assessments. Always do your own research.',
    });
  } catch (error) {
    console.error('Influencer analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze influencers' },
      { status: 500 }
    );
  }
}

function generateTrustFactors(inf: Partial<Influencer>): Influencer['trustFactors'] {
  const factors: Influencer['trustFactors'] = [];
  
  // Analyze based on available data
  if (inf.category === 'vc' || inf.category === 'founder') {
    factors.push({
      factor: 'Institutional Affiliation',
      weight: 15,
      description: 'Associated with venture capital or founded a company',
    });
  }
  
  if (inf.category === 'developer') {
    factors.push({
      factor: 'Technical Expertise',
      weight: 20,
      description: 'Has demonstrated technical/development skills',
    });
  }
  
  if (inf.handle) {
    factors.push({
      factor: 'Verified Identity',
      weight: 10,
      description: 'Has public social media presence',
    });
  }
  
  if ((inf.expertise?.length || 0) >= 3) {
    factors.push({
      factor: 'Broad Expertise',
      weight: 10,
      description: 'Covers multiple areas of cryptocurrency',
    });
  }
  
  if ((inf.mentionCount || 0) > 3) {
    factors.push({
      factor: 'Media Presence',
      weight: 5,
      description: 'Frequently cited in news sources',
    });
  }
  
  // Default factor
  if (factors.length === 0) {
    factors.push({
      factor: 'Limited Data',
      weight: 0,
      description: 'Not enough information to assess credibility',
    });
  }
  
  return factors;
}

function getTopExpertise(influencers: Influencer[]): { topic: string; count: number }[] {
  const expertiseCounts = new Map<string, number>();
  
  for (const inf of influencers) {
    for (const topic of inf.expertise) {
      const normalized = topic.toLowerCase();
      expertiseCounts.set(normalized, (expertiseCounts.get(normalized) || 0) + 1);
    }
  }
  
  return Array.from(expertiseCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
