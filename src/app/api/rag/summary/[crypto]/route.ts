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
 * RAG Crypto Summary API
 * 
 * GET /api/rag/summary/[crypto]
 * Get a summary of recent news for a cryptocurrency.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { summarizeCryptoNews, normalizeToCode } from '@/lib/rag';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ crypto: string }> }
) {
  try {
    const { crypto } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    if (!crypto) {
      return NextResponse.json(
        { error: 'Cryptocurrency code is required' },
        { status: 400 }
      );
    }

    // Normalize and validate crypto code
    const cryptoCode = normalizeToCode(crypto);
    if (!cryptoCode) {
      return NextResponse.json(
        { error: `Unknown cryptocurrency: ${crypto}` },
        { status: 400 }
      );
    }

    if (days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 90' },
        { status: 400 }
      );
    }

    const summary = await summarizeCryptoNews(cryptoCode, days);

    return NextResponse.json({
      crypto: cryptoCode,
      days,
      ...summary,
    });
  } catch (error) {
    console.error('RAG summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
