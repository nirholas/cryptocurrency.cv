import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroq, isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a helpful cryptocurrency news assistant. Answer questions based ONLY on the provided news articles.

Guidelines:
- Be concise and factual
- Cite sources when possible (e.g., "According to CoinDesk...")
- If the answer isn't in the articles, say so
- For price/market questions, note that news may be slightly delayed
- Don't speculate beyond what's in the articles`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('q');

  if (!question) {
    return NextResponse.json(
      { 
        error: 'Missing question',
        usage: 'GET /api/ask?q=What is happening with Bitcoin today?',
        examples: [
          '/api/ask?q=What is the latest Bitcoin news?',
          '/api/ask?q=Are there any DeFi hacks reported?',
          '/api/ask?q=What did the SEC announce?',
          '/api/ask?q=Summarize today\'s top crypto stories',
        ],
      },
      { status: 400 }
    );
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { 
        error: 'AI features not configured',
        message: 'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
      },
      { status: 503 }
    );
  }

  try {
    // Fetch recent news for context
    const data = await getLatestNews(30);
    
    const newsContext = data.articles
      .map((a, i) => `[${i + 1}] ${a.source}: "${a.title}" - ${a.description || 'No description'} (${a.timeAgo})`)
      .join('\n\n');

    const userPrompt = `Based on these recent crypto news articles:

${newsContext}

Question: ${question}`;

    const answer = await promptGroq(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 1024, temperature: 0.4 }
    );

    return NextResponse.json(
      {
        question,
        answer,
        sourcesUsed: data.articles.length,
        answeredAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Ask error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Support POST for longer questions or conversation history
  try {
    const body = await request.json();
    const { question, context } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Missing question in request body' },
        { status: 400 }
      );
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { 
          error: 'AI features not configured',
          message: 'Set GROQ_API_KEY environment variable',
        },
        { status: 503 }
      );
    }

    // Fetch recent news
    const data = await getLatestNews(30);
    
    const newsContext = data.articles
      .map((a, i) => `[${i + 1}] ${a.source}: "${a.title}" - ${a.description || ''} (${a.timeAgo})`)
      .join('\n\n');

    let userPrompt = `Based on these recent crypto news articles:\n\n${newsContext}\n\n`;
    
    if (context) {
      userPrompt += `Previous context: ${context}\n\n`;
    }
    
    userPrompt += `Question: ${question}`;

    const answer = await promptGroq(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 1024, temperature: 0.4 }
    );

    return NextResponse.json({
      question,
      answer,
      sourcesUsed: data.articles.length,
      answeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ask POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}
