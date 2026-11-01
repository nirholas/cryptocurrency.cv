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
  summarizeArticle,
  analyzeSentiment,
  extractFacts,
  factCheck,
  generateQuestions,
  categorizeArticle,
  translateContent,
  isAIConfigured,
  getAIProviderInfo,
} from '@/lib/ai-enhanced';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';

interface AIRequestBody {
  action: 'summarize' | 'sentiment' | 'facts' | 'factcheck' | 'questions' | 'categorize' | 'translate';
  title?: string;
  content: string;
  options?: {
    length?: 'short' | 'medium' | 'long';
    targetLanguage?: string;
  };
}

export async function GET() {
  const configured = isAIConfigured();
  const providerInfo = getAIProviderInfo();

  return NextResponse.json({
    configured,
    provider: providerInfo,
    availableActions: [
      'summarize',
      'sentiment',
      'facts',
      'factcheck',
      'questions',
      'categorize',
      'translate',
    ],
    usage: {
      endpoint: '/api/ai',
      method: 'POST',
      body: {
        action: 'string - one of the available actions',
        title: 'string - article title (optional for some actions)',
        content: 'string - article content to analyze',
        options: {
          length: 'short | medium | long - for summarize action',
          targetLanguage: 'string - for translate action',
        },
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'AI not configured',
          message: 'No AI provider API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY',
        },
        { status: 503 }
      );
    }

    const jsonBody = await readJsonBody<AIRequestBody>(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { action, title = '', content, options = {} } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content field' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      );
    }

    let result: unknown;

    switch (action) {
      case 'summarize':
        result = await summarizeArticle(title, content, {
          length: options.length,
        });
        break;

      case 'sentiment':
        result = await analyzeSentiment(title, content);
        break;

      case 'facts':
        result = await extractFacts(title, content);
        break;

      case 'factcheck':
        result = await factCheck(title, content);
        break;

      case 'questions':
        result = await generateQuestions(title, content);
        break;

      case 'categorize':
        result = await categorizeArticle(title, content);
        break;

      case 'translate':
        if (!options.targetLanguage) {
          return NextResponse.json(
            { error: 'Missing targetLanguage in options for translate action' },
            { status: 400 }
          );
        }
        result = await translateContent(content, options.targetLanguage);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      provider: getAIProviderInfo(),
      result,
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      {
        error: 'AI processing failed',
      },
      { status: 500 }
    );
  }
}
