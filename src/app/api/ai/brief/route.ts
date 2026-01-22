import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBrief, isAIConfigured, BriefFormat } from '@/lib/ai-brief';

export const runtime = 'edge';

/**
 * GET /api/ai/brief
 * Generate a daily crypto news brief
 * 
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format (defaults to today)
 * - format: 'full' | 'summary' (defaults to 'full')
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const format = (searchParams.get('format') || 'full') as BriefFormat;

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate format
    if (!['full', 'summary'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "full" or "summary"' },
        { status: 400 }
      );
    }

    const brief = await generateDailyBrief(date, format);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    console.error('Brief generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate brief',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
