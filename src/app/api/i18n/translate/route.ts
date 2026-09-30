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
 * i18n Translation API
 * 
 * On-demand translation endpoint using Groq (FREE).
 * Can be used for dynamic content translation or as a webhook.
 * 
 * POST /api/i18n/translate
 * {
 *   "text": "Hello world",
 *   "targetLocale": "es",
 *   "context": "button label"  // optional
 * }
 * 
 * POST /api/i18n/translate (batch)
 * {
 *   "texts": { "key1": "Hello", "key2": "World" },
 *   "targetLocale": "es"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiComplete, isAIConfigured, AIAuthError, promptAIJson } from '@/lib/ai-provider';

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
};

interface TranslateRequest {
  text?: string;
  texts?: Record<string, string>;
  targetLocale: string;
  sourceLocale?: string;
  context?: string;
}

interface TranslateResponse {
  success: boolean;
  translation?: string;
  translations?: Record<string, string>;
  locale: string;
  model: string;
  cached?: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TranslateResponse>> {
  try {
    // Check Groq is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Translation service not configured. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.',
          locale: '',
          model: '',
        },
        { status: 503 }
      );
    }

    const body = await request.json() as TranslateRequest;
    const { text, texts, targetLocale, sourceLocale = 'en', context } = body;

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either "text" or "texts" is required',
          locale: targetLocale,
          model: '',
        },
        { status: 400 }
      );
    }

    if (!targetLocale) {
      return NextResponse.json(
        {
          success: false,
          error: 'targetLocale is required',
          locale: '',
          model: '',
        },
        { status: 400 }
      );
    }

    const targetLanguage = LOCALE_NAMES[targetLocale] || targetLocale;
    const sourceLanguage = LOCALE_NAMES[sourceLocale] || sourceLocale;

    // Single text translation
    if (text) {
      const systemPrompt = `You are a professional translator for a cryptocurrency news application.
Translate the following text from ${sourceLanguage} to ${targetLanguage}.

Rules:
- Preserve all {placeholders} exactly as-is
- Keep technical terms like "DeFi", "NFT", "API", "Bitcoin", "Ethereum" unchanged
- Maintain appropriate tone for a news app
- Output ONLY the translated text, nothing else
${context ? `\nContext: This is a ${context}` : ''}`;

      const response = await aiComplete(
        systemPrompt,
        text,
        { temperature: 0.2, maxTokens: 1024 },
        true
      );

      return NextResponse.json({
        success: true,
        translation: response.trim(),
        locale: targetLocale,
        model: 'auto',
      });
    }

    // Batch translation
    if (texts) {
      const systemPrompt = `You are a professional translator for a cryptocurrency news application.
Translate the following JSON object from ${sourceLanguage} to ${targetLanguage}.

CRITICAL RULES:
1. Keep all JSON keys EXACTLY as they are (do not translate keys)
2. Only translate the string VALUES
3. Preserve all {placeholders} like {count}, {name}, {time} exactly as-is
4. Keep technical terms like "DeFi", "NFT", "API" unchanged
5. Output ONLY valid JSON, no explanations`;

      const translations = await promptAIJson<Record<string, string>>(
        systemPrompt,
        JSON.stringify(texts, null, 2),
        { temperature: 0.2, maxTokens: 4096 },
        true
      );

      return NextResponse.json({
        success: true,
        translations,
        locale: targetLocale,
        model: 'auto',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        locale: targetLocale,
        model: '',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Translation error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service temporarily unavailable: every AI provider is out of quota or unreachable. Please try again later.',
          locale: '',
          model: '',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
        locale: '',
        model: '',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple translations via query params
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const targetLocale = searchParams.get('locale') || searchParams.get('to');
  const sourceLocale = searchParams.get('from') || 'en';

  if (!text || !targetLocale) {
    return NextResponse.json(
      {
        success: false,
        error: 'Required params: text, locale (or to)',
        example: '/api/i18n/translate?text=Hello&locale=es',
      },
      { status: 400 }
    );
  }

  // Reuse POST handler logic
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ text, targetLocale, sourceLocale }),
  });

  return POST(mockRequest);
}
