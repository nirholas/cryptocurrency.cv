import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface ArticleContent {
  url: string;
  title: string;
  source: string;
  content: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  fetchedAt: string;
}

/**
 * Extract article content from URL by fetching the page
 */
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FreeCryptoNews/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Basic content extraction - remove scripts, styles, and extract text
    let content = html
      // Remove scripts and styles
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove nav, header, footer, aside
      .replace(/<(nav|header|footer|aside)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
      // Get article or main content if available
      .match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] || html;
    
    // Remove remaining HTML tags
    content = content
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length for API
    return content.slice(0, 8000);
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

/**
 * Use Groq to summarize and analyze article content
 */
async function analyzeWithGroq(content: string, title: string, source: string): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
}> {
  if (!GROQ_API_KEY) {
    // Fallback without Groq
    return {
      summary: content.slice(0, 500) + '...',
      keyPoints: ['Full content extracted from source'],
      sentiment: 'neutral',
    };
  }

  const prompt = `You are a crypto news analyst. Analyze this article and provide:
1. A clear, informative summary (2-3 paragraphs)
2. 3-5 key points/takeaways as bullet points
3. Market sentiment: bullish, bearish, or neutral

Article Title: ${title}
Source: ${source}

Article Content:
${content}

Respond in this exact JSON format:
{
  "summary": "Your summary here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "sentiment": "bullish|bearish|neutral"
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error('Groq API failed');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      summary: result.summary || content.slice(0, 500),
      keyPoints: result.keyPoints || [],
      sentiment: result.sentiment || 'neutral',
    };
  } catch (error) {
    console.error('Groq analysis error:', error);
    // Fallback
    return {
      summary: content.slice(0, 500) + '...',
      keyPoints: ['Content extracted from source'],
      sentiment: 'neutral',
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Untitled';
  const source = searchParams.get('source') || 'Unknown';

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    // Fetch article content
    const content = await fetchArticleContent(url);

    // Analyze with Groq
    const analysis = await analyzeWithGroq(content, title, source);

    const articleContent: ArticleContent = {
      url,
      title,
      source,
      content: content.slice(0, 3000), // Include some raw content
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      sentiment: analysis.sentiment,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(articleContent, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Article fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article content' },
      { status: 500 }
    );
  }
}
