import { NextRequest, NextResponse } from 'next/server';
import { generateDebate, isAIConfigured, DebateInput } from '@/lib/ai-debate';

export const runtime = 'edge';

interface DebateRequestBody {
  article?: {
    title: string;
    content: string;
  };
  topic?: string;
}

/**
 * POST /api/ai/debate
 * Generate bull vs bear debate on an article or topic
 * 
 * Request Body:
 * - article: { title: string, content: string } - Article to debate
 * - topic: string - Topic to debate (e.g., "Bitcoin reaching $200k in 2026")
 * 
 * At least one of article or topic must be provided
 */
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

    const body: DebateRequestBody = await request.json();
    const { article, topic } = body;

    // Validate input
    if (!article && !topic) {
      return NextResponse.json(
        { error: 'Either article or topic must be provided' },
        { status: 400 }
      );
    }

    // Validate article structure if provided
    if (article) {
      if (!article.title || typeof article.title !== 'string') {
        return NextResponse.json(
          { error: 'Article must have a title' },
          { status: 400 }
        );
      }
      if (!article.content || typeof article.content !== 'string') {
        return NextResponse.json(
          { error: 'Article must have content' },
          { status: 400 }
        );
      }
    }

    // Validate topic if provided
    if (topic && typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic must be a string' },
        { status: 400 }
      );
    }

    const input: DebateInput = {};
    if (article) {
      input.article = article;
    }
    if (topic) {
      input.topic = topic;
    }

    const debate = await generateDebate(input);

    return NextResponse.json({
      success: true,
      debate,
    });
  } catch (error) {
    console.error('Debate generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate debate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/debate
 * Returns usage information for the debate endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/debate',
    method: 'POST',
    description: 'Generate bull vs bear debate on an article or topic',
    configured: isAIConfigured(),
    usage: {
      body: {
        article: {
          type: 'object',
          description: 'Article to debate (optional if topic provided)',
          properties: {
            title: 'string - Article title',
            content: 'string - Article content',
          },
        },
        topic: {
          type: 'string',
          description: 'Topic to debate (optional if article provided)',
          example: 'Bitcoin reaching $200k in 2026',
        },
      },
    },
    response: {
      debate: {
        topic: 'string',
        bullCase: {
          thesis: 'string',
          arguments: 'string[]',
          supportingEvidence: 'string[]',
          priceTarget: 'string (optional)',
          timeframe: 'string (optional)',
          confidence: 'number (0-1)',
        },
        bearCase: {
          thesis: 'string',
          arguments: 'string[]',
          supportingEvidence: 'string[]',
          priceTarget: 'string (optional)',
          timeframe: 'string (optional)',
          confidence: 'number (0-1)',
        },
        neutralAnalysis: {
          keyUncertainties: 'string[]',
          whatToWatch: 'string[]',
          consensus: 'string (optional)',
        },
        generatedAt: 'ISO timestamp',
      },
    },
  });
}
