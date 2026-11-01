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
 * Real-time Content Translation API
 * POST /api/translate
 *
 * Translates content on-the-fly for dynamic content
 */

import { type NextRequest, NextResponse } from 'next/server';
import { type Locale, locales, localeNames } from '@/i18n/config';

import { resilientFetchResponse } from '@/lib/resilient-fetch';
import { readJsonBody } from '@/lib/json-body';

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { text, texts, targetLocale, context = 'cryptocurrency news' } = body;

    // Validate target locale
    if (!targetLocale || !locales.includes(targetLocale as Locale)) {
      return NextResponse.json(
        { error: 'Invalid target locale', supportedLocales: locales },
        { status: 400 },
      );
    }

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 503 });
    }

    const targetLanguage = localeNames[targetLocale as Locale] || targetLocale;

    // Single text translation
    if (text && typeof text === 'string') {
      const translation = await translateWithGroq(text, targetLanguage, context, groqApiKey);
      return NextResponse.json({
        original: text,
        translation,
        locale: targetLocale,
        language: targetLanguage,
      });
    }

    // Batch translation
    if (texts && Array.isArray(texts)) {
      const translations = await Promise.all(
        texts.map((t: string) => translateWithGroq(t, targetLanguage, context, groqApiKey)),
      );

      return NextResponse.json({
        translations,
        locale: targetLocale,
        language: targetLanguage,
        count: translations.length,
      });
    }

    return NextResponse.json(
      { error: 'Either "text" or "texts" field is required' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

async function translateWithGroq(
  text: string,
  targetLanguage: string,
  context: string,
  apiKey: string,
): Promise<string> {
  if (!text.trim()) return text;

  const prompt = `Translate the following text to ${targetLanguage}.
Context: ${context}
Preserve all formatting, markdown, and special characters.
Only return the translation, no explanations or additional text.

Text:
${text}`;

  const response = await resilientFetchResponse('https://api.groq.com/openai/v1/chat/completions', {
    service: 'groq',
    timeoutMs: 8000,
    retries: 1,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator specializing in cryptocurrency and financial news.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: text.length * 3, // Allow room for longer translations
    }),
  });

  if (!response.ok) {
    console.error('Groq translation failed:', response.status);
    return text; // Return original on error
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Return available locales
  return NextResponse.json({
    availableLocales: locales,
    localeNames,
    totalLanguages: locales.length,
    usage: {
      endpoint: '/api/translate',
      method: 'POST',
      body: {
        text: 'Single text to translate',
        texts: ['Array', 'of', 'texts'],
        targetLocale: 'Language code (e.g., "es", "zh-CN")',
        context: 'Optional context for better translations',
      },
    },
  });
}
