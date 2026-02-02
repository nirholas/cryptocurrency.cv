import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

interface SummarizeRequest {
  text: string;
  url?: string;
  type: 'sentence' | 'paragraph' | 'bullets';
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();
    const { text, url, type = 'paragraph' } = body;

    if (!text?.trim() && !url?.trim()) {
      return ApiError.badRequest('Either text or url is required');
    }

    // If URL provided, fetch the content
    let content = text?.trim() || '';
    
    if (url && !content) {
      try {
        // Try to fetch article content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FreeCryptoNews/1.0)',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          // Basic text extraction - strip HTML tags
          content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000); // Limit content length
        }
      } catch {
        return NextResponse.json(
          { error: 'Failed to fetch URL content' },
          { status: 400 }
        );
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: 'No content to summarize' },
        { status: 400 }
      );
    }

    // Generate summary
    const summary = await generateSummary(content, type);

    return NextResponse.json({
      summary,
      type,
      originalLength: content.length,
      summaryLength: summary.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to summarize content' },
      { status: 500 }
    );
  }
}

async function generateSummary(
  content: string,
  type: 'sentence' | 'paragraph' | 'bullets'
): Promise<string> {
  if (!GROQ_API_KEY) {
    // Fallback: simple extraction
    return extractiveSummary(content, type);
  }

  const typeInstructions = {
    sentence: 'Summarize in exactly ONE sentence (under 30 words). Be concise and capture the main point.',
    paragraph: 'Summarize in one short paragraph (2-3 sentences, under 75 words). Capture the key points.',
    bullets: 'Summarize in 3-5 bullet points. Each bullet should be one short sentence.',
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a news summarizer. ${typeInstructions[type]} Focus on facts, not opinions. Write in present tense. Do not add any preamble or explanation - just output the summary.`,
          },
          {
            role: 'user',
            content: content.slice(0, 6000), // Limit to ~6k chars
          },
        ],
        max_tokens: type === 'sentence' ? 100 : type === 'paragraph' ? 200 : 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return extractiveSummary(content, type);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || extractiveSummary(content, type);
  } catch {
    return extractiveSummary(content, type);
  }
}

function extractiveSummary(
  content: string,
  type: 'sentence' | 'paragraph' | 'bullets'
): string {
  // Simple extractive summary - get first sentences
  const sentences = content
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 20 && s.trim().length < 300)
    .slice(0, 5);

  if (sentences.length === 0) {
    return content.slice(0, 200) + '...';
  }

  switch (type) {
    case 'sentence':
      return sentences[0].trim();
    case 'paragraph':
      return sentences.slice(0, 3).join(' ').trim();
    case 'bullets':
      return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
    default:
      return sentences[0].trim();
  }
}

// GET endpoint for simple usage with query params
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const text = searchParams.get('text');
  const type = (searchParams.get('type') as 'sentence' | 'paragraph' | 'bullets') || 'paragraph';

  if (!url && !text) {
    return NextResponse.json(
      { 
        error: 'Missing required parameter',
        usage: {
          endpoint: '/api/ai/summarize',
          methods: ['GET', 'POST'],
          params: {
            url: 'URL of article to summarize (optional if text provided)',
            text: 'Raw text to summarize (optional if url provided)',
            type: 'sentence | paragraph | bullets (default: paragraph)',
          },
          example: '/api/ai/summarize?url=https://example.com/article&type=sentence',
        }
      },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url, text, type }),
  });

  return POST(mockRequest);
}
