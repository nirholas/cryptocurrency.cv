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
import { aiComplete, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';
import { readJsonBody } from '@/lib/json-body';

interface Relationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const { text } = jsonBody.body;
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const systemPrompt = 'You are an expert at extracting relationships from text. Always respond with valid JSON only.';
    const userPrompt = `Extract all relationships from this text as JSON array. Each relationship should have: subject (who/what), predicate (action/relationship), object (to whom/what), confidence (0-1).

Text: ${text}

Return ONLY valid JSON array like: [{"subject":"Bitcoin","predicate":"surpassed","object":"$100K","confidence":0.95}]`;

    const response = await aiComplete(systemPrompt, userPrompt, {}, true);
    
    // Parse JSON from response
    let relationships: Relationship[] = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        relationships = JSON.parse(jsonMatch[0]);
      }
    } catch {
      relationships = [];
    }
    
    return NextResponse.json({
      text_length: text.length,
      relationships,
      count: relationships.length
    });
  } catch (error) {
    console.error('Relationship extraction error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
