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
import { getLatestNews } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300;

interface Claim {
  claim: string;
  source: string;
  articleTitle: string;
  articleLink: string;
  type: 'factual' | 'prediction' | 'opinion' | 'quote';
  confidence: 'verified' | 'likely' | 'unverified' | 'disputed';
  verificationNotes: string;
  relatedTickers: string[];
}

interface FactCheckResponse {
  claims: Claim[];
}

const SYSTEM_PROMPT = `You are a fact-checking assistant for cryptocurrency news. Extract and verify claims from articles.

For each significant claim found:
- claim: The specific claim being made
- source: Who made this claim (the publication, a quoted person, etc.)
- articleTitle: Title of the article
- articleLink: Link to the article
- type: factual (verifiable fact), prediction (future forecast), opinion (subjective view), quote (direct quote from someone)
- confidence: verified (widely confirmed), likely (probably true), unverified (cannot verify), disputed (conflicting reports)
- verificationNotes: Brief note on why you rated it this way
- relatedTickers: Cryptocurrencies this claim is about

Focus on:
- Price claims and predictions
- Partnership/integration announcements
- Regulatory actions
- Security incidents
- Funding rounds
- Technical upgrades

Respond with JSON: { "claims": [...] }`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = intParam(searchParams, 'limit', { fallback: 15, min: 1, max: 30 });
  const type = searchParams.get('type') as 'factual' | 'prediction' | 'opinion' | 'quote' | undefined;
  const confidence = searchParams.get('confidence') as 'verified' | 'likely' | 'unverified' | 'disputed' | undefined;

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    const data = await getLatestNews(limit);
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        claims: [],
        message: 'No articles to analyze',
      });
    }

    const articlesForAnalysis = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
    }));

    const userPrompt = `Extract and fact-check claims from these ${articlesForAnalysis.length} crypto news articles:

${JSON.stringify(articlesForAnalysis, null, 2)}`;

    const result = await promptAIJson<FactCheckResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000, temperature: 0.2 }
    );

    // Filter claims
    let claims = result.claims || [];
    
    if (type) {
      claims = claims.filter(c => c.type === type);
    }
    
    if (confidence) {
      claims = claims.filter(c => c.confidence === confidence);
    }

    // Stats
    const stats = {
      total: claims.length,
      byType: {
        factual: claims.filter(c => c.type === 'factual').length,
        prediction: claims.filter(c => c.type === 'prediction').length,
        opinion: claims.filter(c => c.type === 'opinion').length,
        quote: claims.filter(c => c.type === 'quote').length,
      },
      byConfidence: {
        verified: claims.filter(c => c.confidence === 'verified').length,
        likely: claims.filter(c => c.confidence === 'likely').length,
        unverified: claims.filter(c => c.confidence === 'unverified').length,
        disputed: claims.filter(c => c.confidence === 'disputed').length,
      },
    };

    return NextResponse.json(
      {
        claims,
        stats,
        articlesAnalyzed: data.articles.length,
        analyzedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Fact check error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return NextResponse.json(
      { error: 'Failed to fact-check articles', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
