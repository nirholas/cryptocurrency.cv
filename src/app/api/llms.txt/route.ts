/**
 * LLMs.txt API Route
 * 
 * Provides AI-friendly documentation for LLMs like GPT, Claude, Grok, etc.
 * Following the llms.txt standard: https://llmstxt.org
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const full = searchParams.get('full') === 'true';
  
  try {
    // Serve from public directory
    const filename = full ? 'llms-full.txt' : 'llms.txt';
    const filePath = join(process.cwd(), 'public', filename);
    const content = await readFile(filePath, 'utf-8');
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex', // Don't index the txt file itself
      },
    });
  } catch {
    // Fallback inline content if file not found
    const fallbackContent = `# Free Crypto News API

> Real-time cryptocurrency news aggregator with AI analysis.

## Quick Start
\`\`\`bash
curl https://cryptocurrency.cv/api/news
\`\`\`

## Endpoints
- GET /api/news - Latest crypto news
- GET /api/search?q={query} - Search news
- GET /api/trending - Trending topics
- GET /api/ai/sentiment?asset=BTC - AI sentiment
- GET /api/market/coins - Market data

## Links
- Docs: https://cryptocurrency.cv/docs
- GitHub: https://github.com/nirholas/free-crypto-news
`;

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
